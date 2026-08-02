import prisma from '@/utils/libs/prisma'
import { sendOrderConfirmationEmail } from './order-notifications'

interface OrderCompletionData {
  metodo_pago: 'PAYPAL' | 'IZIPAY' | 'CULQI' | 'MERCADOPAGO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA' | 'OTRO'
  transaccion_id?: string
  respuesta_pago?: any

  /** Si se omite, se usa la fecha/hora actual */
  pagado_en?: Date | string
}

/**
 * Servicio centralizado para completar un pedido.
 * Maneja transacciones, inscripciones (cursos) o habilitación de certificados,
 * cupones, notificaciones administrativas y correo de confirmación.
 */
export async function completeOrder(pedidoId: string, data: OrderCompletionData) {
  try {
    const pedidoInit = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        detalles: {
          include: {
            curso: {
              select: { id: true, vigencia_meses: true, titulo: true }
            }
          }
        },
        usuario: true
      }
    })

    if (!pedidoInit) throw new Error(`Pedido ${pedidoId} no encontrado.`)

    if (pedidoInit.estado === 'COMPLETADO') {
      console.log(`[Order-Service] El pedido ${pedidoId} ya está completado.`)

      const inscripciones = await prisma.inscripcion.findMany({
        where: { pedido_id: pedidoId }
      })

      return { pedido: pedidoInit, inscripciones, yaCompletado: true }
    }

    const [tipoRow] = await prisma.$queryRaw<Array<{ tipo: string }>>`
      SELECT tipo::text AS tipo FROM pedidos WHERE id = ${pedidoId}
    `

    const tipoPedido = tipoRow?.tipo === 'CERTIFICADO' ? 'CERTIFICADO' : 'CURSO'

    const detalleTipos = await prisma.$queryRaw<Array<{ id: string; certificado_tipo: string | null }>>`
      SELECT id, certificado_tipo::text AS certificado_tipo
      FROM detalles_pedido
      WHERE pedido_id = ${pedidoId}
    `

    const tipoByDetalleId = new Map(detalleTipos.map(d => [d.id, d.certificado_tipo]))

    const result = await prisma.$transaction(
      async tx => {
        const pedidoActualizado = await tx.pedido.update({
          where: { id: pedidoId },
          data: {
            estado: 'COMPLETADO',
            pagado_en: data.pagado_en ? new Date(data.pagado_en) : new Date(),
            metodo_pago: data.metodo_pago as any,
            transaccion_id: data.transaccion_id || null,
            respuesta_izipay: data.respuesta_pago || null
          }
        })

        if (pedidoInit.cupon_id) {
          await tx.cupon.update({
            where: { id: pedidoInit.cupon_id },
            data: { usos_actuales: { increment: 1 } }
          })
        }

        const inscripciones = []

        if (tipoPedido === 'CERTIFICADO') {
          for (const detalle of pedidoInit.detalles) {
            const certTipo = (tipoByDetalleId.get(detalle.id) || 'IPG').toUpperCase()

            const insc = await tx.inscripcion.findUnique({
              where: {
                usuario_id_curso_id: {
                  usuario_id: pedidoInit.usuario_id,
                  curso_id: detalle.curso_id
                }
              },
              select: { id: true }
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

            inscripciones.push(insc)
          }
        } else {
          for (const detalle of pedidoInit.detalles) {
            const fechaInscripcion = new Date()

            const ins = await tx.inscripcion.upsert({
              where: {
                usuario_id_curso_id: {
                  usuario_id: pedidoInit.usuario_id,
                  curso_id: detalle.curso_id
                }
              },
              update: {
                estado: 'ACTIVO',
                pedido_id: pedidoId
              },
              create: {
                usuario_id: pedidoInit.usuario_id,
                curso_id: detalle.curso_id,
                pedido_id: pedidoId,
                estado: 'ACTIVO',
                inscrito_en: fechaInscripcion
              }
            })

            inscripciones.push(ins)
          }
        }

        return { pedido: pedidoActualizado, inscripciones }
      },
      { timeout: 30000 }
    )

    try {
      const admins = await prisma.usuario.findMany({
        where: { rol: 'ADMIN' },
        select: { id: true }
      })

      const tituloNotif =
        tipoPedido === 'CERTIFICADO'
          ? `Nuevo Pedido de Certificado (${data.metodo_pago})`
          : `Nuevo Pedido (${data.metodo_pago})`

      await Promise.all(
        admins.map(admin =>
          prisma.notificacion.create({
            data: {
              titulo: tituloNotif,
              mensaje: `El usuario ${pedidoInit.usuario.nombre} ha realizado un pedido exitoso por ${pedidoInit.moneda} ${pedidoInit.total}.`,
              tipo: 'PEDIDO_NUEVO',
              usuario_id: admin.id,
              enlace: `/admin/pedidos`
            }
          })
        )
      )
    } catch (notifyError) {
      console.error(`[Order-Service] Error enviando notificaciones a admins para pedido ${pedidoId}:`, notifyError)
    }

    sendOrderConfirmationEmail(pedidoId).catch(err => {
      console.error(`[Order-Service] Error enviando mail después de completar pedido ${pedidoId}:`, err)
    })

    return { ...result, yaCompletado: false }
  } catch (error) {
    console.error(`[Order-Service] Error crítico completando pedido ${pedidoId}:`, error)
    throw error
  }
}

/** Etiqueta de línea de pedido para certificados */
export function labelDetalleCertificado(cursoTitulo: string, tipo: 'IPG' | 'CIP' | string) {
  const sufijo = String(tipo).toUpperCase() === 'CIP' ? 'Colegio de Ingenieros' : 'IPG'

  return `${cursoTitulo} (Certificado ${sufijo})`
}
