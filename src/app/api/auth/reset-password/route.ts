import bcrypt from 'bcryptjs'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña del usuario
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const correo = typeof body.correo === 'string' ? body.correo.trim().toLowerCase() : ''
    const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : ''
    const nuevaContrasena = typeof body.nuevaContrasena === 'string' ? body.nuevaContrasena : ''

    if (!correo || !codigo || !nuevaContrasena) {
      return ApiResponse.error(request, 'Datos incompletos', 400)
    }

    if (nuevaContrasena.length < 6) {
      return ApiResponse.error(request, 'La contraseña debe tener al menos 6 caracteres', 400)
    }

    // 1. Verificar el código OTP
    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        correo,
        codigo,
        usado: false,
        expira_en: { gte: new Date() }
      },
      orderBy: { creado_en: 'desc' }
    })

    if (!resetRequest) {
      return ApiResponse.error(request, 'Código inválido o expirado', 400)
    }

    // 2. Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10)

    // 3. Actualizar la contraseña del usuario
    await prisma.$transaction([
      prisma.usuario.update({
        where: { correo: resetRequest.correo },
        data: { contrasena: hashedPassword }
      }),
      prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: { usado: true }
      })
    ])

    console.log(`[Reset-Password] Contraseña actualizada para ${resetRequest.correo}`)

    return ApiResponse.success(request, { message: 'Contraseña restablecida con éxito' })
  } catch (error) {
    return handleApiError(error, request)
  }
}
