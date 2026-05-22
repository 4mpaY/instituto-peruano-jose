export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { validateRequest, handleApiError } from '@/utils/libs/validation'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { updatePedidoSchema } from '@/schemas/pedido.schema'

/**
 * GET /api/pedidos/[id]
 * Obtener detalle de pedido (solo ADMIN)
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { id } = params

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, correo: true, avatar: true } },
        cupon: true,
        detalles: {
          include: {
            curso: { select: { id: true, titulo: true, miniatura: true, precio: true } }
          }
        }
      }
    })

    if (!pedido) {
      return ApiResponse.error(request, 'Pedido no encontrado', 404)
    }

    return ApiResponse.success(request, { data: pedido })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * PATCH /api/pedidos/[id]
 * Actualizar pedido (solo ADMIN)
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { id } = params
    const body = await request.json()

    const validation = validateRequest(updatePedidoSchema, body, request)

    if (!validation.success) {
      return validation.error
    }

    const { estado, metodo_pago, mensaje, tipo_comprobante, numero_comprobante } = validation.data

    const pedidoAnterior = await prisma.pedido.findUnique({
      where: { id },
      include: { detalles: true }
    })

    if (!pedidoAnterior) {
      return ApiResponse.error(request, 'Pedido no encontrado', 404)
    }

    // Si cambió a COMPLETADO, deberíamos teóricamente generar las inscripciones
    // Si cambió de COMPLETADO a CANCELADO/REEMBOLSADO, deberíamos revocar

    // Iniciar transacción para actualizar pedido y revocar/conceder inscripciones
    await prisma.$transaction(async tx => {
      // Modificar pedido
      const pagado_en = estado === 'COMPLETADO' && !pedidoAnterior.pagado_en ? new Date() : pedidoAnterior.pagado_en

      await tx.pedido.update({
        where: { id },
        data: {
          estado,
          metodo_pago,
          mensaje,
          tipo_comprobante,
          numero_comprobante,
          pagado_en: estado === 'COMPLETADO' ? pagado_en : null
        }
      })

      // Lógica de revocación si pasa de completado a otro estado
      if (pedidoAnterior.estado === 'COMPLETADO' && estado !== 'COMPLETADO') {
        const cursosIds = pedidoAnterior.detalles.map(d => d.curso_id)

        await tx.inscripcion.deleteMany({
          where: {
            usuario_id: pedidoAnterior.usuario_id,
            curso_id: { in: cursosIds },
            pedido_id: id // Opcional, por seguridad extra
          }
        })
      }

      // Lógica de aprobación manual si pasa a COMPLETADO
      if (pedidoAnterior.estado !== 'COMPLETADO' && estado === 'COMPLETADO') {
        const cursosIds = pedidoAnterior.detalles.map(d => d.curso_id)

        // Evitar duplicados
        const yaInscritos = await tx.inscripcion.findMany({
          where: {
            usuario_id: pedidoAnterior.usuario_id,
            curso_id: { in: cursosIds }
          }
        })

        const inscritosIds = yaInscritos.map(i => i.curso_id)
        const cursosAInscribir = cursosIds.filter(cid => !inscritosIds.includes(cid))

        if (cursosAInscribir.length > 0) {
          await Promise.all(
            cursosAInscribir.map(cid =>
              tx.inscripcion.create({
                data: {
                  usuario_id: pedidoAnterior.usuario_id,
                  curso_id: cid,
                  pedido_id: id,
                  estado: 'ACTIVO',
                  inscrito_en: new Date()
                }
              })
            )
          )
        }
      }
    })

    return ApiResponse.success(request, { message: 'Pedido actualizado correctamente' })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * DELETE /api/pedidos/[id]
 * Eliminar pedido e inscripciones vinculadas (solo ADMIN)
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { id } = params

    const pedido = await prisma.pedido.findUnique({
      where: { id }
    })

    if (!pedido) {
      return ApiResponse.error(request, 'Pedido no encontrado', 404)
    }

    await prisma.$transaction(async tx => {
      // 1. Eliminar inscripciones vinculadas a este pedido
      await tx.inscripcion.deleteMany({
        where: { pedido_id: id }
      })

      // 2. Eliminar detalles del pedido
      await tx.detallePedido.deleteMany({
        where: { pedido_id: id }
      })

      // 3. Eliminar el pedido base
      await tx.pedido.delete({
        where: { id }
      })
    })

    return ApiResponse.success(request, { message: 'Pedido eliminado correctamente' })
  } catch (error) {
    return handleApiError(error, request)
  }
}
