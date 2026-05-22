export const dynamic = 'force-dynamic'

import bcrypt from 'bcryptjs'

import prisma from '@/utils/libs/prisma'
import { crearUsuarioSchema, listarUsuariosQuerySchema } from '@/schemas/usuario.schema'
import { validateRequest, handleApiError } from '@/utils/libs/validation'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { sendMail } from '@/utils/libs/mailer'
import { getConfigs } from '@/utils/libs/config'
import { getWelcomeTemplate } from '@/utils/libs/email-templates'

/**
 * GET /api/usuarios
 * Listar todos los usuarios (solo ADMIN)
 */
export async function GET(request: Request) {
  try {
    // Verificar que sea admin
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateRequest(listarUsuariosQuerySchema, query, request)

    if (!validation.success) {
      return validation.error
    }

    const { page, limit, rol, buscar, esta_activo } = validation.data

    // Construir filtros
    const where: any = {}

    if (rol) {
      where.rol = rol
    }

    if (esta_activo !== undefined) {
      where.esta_activo = esta_activo
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { apellido: { contains: buscar, mode: 'insensitive' } },
        { correo: { contains: buscar, mode: 'insensitive' } },
        { numero_documento: { contains: buscar } }
      ]
    }

    // Calcular paginación
    const skip = (page - 1) * limit

    // Consultar usuarios
    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creado_en: 'desc' },
        select: {
          id: true,
          correo: true,
          nombre: true,
          apellido: true,
          numero_documento: true,
          celular: true,
          avatar: true,
          biografia: true,
          cargo: true,
          firma: true,
          rol: true,
          esta_activo: true,
          creado_en: true,
          actualizado_en: true
        }
      }),
      prisma.usuario.count({ where })
    ])

    return ApiResponse.success(request, {
      usuarios,
      paginacion: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * POST /api/usuarios
 * Crear un nuevo usuario (solo ADMIN)
 */
export async function POST(request: Request) {
  try {
    // Verificar que sea admin
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const body = await request.json()

    // Validar datos
    const validation = validateRequest(crearUsuarioSchema, body, request)

    if (!validation.success) {
      return validation.error
    }

    const { correo, contrasena, nombre, apellido, numero_documento, celular, rol, biografia, avatar, cargo, firma } =
      validation.data

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
    
    // Verificamos si el slug ya existe, si existe le añadimos un hash random
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
        rol: rol || 'ESTUDIANTE',
        biografia: biografia || null,
        avatar: avatar || null,
        cargo: cargo || null,
        firma: firma || null,
        slug
      },
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        numero_documento: true,
        celular: true,
        avatar: true,
        biografia: true,
        cargo: true,
        firma: true,
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
      console.error('[Admin-UserCreate] Error al enviar el correo de bienvenida:', mailError)
    }

    return ApiResponse.success(request, { usuario: nuevoUsuario }, 201)
  } catch (error) {
    return handleApiError(error, request)
  }
}
