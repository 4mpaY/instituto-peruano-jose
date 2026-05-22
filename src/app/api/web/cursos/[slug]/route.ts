export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { getAuthSession } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/web/cursos/[slug]
 * Retorna el detalle completo de un solo curso publicado.
 * Calcula `es_comprado` dinámicamente si se recibe autenticación.
 */
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // Auth opcional manual
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
      const session = await getAuthSession()

      if (session?.user?.id) {
        userId = session.user.id
      }
    }

    const course = await prisma.curso.findUnique({
      where: {
        slug,
        estado: 'PUBLICADO',
        es_privado: false
      },
      include: {
        profesor: {
          select: { id: true, slug: true, nombre: true, apellido: true, avatar: true, biografia: true, cargo: true }
        },
        categoria: {
          select: { id: true, nombre: true }
        },
        modulos: {
          include: {
            lecciones: {
              where: { estado: 'PUBLICADO' },
              orderBy: { orden: 'asc' }
            }
          },
          orderBy: { orden: 'asc' }
        }
      }
    })

    if (!course) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    let es_comprado = false

    if (userId) {
      const inscripcion = await prisma.inscripcion.findFirst({
        where: {
          usuario_id: userId,
          curso_id: course.id,
          estado: 'ACTIVO'
        }
      })

      if (inscripcion) {
        es_comprado = true
      }
    }

    // Le inyectamos el flag
    const courseWithBoughtOrNot = { ...course, es_comprado }

    return ApiResponse.success(request, { course: courseWithBoughtOrNot })
  } catch (error) {
    return handleApiError(error, request)
  }
}
