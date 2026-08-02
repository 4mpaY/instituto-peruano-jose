export const dynamic = 'force-dynamic'

import { handleApiError, validateRequest } from '@/utils/libs/validation'

import { ApiResponse } from '@/utils/libs/apiResponse'
import prisma from '@/utils/libs/prisma'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { updatePedidoSchema } from '@/schemas/pedido.schema'
import { labelDetalleCertificado } from '@/utils/libs/order-service'

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
        metodo_pago_manual: true,
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

    const [tipoRow] = await prisma.$queryRaw<Array<{ tipo: string }>>`
      SELECT tipo::text AS tipo FROM pedidos WHERE id = ${id}
    `

    const certs = await prisma.$queryRaw<Array<{ id: string; certificado_tipo: string | null }>>`
      SELECT id, certificado_tipo::text AS certificado_tipo
      FROM detalles_pedido WHERE pedido_id = ${id}
    `

    const certById = new Map(certs.map(c => [c.id, c.certificado_tipo]))

    return ApiResponse.success(request, {
      data: {
        ...pedido,
        tipo: tipoRow?.tipo || 'CURSO',
        detalles: pedido.detalles.map(d => ({
          ...d,
          certificado_tipo: certById.get(d.id) || null,
          titulo_display: certById.get(d.id)
            ? labelDetalleCertificado(d.curso.titulo, certById.get(d.id)!)
            : d.curso.titulo,
        })),
      },
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * PATCH /api/pedidos/[id]
 * Actualizar pedido (solo ADMIN).
 * Si pasa a COMPLETADO:
 *  - pedidos CURSO → crea inscripciones
 *  - pedidos CERTIFICADO → habilita IPG/CIP automáticamente
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
      include: {
        detalles: {
          include: {
            curso: {
              select: { id: true, vigencia_meses: true, titulo: true }
            }
          }
        }
      }
    })

    if (!pedidoAnterior) {
      return ApiResponse.error(request, 'Pedido no encontrado', 404)
    }

    const [tipoRow] = await prisma.$queryRaw<Array<{ tipo: string }>>`
      SELECT tipo::text AS tipo FROM pedidos WHERE id = ${id}
    `

    const tipoPedido = tipoRow?.tipo === 'CERTIFICADO' ? 'CERTIFICADO' : 'CURSO'

    const detalleTipos = await prisma.$queryRaw<Array<{ id: string; certificado_tipo: string | null }>>`
      SELECT id, certificado_tipo::text AS certificado_tipo
      FROM detalles_pedido WHERE pedido_id = ${id}
    `

    const tipoByDetalleId = new Map(detalleTipos.map(d => [d.id, d.certificado_tipo]))

    await prisma.$transaction(async tx => {
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

      // Revocar al sacar de COMPLETADO
      if (pedidoAnterior.estado === 'COMPLETADO' && estado !== 'COMPLETADO') {
        if (tipoPedido === 'CERTIFICADO') {
          for (const detalle of pedidoAnterior.detalles) {
            const certTipo = (tipoByDetalleId.get(detalle.id) || 'IPG').toUpperCase()

            const insc = await tx.inscripcion.findUnique({
              where: {
                usuario_id_curso_id: {
                  usuario_id: pedidoAnterior.usuario_id,
                  curso_id: detalle.curso_id,
                },
              },
              select: { id: true },
            })

            if (!insc) continue

            if (certTipo === 'CIP') {
              await tx.$executeRaw`
                UPDATE inscripciones
                SET certificado_cip_habilitado = false,
                    certificado_cip_habilitado_en = NULL,
                    certificado_habilitado = certificado_ipg_habilitado
                WHERE id = ${insc.id}
              `
            } else {
              await tx.$executeRaw`
                UPDATE inscripciones
                SET certificado_ipg_habilitado = false,
                    certificado_ipg_habilitado_en = NULL,
                    certificado_habilitado = certificado_cip_habilitado
                WHERE id = ${insc.id}
              `
            }
          }
        } else {
          const cursosIds = pedidoAnterior.detalles.map(d => d.curso_id)

          await tx.inscripcion.deleteMany({
            where: {
              usuario_id: pedidoAnterior.usuario_id,
              curso_id: { in: cursosIds },
              pedido_id: id
            }
          })
        }
      }

      // Aprobar: COMPLETADO
      if (pedidoAnterior.estado !== 'COMPLETADO' && estado === 'COMPLETADO') {
        if (tipoPedido === 'CERTIFICADO') {
          for (const detalle of pedidoAnterior.detalles) {
            const certTipo = (tipoByDetalleId.get(detalle.id) || 'IPG').toUpperCase()

            const insc = await tx.inscripcion.findUnique({
              where: {
                usuario_id_curso_id: {
                  usuario_id: pedidoAnterior.usuario_id,
                  curso_id: detalle.curso_id,
                },
              },
              select: { id: true },
            })

            if (!insc) {
              throw new Error(
                `No hay inscripción activa para habilitar el certificado del curso ${detalle.curso.titulo}`
              )
            }

            if (certTipo === 'CIP') {
              await tx.$executeRaw`
                UPDATE inscripciones
                SET certificado_cip_habilitado = true,
                    certificado_cip_habilitado_en = COALESCE(certificado_cip_habilitado_en, NOW()),
                    certificado_habilitado = true
                WHERE id = ${insc.id}
              `
            } else {
              await tx.$executeRaw`
                UPDATE inscripciones
                SET certificado_ipg_habilitado = true,
                    certificado_ipg_habilitado_en = COALESCE(certificado_ipg_habilitado_en, NOW()),
                    certificado_habilitado = true
                WHERE id = ${insc.id}
              `
            }
          }
        } else {
          const cursosIds = pedidoAnterior.detalles.map(d => d.curso_id)

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
              cursosAInscribir.map(cid => {
                const fechaInscripcion = new Date()

                return tx.inscripcion.create({
                  data: {
                    usuario_id: pedidoAnterior.usuario_id,
                    curso_id: cid,
                    pedido_id: id,
                    estado: 'ACTIVO',
                    inscrito_en: fechaInscripcion
                  }
                })
              })
            )
          }
        }
      }
    })

    const mensajeOk =
      tipoPedido === 'CERTIFICADO' && estado === 'COMPLETADO'
        ? 'Pedido actualizado. El certificado fue habilitado automáticamente.'
        : 'Pedido actualizado correctamente'

    return ApiResponse.success(request, { message: mensajeOk })
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

    const [tipoRow] = await prisma.$queryRaw<Array<{ tipo: string }>>`
      SELECT tipo::text AS tipo FROM pedidos WHERE id = ${id}
    `

    const esCertificado = tipoRow?.tipo === 'CERTIFICADO'

    await prisma.$transaction(async tx => {
      // Pedidos de curso: borrar inscripciones creadas por el pedido.
      // Pedidos de certificado: no tocar la inscripción del curso.
      if (!esCertificado) {
        await tx.inscripcion.deleteMany({
          where: { pedido_id: id }
        })
      }

      await tx.detallePedido.deleteMany({
        where: { pedido_id: id }
      })

      await tx.pedido.delete({
        where: { id }
      })
    })

    return ApiResponse.success(request, { message: 'Pedido eliminado correctamente' })
  } catch (error) {
    return handleApiError(error, request)
  }
}
