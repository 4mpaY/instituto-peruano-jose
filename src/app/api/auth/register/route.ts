import bcrypt from 'bcryptjs'

import prisma from '@/utils/libs/prisma'
import { registerSchema } from '@/schemas/auth.schema'
import { validateRequest, handleApiError } from '@/utils/libs/validation'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { authLimiter } from '@/utils/libs/rate-limit'
import { sendMail } from '@/utils/libs/mailer'
import { getConfigs } from '@/utils/libs/config'
import { getWelcomeTemplate } from '@/utils/libs/email-templates'

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
export async function POST(request: Request) {
  try {
    // 🔐 SEGURIDAD: Rate limiting — máximo 10 intentos por minuto por IP
    const rateLimit = authLimiter(request)

    if (!rateLimit.success) {
      return ApiResponse.error(request, 'Demasiados intentos. Por favor espera un momento e inténtalo de nuevo.', 429)
    }

    const body = await request.json()

    // Validar datos
    const validation = validateRequest(registerSchema, body, request)

    if (!validation.success) {
      return validation.error
    }

    const { correo, contrasena, nombre, apellido, numero_documento, celular } = validation.data

    // Verificar si el correo ya existe
    const correoExistente = await prisma.usuario.findUnique({
      where: { correo }
    })

    if (correoExistente) {
      return ApiResponse.error(request, 'El correo ya está registrado', 409)
    }

    // Verificar si el número de documento ya existe
    const documentoExistente = await prisma.usuario.findUnique({
      where: { numero_documento }
    })

    if (documentoExistente) {
      return ApiResponse.error(request, 'El número de documento ya está registrado', 409)
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10)

    // Generar slug
    let baseSlug = `${nombre}-${apellido}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (!baseSlug) baseSlug = 'usuario';
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.usuario.findUnique({ where: { slug } })) {
      const randomHash = Math.random().toString(36).substring(2, 6);

      slug = `${baseSlug}-${randomHash}-${counter}`;
      counter++;
    }

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        correo,
        contrasena: hashedPassword,
        nombre,
        apellido,
        numero_documento,
        celular: celular || null,
        slug,
        rol: 'ESTUDIANTE' // Por defecto siempre ESTUDIANTE en registro público
      },
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        numero_documento: true,
        celular: true,
        rol: true,
        esta_activo: true,
        creado_en: true
      }
    })
    
    // 📧 Enviar correo de bienvenida con credenciales
    try {
      const configs = await getConfigs()
      const platformName = configs.TEMPLATE_NAME || 'Aula Virtual'
      
      const emailHtml = getWelcomeTemplate({
        platformName,
        customerName: nombre,
        correo,
        contrasena,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || ''
      })

      await sendMail({
        to: correo,
        subject: `Tus credenciales de acceso - ${platformName}`,
        html: emailHtml
      })
    } catch (mailError) {
      console.error('[Register] Error al enviar el correo de bienvenida:', mailError)
    }

    return ApiResponse.success(request, { usuario: nuevoUsuario }, 201)
  } catch (error) {
    return handleApiError(error, request)
  }
}
