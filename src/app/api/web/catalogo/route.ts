export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { getAuthSession } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/web/catalogo
 * Retorna todos los cursos públicos y las categorías activas.
 * Si el usuario envía el token Bearer (opcional), calcula `es_comprado`.
 */
export async function GET(request: Request) {
  try {
    // 1. Obtener la sesión actual.
    // Usamos getAuthSession() si están en la misma app, o parseamos Bearer si viene desde fuera.
    // Para no reinventar la rueda, podemos solo usar getAuthSession, pero si no se detecta la cookie,
    // podemos extraer el token si fue proveído en los headers por Axios.

    // Auth opcional: verificamos manualmente si hay un usuario
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const tokenString = authHeader.substring(7)

      if (tokenString !== 'null' && tokenString !== 'undefined') {
        const { verify } = await import('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET

        if (JWT_SECRET) {
          try {
            const decoded = verify(tokenString, JWT_SECRET) as any

            userId = decoded.id
          } catch (e) {}
        }
      }
    } else {
      // Como alternativa si se requiere session de navegador
      const session = await getAuthSession()

      if (session?.user?.id) {
        userId = session.user.id
      }
    }

    const [courses, categories] = await Promise.all([
      prisma.curso.findMany({
        where: { estado: 'PUBLICADO', es_privado: false },
        include: {
          profesor: { select: { id: true, slug: true, nombre: true, apellido: true, avatar: true } },
          categoria: { select: { id: true, nombre: true, slug: true } },
          _count: { select: { modulos: true } }
        },
        orderBy: { creado_en: 'desc' }
      }),
      prisma.categoria.findMany({
        where: { esta_activo: true },
        select: { id: true, nombre: true, slug: true },
        orderBy: { orden: 'asc' }
      })
    ])

    let userCourseIds = new Set<string>()

    if (userId) {
      const inscripciones = await prisma.inscripcion.findMany({
        where: { usuario_id: userId, estado: 'ACTIVO' },
        select: { curso_id: true }
      })

      userCourseIds = new Set(inscripciones.map(i => i.curso_id))
    }

    const coursesWithLecciones = await Promise.all(
      courses.map(async course => {
        const leccionesCount = await prisma.leccion.count({
          where: { modulo: { curso_id: course.id } }
        })

        return {
          ...course,
          es_comprado: userId ? userCourseIds.has(course.id) : false,
          _count: { ...course._count, lecciones: leccionesCount }
        }
      })
    )

    return ApiResponse.success(request, {
      courses: coursesWithLecciones,
      categories: categories
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
