import prisma from '@/utils/libs/prisma'
import { getConfigs } from '@/utils/libs/config'
import { sendMail } from '@/utils/libs/mailer'
import { getBaseURL } from '@/utils/env'
import { generateOrderPDF } from './pdf-generator'

/**
 * Orquesta el envío del correo de confirmación de pedido y bienvenida.
 */
export async function sendOrderConfirmationEmail(pedidoId: string) {
  try {
    // 1. Obtener datos del pedido detallados
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        usuario: true,
        detalles: {
          include: {
            curso: {
              select: { titulo: true }
            }
          }
        }
      }
    })

    if (!pedido) {
      console.error(`[Order-Notifications] Pedido ${pedidoId} no encontrado para enviar mail.`)

      return
    }

    // 2. Obtener configuraciones básicas (Logo, Nombre sitio)
    const configs = await getConfigs()
    const platformName = configs.TEMPLATE_NAME || 'Aula Virtual'
    let platformLogo = configs.TEMPLATE_LOGO || ''

    // 🔐 SEGURIDAD: Convertir ruta relativa a absoluta para correos
    if (platformLogo && platformLogo.startsWith('/')) {
      const baseURL = getBaseURL().replace(/\/$/, '') // Quita slash final si existe

      platformLogo = `${baseURL}${platformLogo}`
    }

    // 3. Generar PDF adjunto
    const pdfBuffer = await generateOrderPDF(pedido)

    // 4. Construir contenido del correo
    const primaryColor = '#25927F'
    const secondaryColor = '#f9f9f9'
    const baseURL = getBaseURL().replace(/\/$/, '')
    
    const cursosHtml = pedido.detalles.map(d => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <span style="display: block; font-weight: 600; color: #333;">${d.curso.titulo}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #666;">
          ${pedido.moneda} ${Number(d.total).toFixed(2)}
        </td>
      </tr>
    `).join('')

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee;">
        <!-- Header -->
        <div style="background-color: ${primaryColor}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">¡PAGO CONFIRMADO!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Pedido #${String(pedido.numero_pedido).padStart(6, '0')}</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin-top: 0;">¡Hola, ${pedido.usuario.nombre}!</h2>
          <p style="color: #666; line-height: 1.6;">Tu pago ha sido verificado con éxito. ¡Ya tienes acceso completo a tus cursos! Estamos muy felices de acompañarte en este proceso de aprendizaje.</p>

          <!-- Order Summary Box -->
          <div style="background-color: ${secondaryColor}; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding-bottom: 10px; color: #888; font-size: 12px; text-transform: uppercase;">Estado</td>
                <td style="padding-bottom: 10px; color: #888; font-size: 12px; text-transform: uppercase; text-align: right;">Método de Pago</td>
              </tr>
              <tr>
                <td style="font-weight: 600; color: ${primaryColor};">COMPLETADO ✅</td>
                <td style="font-weight: 600; color: #333; text-align: right;">${pedido.metodo_pago || 'Manual'}</td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr>
                <th style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #eee; color: #888; font-size: 12px; text-transform: uppercase;">Curso</th>
                <th style="text-align: right; padding-bottom: 10px; border-bottom: 2px solid #eee; color: #888; font-size: 12px; text-transform: uppercase;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${cursosHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding-top: 20px; font-weight: 700; color: #333; font-size: 18px;">Total Pagado</td>
                <td style="padding-top: 20px; font-weight: 700; color: ${primaryColor}; font-size: 22px; text-align: right;">
                  ${pedido.moneda} ${Number(pedido.total).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          <p style="color: #666; font-size: 14px; margin-bottom: 30px;">Adjunto a este correo encontrarás el detalle de tu compra en PDF para tus registros personales.</p>

          <!-- Action Button -->
          <div style="text-align: center; margin-top: 40px;">
            <a href="${baseURL}/mi-perfil/mis-cursos" style="background-color: ${primaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; box-shadow: 0 4px 10px rgba(37, 146, 127, 0.3);">
              EMPEZAR A APRENDER AHORA
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} ${platformName}. Todos los derechos reservados.</p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">${baseURL.replace(/https?:\/\//, '')}</p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">Si tienes alguna duda, contáctanos a través de nuestro soporte.</p>
        </div>
      </div>
    `

    // 5. Enviar Mail
    await sendMail({
      to: pedido.usuario.correo,
      subject: `¡Confirmación de Pedido #${String(pedido.numero_pedido).padStart(6, '0')} - ${platformName}!`,
      html: emailHtml,
      attachments: [
        {
          filename: `Detalle-Compra-${pedido.numero_pedido}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })

    console.log(`[Order-Notifications] Correo enviado exitosamente para pedido ${pedidoId}`)
  } catch (error) {
    console.error('[Order-Notifications] Error crítico enviando notificación:', error)
  }
}
