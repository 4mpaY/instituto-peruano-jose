export const dynamic = 'force-dynamic'

import { Prisma } from '@prisma/client'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { calcularElegibilidad } from '@/app/api/_shared/certificados/ensureCertificado'
import { getInscripcionCertificadoHabilitacion } from '@/app/api/_shared/certificados/getInscripcionCertificadoHabilitacion'
import { labelDetalleCertificado } from '@/utils/libs/order-service'
import {
  resolvePrecioCertificadoCip,
  resolvePrecioCertificadoIpg,
} from '@/utils/functions/certificadoPrecios'

/**
 * POST /api/estudiante/certificado/checkout
 * Crea un pedido tipo CERTIFICADO (pendiente) para tramitar IPG o CIP.
 * Body: { cursoId, certificadoTipo: 'IPG'|'CIP', metodoPagoManualId?, datosPerfil? }
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const body = await request.json()
    const cursoId = body.cursoId as string
    const certificadoTipo = String(body.certificadoTipo || '').toUpperCase() === 'CIP' ? 'CIP' : 'IPG'
    const metodoPagoManualId = body.metodoPagoManualId as string | undefined
    const numeroComprobante = (body.numeroComprobante as string | undefined)?.trim() || null

    const datosPerfil = body.datosPerfil as
      | {
          nombre?: string
          apellido?: string
          correo?: string
          numero_documento?: string
          celular?: string
        }
      | undefined

    if (!cursoId) {
      return ApiResponse.error(request, 'El ID del curso es requerido', 400)
    }

    const [inscripcion, curso, elegibilidad, pedidoPendiente] = await Promise.all([
      prisma.inscripcion.findUnique({
        where: {
          usuario_id_curso_id: { usuario_id: auth.user.id, curso_id: cursoId },
        },
      }),
      prisma.curso.findUnique({
        where: { id: cursoId },
        select: {
          id: true,
          titulo: true,
          moneda: true,
          precio_certificado: true,
        },
      }),
      calcularElegibilidad(auth.user.id, cursoId),
      prisma.$queryRaw<Array<{ id: string }>>`
        SELECT p.id
        FROM pedidos p
        JOIN detalles_pedido d ON d.pedido_id = p.id
        WHERE p.usuario_id = ${auth.user.id}
          AND p.tipo = 'CERTIFICADO'::"TipoPedido"
          AND p.estado = 'PENDIENTE'
          AND d.curso_id = ${cursoId}
          AND d.certificado_tipo = ${certificadoTipo}::"CertificadoTipo"
        LIMIT 1
      `,
    ])

    if (!inscripcion || inscripcion.estado !== 'ACTIVO') {
      return ApiResponse.error(request, 'Debes estar inscrito en el curso para tramitar el certificado', 403)
    }

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    if (!elegibilidad.puedeTramitar) {
      return ApiResponse.error(
        request,
        elegibilidad.totalExamenes > 0
          ? `Debes aprobar las evaluaciones del curso antes de tramitar el certificado (promedio: ${elegibilidad.promedioScore}% / mínimo: ${elegibilidad.promedioMinimo}%).`
          : 'No puedes tramitar el certificado en este momento.',
        403
      )
    }

    // Precios (columnas nuevas vía raw por si el client Prisma no está regenerado)
    const [preciosRow] = await prisma.$queryRaw<
      Array<{ precio_certificado_ipg: any; precio_certificado_cip: any; precio_certificado: any }>
    >`
      SELECT precio_certificado_ipg, precio_certificado_cip, precio_certificado
      FROM cursos WHERE id = ${cursoId}
    `

    const precio =
      certificadoTipo === 'CIP'
        ? resolvePrecioCertificadoCip(preciosRow || curso)
        : resolvePrecioCertificadoIpg(preciosRow || curso)

    if (precio == null) {
      return ApiResponse.error(request, 'Este certificado no tiene precio configurado', 400)
    }

    if (pedidoPendiente.length > 0) {
      return ApiResponse.error(
        request,
        'Ya tienes un pedido pendiente de certificado para este curso. Espera la validación o cancélalo.',
        400
      )
    }

    const hab = await getInscripcionCertificadoHabilitacion(auth.user.id, cursoId)

    const yaHabilitado =
      certificadoTipo === 'CIP'
        ? !!hab?.certificado_cip_habilitado
        : !!hab?.certificado_ipg_habilitado

    if (yaHabilitado) {
      return ApiResponse.error(
        request,
        `Ya tienes habilitado el certificado ${certificadoTipo === 'CIP' ? 'CIP' : 'IPG'} para este curso.`,
        400
      )
    }

    const certExistente = await prisma.certificado.findFirst({
      where: { usuario_id: auth.user.id, curso_id: cursoId, tipo: certificadoTipo },
      select: { id: true },
    })

    if (certExistente) {
      return ApiResponse.error(
        request,
        `Ya tienes el certificado ${certificadoTipo === 'CIP' ? 'CIP' : 'IPG'} emitido para este curso.`,
        400
      )
    }

    // Actualizar perfil si enviaron datos (no bloquear el pedido si falla)
    if (datosPerfil) {
      try {
        await prisma.usuario.update({
          where: { id: auth.user.id },
          data: {
            ...(datosPerfil.nombre != null && datosPerfil.nombre.trim()
              ? { nombre: datosPerfil.nombre.trim() }
              : {}),
            ...(datosPerfil.apellido != null && datosPerfil.apellido.trim()
              ? { apellido: datosPerfil.apellido.trim() }
              : {}),
            ...(datosPerfil.numero_documento != null && datosPerfil.numero_documento.trim()
              ? { numero_documento: datosPerfil.numero_documento.trim() }
              : {}),
            ...(datosPerfil.celular != null && datosPerfil.celular.trim()
              ? { celular: datosPerfil.celular.trim() }
              : {}),
          },
        })
      } catch (perfilErr) {
        console.warn('[certificado/checkout] No se pudo actualizar el perfil:', perfilErr)
      }
    }

    const moneda = curso.moneda || 'PEN'
    const tituloLinea = labelDetalleCertificado(curso.titulo, certificadoTipo)

    let pedido: { id: string; numero_pedido: number; total: unknown; moneda: string }

    try {
      pedido = await prisma.pedido.create({
        data: {
          usuario_id: auth.user.id,
          total: precio,
          moneda,
          estado: 'PENDIENTE',
          tipo: 'CERTIFICADO',
          metodo_pago: 'TRANSFERENCIA',
          mensaje: `Trámite de certificado: ${tituloLinea}`,
          numero_comprobante: numeroComprobante,
          tipo_comprobante: numeroComprobante ? 'OPERACION' : null,
          ...(metodoPagoManualId ? { metodo_pago_manual_id: metodoPagoManualId } : {}),
          detalles: {
            create: [
              {
                curso_id: cursoId,
                cantidad: 1,
                precio_unitario: precio,
                subtotal: precio,
                total: precio,
                descuento: 0,
                certificado_tipo: certificadoTipo,
              },
            ],
          },
        },
      })
    } catch (createErr) {
      console.warn('[certificado/checkout] create con tipo falló, reintento básico:', createErr)
      pedido = await prisma.pedido.create({
        data: {
          usuario_id: auth.user.id,
          total: precio,
          moneda,
          estado: 'PENDIENTE',
          metodo_pago: 'TRANSFERENCIA',
          mensaje: `Trámite de certificado: ${tituloLinea}`,
          numero_comprobante: numeroComprobante,
          tipo_comprobante: numeroComprobante ? 'OPERACION' : null,
          ...(metodoPagoManualId ? { metodo_pago_manual_id: metodoPagoManualId } : {}),
          detalles: {
            create: [
              {
                curso_id: cursoId,
                cantidad: 1,
                precio_unitario: precio,
                subtotal: precio,
                total: precio,
                descuento: 0,
              },
            ],
          },
        },
      })
    }

    await prisma.$executeRaw`
      UPDATE pedidos SET tipo = 'CERTIFICADO'::"TipoPedido" WHERE id = ${pedido.id}
    `
    await prisma.$executeRaw`
      UPDATE detalles_pedido
      SET certificado_tipo = ${certificadoTipo}::"CertificadoTipo"
      WHERE pedido_id = ${pedido.id}
    `

    return ApiResponse.success(
      request,
      {
        pedidoId: pedido.id,
        numeroPedido: pedido.numero_pedido,
        total: Number(pedido.total),
        moneda: pedido.moneda,
        titulo: tituloLinea,
        certificadoTipo,
      },
      201
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return ApiResponse.error(request, error.message, 400)
    }

    return handleApiError(error, request)
  }
}
