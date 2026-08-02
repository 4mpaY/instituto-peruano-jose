export const dynamic = 'force-dynamic'

import { Prisma } from '@prisma/client'

import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { completeOrder, labelDetalleCertificado } from '@/utils/libs/order-service'
import {
  getInscripcionCertificadoHabilitacion,
  setInscripcionCertificadoHabilitacion,
} from '@/app/api/_shared/certificados/getInscripcionCertificadoHabilitacion'
import {
  resolvePrecioCertificadoCip,
  resolvePrecioCertificadoIpg,
} from '@/utils/functions/certificadoPrecios'

type TipoCertificadoPago = 'ipg' | 'cip'

const METODOS_VALIDOS = new Set([
  'TRANSFERENCIA',
  'YAPE',
  'PLIN',
  'TARJETA_CREDITO',
  'TARJETA_DEBITO',
  'OTRO',
  'PAYPAL',
  'IZIPAY',
  'CULQI',
  'MERCADOPAGO',
])

/**
 * PATCH /api/admin/inscripciones/[id]/certificado
 * - Deshabilitar: solo cambia el flag.
 * - Habilitar: exige registrar un pedido CERTIFICADO (con fecha de pago) o completar uno pendiente.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const body = await request.json()

    const {
      habilitado,
      tipo,
      pagado_en,
      monto,
      metodo_pago,
      numero_comprobante,
    } = body as {
      habilitado?: boolean
      tipo?: TipoCertificadoPago
      pagado_en?: string
      monto?: number
      metodo_pago?: string
      numero_comprobante?: string
    }

    if (typeof habilitado !== 'boolean') {
      return ApiResponse.error(request, 'El campo habilitado debe ser un booleano', 400)
    }

    const tipoCert: TipoCertificadoPago = tipo === 'cip' ? 'cip' : 'ipg'
    const certificadoTipo = tipoCert === 'cip' ? 'CIP' : 'IPG'

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        usuario_id: true,
        curso_id: true,
        estado: true,
        curso: {
          select: {
            id: true,
            titulo: true,
            moneda: true,
            precio_certificado: true,
          },
        },
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    })

    if (!inscripcion) {
      return ApiResponse.error(request, 'Inscripción no encontrada', 404)
    }

    // ── Deshabilitar: sin pedido ─────────────────────────────────────
    if (!habilitado) {
      const actualizada = await setInscripcionCertificadoHabilitacion(params.id, tipoCert, false)

      return ApiResponse.success(request, { inscripcion: actualizada })
    }

    // ── Habilitar: exige registro de pago vía pedido ─────────────────
    if (!pagado_en) {
      return ApiResponse.error(
        request,
        'Para habilitar el certificado debes registrar la fecha de pago (se creará un pedido).',
        400
      )
    }

    const fechaPago = new Date(pagado_en)

    if (Number.isNaN(fechaPago.getTime())) {
      return ApiResponse.error(request, 'La fecha de pago no es válida', 400)
    }

    const metodo = String(metodo_pago || 'TRANSFERENCIA').toUpperCase()

    if (!METODOS_VALIDOS.has(metodo)) {
      return ApiResponse.error(request, 'Método de pago no válido', 400)
    }

    const hab = await getInscripcionCertificadoHabilitacion(inscripcion.usuario_id, inscripcion.curso_id)

    const yaHabilitado =
      tipoCert === 'cip' ? !!hab?.certificado_cip_habilitado : !!hab?.certificado_ipg_habilitado

    if (yaHabilitado) {
      return ApiResponse.error(
        request,
        `El certificado ${certificadoTipo} ya está habilitado para este alumno.`,
        400
      )
    }

    const [preciosRow] = await prisma.$queryRaw<
      Array<{ precio_certificado_ipg: unknown; precio_certificado_cip: unknown; precio_certificado: unknown }>
    >`
      SELECT precio_certificado_ipg, precio_certificado_cip, precio_certificado
      FROM cursos WHERE id = ${inscripcion.curso_id}
    `

    const precioDefault =
      tipoCert === 'cip'
        ? resolvePrecioCertificadoCip(preciosRow || inscripcion.curso)
        : resolvePrecioCertificadoIpg(preciosRow || inscripcion.curso)

    const total =
      monto != null && Number(monto) >= 0
        ? Number(monto)
        : precioDefault != null
          ? Number(precioDefault)
          : 0

    // Pedido pendiente del mismo tipo → completarlo (registra pagado_en y habilita)
    const pendientes = await prisma.$queryRaw<Array<{ id: string; numero_pedido: number }>>`
      SELECT p.id, p.numero_pedido
      FROM pedidos p
      JOIN detalles_pedido d ON d.pedido_id = p.id
      WHERE p.usuario_id = ${inscripcion.usuario_id}
        AND p.tipo = 'CERTIFICADO'::"TipoPedido"
        AND p.estado = 'PENDIENTE'
        AND d.curso_id = ${inscripcion.curso_id}
        AND d.certificado_tipo = ${certificadoTipo}::"CertificadoTipo"
      ORDER BY p.creado_en DESC
      LIMIT 1
    `

    if (pendientes.length > 0) {
      const pedidoId = pendientes[0].id

      if (numero_comprobante?.trim()) {
        await prisma.pedido.update({
          where: { id: pedidoId },
          data: {
            numero_comprobante: numero_comprobante.trim(),
            tipo_comprobante: 'OPERACION',
          },
        })
      }

      const result = await completeOrder(pedidoId, {
        metodo_pago: metodo as any,
        pagado_en: fechaPago,
        respuesta_pago: {
          completado_por_admin: auth.user.id,
          origen: 'alumnos_inscritos',
          completado_en: new Date().toISOString(),
        },
      })

      return ApiResponse.success(request, {
        message: `Pedido #${pendientes[0].numero_pedido} completado y certificado ${certificadoTipo} habilitado`,
        pedidoId,
        numeroPedido: pendientes[0].numero_pedido,
        inscripcion: result.inscripciones?.[0] ?? null,
        desdePedidoPendiente: true,
      })
    }

    // ¿Ya existe pedido COMPLETADO de este tipo? Solo habilitar (no duplicar pedido)
    const completados = await prisma.$queryRaw<Array<{ id: string; numero_pedido: number }>>`
      SELECT p.id, p.numero_pedido
      FROM pedidos p
      JOIN detalles_pedido d ON d.pedido_id = p.id
      WHERE p.usuario_id = ${inscripcion.usuario_id}
        AND p.tipo = 'CERTIFICADO'::"TipoPedido"
        AND p.estado = 'COMPLETADO'
        AND d.curso_id = ${inscripcion.curso_id}
        AND d.certificado_tipo = ${certificadoTipo}::"CertificadoTipo"
      ORDER BY p.pagado_en DESC NULLS LAST
      LIMIT 1
    `

    if (completados.length > 0) {
      const actualizada = await setInscripcionCertificadoHabilitacion(params.id, tipoCert, true)

      return ApiResponse.success(request, {
        message: `Certificado ${certificadoTipo} habilitado (pedido #${completados[0].numero_pedido} ya existía)`,
        pedidoId: completados[0].id,
        numeroPedido: completados[0].numero_pedido,
        inscripcion: actualizada,
        desdePedidoExistente: true,
      })
    }

    // Crear pedido CERTIFICADO COMPLETADO + habilitar
    const moneda = inscripcion.curso.moneda || 'PEN'
    const tituloLinea = labelDetalleCertificado(inscripcion.curso.titulo, certificadoTipo)

    let pedido: { id: string; numero_pedido: number }

    try {
      pedido = await prisma.pedido.create({
        data: {
          usuario_id: inscripcion.usuario_id,
          total,
          moneda,
          estado: 'COMPLETADO',
          metodo_pago: metodo as any,
          mensaje: `Habilitación manual de certificado por administrador: ${tituloLinea}`,
          pagado_en: fechaPago,
          numero_comprobante: numero_comprobante?.trim() || null,
          tipo_comprobante: numero_comprobante?.trim() ? 'OPERACION' : null,
          detalles: {
            create: [
              {
                curso_id: inscripcion.curso_id,
                cantidad: 1,
                precio_unitario: total,
                subtotal: total,
                total,
                descuento: 0,
                certificado_tipo: certificadoTipo,
              },
            ],
          },
        },
        select: { id: true, numero_pedido: true },
      })
    } catch (createErr) {
      console.warn('[admin/inscripciones/certificado] create falló, reintento básico:', createErr)
      pedido = await prisma.pedido.create({
        data: {
          usuario_id: inscripcion.usuario_id,
          total,
          moneda,
          estado: 'COMPLETADO',
          metodo_pago: metodo as any,
          mensaje: `Habilitación manual de certificado por administrador: ${tituloLinea}`,
          pagado_en: fechaPago,
          numero_comprobante: numero_comprobante?.trim() || null,
          tipo_comprobante: numero_comprobante?.trim() ? 'OPERACION' : null,
          detalles: {
            create: [
              {
                curso_id: inscripcion.curso_id,
                cantidad: 1,
                precio_unitario: total,
                subtotal: total,
                total,
                descuento: 0,
              },
            ],
          },
        },
        select: { id: true, numero_pedido: true },
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

    const actualizada = await setInscripcionCertificadoHabilitacion(params.id, tipoCert, true)

    return ApiResponse.success(request, {
      message: `Pedido #${pedido.numero_pedido} registrado y certificado ${certificadoTipo} habilitado`,
      pedidoId: pedido.id,
      numeroPedido: pedido.numero_pedido,
      inscripcion: actualizada,
      creado: true,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return ApiResponse.error(request, error.message, 400)
    }

    return handleApiError(error, request)
  }
}
