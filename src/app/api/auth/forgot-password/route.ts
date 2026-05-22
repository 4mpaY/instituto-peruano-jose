import prisma from '@/utils/libs/prisma'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import { sendMail } from '@/utils/libs/mailer'
import { getConfigs } from '@/utils/libs/config'
import { getOTPTemplate } from '@/utils/libs/email-templates'

/**
 * POST /api/auth/forgot-password
 * Solicita un código OTP para recuperar la contraseña
 */
export async function POST(request: Request) {
  try {
    const { correo } = await request.json()

    if (!correo) {
      return ApiResponse.error(request, 'El correo es obligatorio', 400)
    }

    // 1. Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { correo }
    })

    // 🛡️ SEGURIDAD: Por seguridad, no revelamos si el correo existe o no
    // Pero internamente solo enviamos el correo si existe.
    if (!usuario) {
      console.log(`[Forgot-Password] Intento de recuperación para correo no registrado: ${correo}`)
      
      return ApiResponse.success(request, { message: 'Si el correo está registrado, recibirás un código de recuperación.' })
    }

    // 2. Generar código OTP de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expira_en = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    // 3. Guardar en DB (Anulamos códigos anteriores para el mismo correo)
    await prisma.passwordReset.updateMany({
      where: { correo, usado: false },
      data: { usado: true }
    })

    await prisma.passwordReset.create({
      data: {
        correo,
        codigo,
        expira_en
      }
    })

    console.log(`[Forgot-Password] Registro PasswordReset creado para: ${correo}. Código: ${codigo}`)

    // 4. Enviar correo con OTP
    const configs = await getConfigs()
    const platformName = configs.TEMPLATE_NAME || 'Aula Virtual'

    const emailHtml = getOTPTemplate({
      platformName,
      customerName: usuario.nombre || 'Estudiante',
      codigo,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || ''
    })

    const mailSent = await sendMail({
      to: correo,
      subject: `Código de recuperación: ${codigo} - ${platformName}`,
      html: emailHtml
    })

    if (mailSent) {
      console.log(`[Forgot-Password] ✅ OTP enviado con éxito a ${correo}`)
    } else {
      console.error(`[Forgot-Password] ❌ No se pudo enviar el correo a ${correo}. Revisa los logs del Mailer.`)
    }

    return ApiResponse.success(request, { message: 'Si el correo está registrado, recibirás un código de recuperación.' })
  } catch (error) {
    console.error('[Forgot-Password] Error inesperado en el flujo:', error)
    
    return handleApiError(error, request)
  }
}
