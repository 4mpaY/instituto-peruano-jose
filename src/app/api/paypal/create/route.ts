import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { getConfigs } from '@/utils/libs/config'
import { createPaypalOrder } from '@/utils/libs/paypal-api'
import { sendMail } from '@/utils/libs/mailer'
import { getOrderConfirmationTemplate } from '@/utils/libs/email-templates'

/**
 * POST /api/paypal/create
 * Crea una orden de PayPal y un pedido en la base de datos
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { cursoIds, codigoCupon } = await request.json()

    if (!cursoIds || !Array.isArray(cursoIds) || cursoIds.length === 0) {
      return ApiResponse.error(request, 'Se requiere al menos un ID de curso', 400)
    }

    // 1. Obtener cursos y verificar inscripciones
    const [cursos, inscripcionesExistentes] = await Promise.all([
      prisma.curso.findMany({
        where: { id: { in: cursoIds } }
      }),
      prisma.inscripcion.findMany({
        where: {
          usuario_id: auth.user.id,
          curso_id: { in: cursoIds }
        }
      })
    ])

    if (cursos.length === 0) {
      return ApiResponse.error(request, 'No se encontraron los cursos seleccionados', 404)
    }

    if (inscripcionesExistentes.length > 0) {
      return ApiResponse.error(request, 'Ya estás inscrito en uno de los cursos seleccionados', 400)
    }

    // 2. Calcular total
    const subtotal = cursos.reduce((acc, c) => acc + Number(c.precio), 0)
    let total = subtotal
    let cuponId = null
    let descuentoTotal = 0

    if (codigoCupon) {
      const cupon = await prisma.cupon.findUnique({
        where: { codigo: codigoCupon.toUpperCase(), esta_activo: true }
      })

      if (cupon) {
        const ahora = new Date()

        ahora.setHours(0, 0, 0, 0)

        const fechaExpiracion = cupon.fecha_expiracion ? new Date(cupon.fecha_expiracion) : null

        if (fechaExpiracion) fechaExpiracion.setHours(0, 0, 0, 0)

        const expirado = fechaExpiracion && fechaExpiracion < ahora
        const limiteAlcanzado = cupon.limite_uso !== null && cupon.usos_actuales >= cupon.limite_uso

        if (!expirado && !limiteAlcanzado) {
          cuponId = cupon.id

          if (cupon.tipo === 'PORCENTAJE') {
            descuentoTotal = subtotal * (Number(cupon.valor) / 100)
          } else if (cupon.tipo === 'MONTO_FIJO') {
            descuentoTotal = Number(cupon.valor)
          }

          if (descuentoTotal > subtotal) descuentoTotal = subtotal
          total = subtotal - descuentoTotal
        }
      }
    }

    // 3. Lógica de Moneda para PayPal
    const monedaOriginal = cursos[0]?.moneda || 'PEN'
    const monedaPaypal = 'USD'
    let totalUSD = total
    let exchangeRate = 1

    if (monedaOriginal === 'PEN') {
      // Conversión de Moneda para PayPal (Dinámica desde BD)
      const configs = await getConfigs()

      exchangeRate = Number(configs['PAYPAL_EXCHANGE_RATE']) || 3.8
      totalUSD = Number((total / exchangeRate).toFixed(2))
    }

    const pedido = await prisma.pedido.create({
      data: {
        usuario_id: auth.user.id,
        cupon_id: cuponId,
        total,
        moneda: monedaOriginal,
        estado: 'PENDIENTE',
        metodo_pago: 'PAYPAL',
        mensaje:
          monedaOriginal === 'PEN'
            ? `Monto convertido a PayPal: $${totalUSD} (TC: ${exchangeRate})`
            : `Pago procesado en USD directamente`,
        detalles: {
          create: cursos.map(c => {
            const precioCurso = Number(c.precio)
            const proporcion = subtotal > 0 ? precioCurso / subtotal : 0
            const descuentoCurso = descuentoTotal * proporcion

            return {
              curso_id: c.id,
              precio_unitario: c.precio,
              descuento: descuentoCurso,
              subtotal: c.precio,
              total: precioCurso - descuentoCurso
            }
          })
        }
      },
      include: { detalles: { include: { curso: { select: { titulo: true } } } } }
    })
    
    // 📧 Enviar correo de confirmación de pedido
    try {
      const configs = await getConfigs()
      const platformName = configs.TEMPLATE_NAME || 'Aula Virtual'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      
      const emailHtml = getOrderConfirmationTemplate({
        platformName,
        customerName: auth.user.nombre || auth.user.name || 'Estudiante',
        orderNumber: pedido.numero_pedido,
        date: new Date().toLocaleDateString('es-PE'),
        total: Number(pedido.total),
        moneda: pedido.moneda,
        metodoPago: 'PayPal',
        cursos: pedido.detalles.map(d => ({
          titulo: d.curso.titulo,
          precio: Number(d.total)
        })),
        appUrl
      })

      if (auth.user.email) {
        await sendMail({
          to: auth.user.email,
          subject: `Confirmación de Pedido #${pedido.numero_pedido} - ${platformName}`,
          html: emailHtml
        })
      }
    } catch (mailError) {
      console.error('[Paypal-Create-Mail] Error al enviar correo de confirmación:', mailError)
    }

    // 5. Crear orden en PayPal usando el monto en USD
    const paypalOrder = await createPaypalOrder(totalUSD, monedaPaypal)

    // 6. Actualizar pedido con el token/id de paypal
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        transaccion_id: paypalOrder.id,
        token_pago: paypalOrder.id
      }
    })

    return ApiResponse.success(
      request,
      {
        paypalOrderId: paypalOrder.id,
        pedidoId: pedido.id
      },
      201
    )
  } catch (error) {
    console.error('[PAYPAL_CREATE_ERROR]', error)

    return handleApiError(error, request)
  }
}
