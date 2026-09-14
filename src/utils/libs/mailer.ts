import { createTransport } from 'nodemailer'

interface SendMailOptions {
  to: string
  subject: string
  html: string
  attachments?: {
    filename: string
    content: Buffer | string
    contentType?: string
  }[]
}

const createSmtpTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 465

  return createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

/**
 * Función centralizada para enviar correos electrónicos usando Nodemailer.
 */
export const sendMail = async ({ to, subject, html, attachments }: SendMailOptions) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(
        '⚠️ [Mailer] Las credenciales SMTP_USER / SMTP_PASS no están configuradas en .env. Omitiendo envío de correo real.'
      )

      return false
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Aula Virtual" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments
    }

    console.log(`📡 [Mailer] Intentando enviar correo a: ${to} (Remitente: ${mailOptions.from})`)

    const info = await createSmtpTransporter().sendMail(mailOptions)

    console.log(`✅ [Mailer] Correo enviado a ${to}: ${info.messageId}`)

    return true
  } catch (error: any) {
    console.error('❌ [Mailer] Error crítico al enviar el correo:')
    console.error(`   - Mensaje: ${error.message}`)
    console.error(`   - Código: ${error.code}`)
    console.error(`   - Comando: ${error.command}`)

    if (error.code === 'EENVELOPE') {
      console.error('   - Posible causa: El formato del correo remitente (SMTP_FROM) o destinatario es inválido.')
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      console.error('   - Posible causa: Problema de red o puerto 465 bloqueado en el servidor.')
    } else if (error.code === 'EAUTH') {
      console.error('   - Posible causa: Credenciales SMTP_USER / SMTP_PASS incorrectas (¿App Password de Google?).')
    }

    return false
  }
}
