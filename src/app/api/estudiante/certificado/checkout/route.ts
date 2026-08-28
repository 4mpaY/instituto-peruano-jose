export const dynamic = 'force-dynamic'

import { Prisma, type TipoDocumento } from '@prisma/client'

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
    const bancoPago = (body.bancoPago as string | undefined)?.trim() || null
    const solicitaEnvio = body.solicitaEnvio === true
    const datosEnvio = body.datosEnvio as any

    const datosPerfil = body.datosPerfil as
      | {
          nombre?: string
          apellido?: string
          correo?: string
          tipo_documento?: string
          numero_documento?: string
          celular?: string
        }
      | undefined

    if (!cursoId) {
      return ApiResponse.error(request, 'El ID del curso es requerido', 400)
    }

    if (!bancoPago) {
      return ApiResponse.error(request, 'Debes indicar el banco o billetera donde realizaste el pago', 400)
    }

    if (!numeroComprobante) {
      return ApiResponse.error(request, 'Debes indicar el código o número de operación', 400)
    }

    const nombre = datosPerfil?.nombre?.trim() || ''
    const apellido = datosPerfil?.apellido?.trim() || ''
    const tipoDocumento = datosPerfil?.tipo_documento?.trim() || 'DNI'
    const numeroDocumento = datosPerfil?.numero_documento?.trim() || ''
    const celular = datosPerfil?.celular?.trim() || ''

    if (!nombre || !apellido || !numeroDocumento || !celular) {
      return ApiResponse.error(
        request,
        'Debes completar todos los datos personales (nombres, apellidos, documento y celular) para tramitar el certificado.',
        400
      )
    }

    if (tipoDocumento === 'DNI' && !/^\d{8}$/.test(numeroDocumento)) {
      return ApiResponse.error(request, 'El DNI debe tener exactamente 8 dígitos', 400)
    }

    const { isValidCelular } = await import('@/utils/functions/validatePhone')

    if (!isValidCelular(celular)) {
      return ApiResponse.error(request, 'El número de celular no es válido', 400)
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
          AND p.estado = 'PENDIENTE'
          AND d.curso_id = ${cursoId}
          AND (
            p.tipo = 'CERTIFICADO'::"TipoPedido"
            OR d.certificado_tipo IS NOT NULL
          )
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
      Array<{ precio_certificado_ipg: any; precio_certificado_cip: any; precio_certificado: any; precio_envio_fisico: any }>
    >`
      SELECT precio_certificado_ipg, precio_certificado_cip, precio_certificado, precio_envio_fisico
      FROM cursos WHERE id = ${cursoId}
    `

    let precio =
      certificadoTipo === 'CIP'
        ? resolvePrecioCertificadoCip(preciosRow || curso)
        : resolvePrecioCertificadoIpg(preciosRow || curso)

    if (precio == null) {
      return ApiResponse.error(request, 'Este certificado no tiene precio configurado', 400)
    }

    if (solicitaEnvio) {
      const costoEnvio = preciosRow?.precio_envio_fisico != null ? Number(preciosRow.precio_envio_fisico) : 0

      precio += costoEnvio
    }

    if (pedidoPendiente.length > 0) {
      return ApiResponse.error(
        request,
        'Ya tienes un pedido pendiente de certificado para este curso. Solo puedes obtener un tipo (IPG o CIP).',
        400
      )
    }

    const hab = await getInscripcionCertificadoHabilitacion(auth.user.id, cursoId)

    if (hab?.certificado_ipg_habilitado || hab?.certificado_cip_habilitado) {
      return ApiResponse.error(
        request,
        'Ya tienes un certificado habilitado para este curso. Solo puedes obtener un tipo (IPG o CIP).',
        400
      )
    }

    // Limpiar certificados huérfanos (sin habilitación) que bloqueaban un nuevo trámite
    await prisma.certificado.deleteMany({
      where: { usuario_id: auth.user.id, curso_id: cursoId },
    })

    // Pedido COMPLETADO de certificado ya existente
    const pedidoCertCompletado = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT p.id
      FROM pedidos p
      JOIN detalles_pedido d ON d.pedido_id = p.id
      WHERE p.usuario_id = ${auth.user.id}
        AND p.tipo = 'CERTIFICADO'::"TipoPedido"
        AND p.estado = 'COMPLETADO'
        AND d.curso_id = ${cursoId}
      LIMIT 1
    `

    if (pedidoCertCompletado.length > 0) {
      return ApiResponse.error(
        request,
        'Ya registraste el pago de un certificado para este curso. Solo puedes obtener un tipo (IPG o CIP).',
        400
      )
    }

    // Actualizar perfil (datos obligatorios)
    try {
      await prisma.usuario.update({
        where: { id: auth.user.id },
        data: {
          nombre,
          apellido,
          tipo_documento: tipoDocumento as TipoDocumento,
          numero_documento: numeroDocumento,
          celular,
        },
      })
    } catch (perfilErr) {
      console.warn('[certificado/checkout] No se pudo actualizar el perfil:', perfilErr)
    }

    const moneda = curso.moneda || 'PEN'
    const tituloLinea = labelDetalleCertificado(curso.titulo, certificadoTipo)

    let pedido: { id: string; numero_pedido: number; total: unknown; moneda: string }

    try {
      pedido = await prisma.$transaction(async tx => {
        const created = await tx.pedido.create({
          data: {
            usuario_id: auth.user.id,
            total: precio,
            moneda,
            estado: 'PENDIENTE',
            tipo: 'CERTIFICADO',
            metodo_pago: 'TRANSFERENCIA',
            mensaje: `Trámite de certificado: ${tituloLinea}`,
            numero_comprobante: numeroComprobante,
            tipo_comprobante: 'OPERACION',
            referencia_pago: bancoPago,
            solicita_envio: solicitaEnvio,
            datos_envio: solicitaEnvio ? datosEnvio : null,
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

        // Asegurar tipo/detalle aunque el client Prisma esté desfasado
        await tx.$executeRaw`
          UPDATE pedidos SET tipo = 'CERTIFICADO'::"TipoPedido" WHERE id = ${created.id}
        `
        await tx.$executeRaw`
          UPDATE detalles_pedido
          SET certificado_tipo = ${certificadoTipo}::"CertificadoTipo"
          WHERE pedido_id = ${created.id}
        `

        return created
      })
    } catch (createErr) {
      console.warn('[certificado/checkout] create con tipo falló, reintento básico:', createErr)

      pedido = await prisma.$transaction(async tx => {
        const created = await tx.pedido.create({
          data: {
            usuario_id: auth.user.id,
            total: precio,
            moneda,
            estado: 'PENDIENTE',
            metodo_pago: 'TRANSFERENCIA',
            mensaje: `Trámite de certificado: ${tituloLinea}`,
            numero_comprobante: numeroComprobante,
            tipo_comprobante: 'OPERACION',
            referencia_pago: bancoPago,
            solicita_envio: solicitaEnvio,
            datos_envio: solicitaEnvio ? datosEnvio : null,
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

        await tx.$executeRaw`
          UPDATE pedidos SET tipo = 'CERTIFICADO'::"TipoPedido" WHERE id = ${created.id}
        `
        await tx.$executeRaw`
          UPDATE detalles_pedido
          SET certificado_tipo = ${certificadoTipo}::"CertificadoTipo"
          WHERE pedido_id = ${created.id}
        `

        return created
      })
    }

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
