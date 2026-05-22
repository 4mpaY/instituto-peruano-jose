import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/estudiante/cursos/[slug]/valoracion
 * Obtiene la calificación del usuario para un curso específico usando el slug
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const course = await prisma.curso.findUnique({
      where: { slug: params.slug },
      select: { id: true }
    })

    if (!course) return ApiResponse.error(request, 'Curso no encontrado', 404)

    const valoracion = await prisma.valoracionCurso.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: auth.user.id,
          curso_id: course.id
        }
      }
    })

    return ApiResponse.success(request, { valoracion })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * POST /api/estudiante/cursos/[slug]/valoracion
 * Crea o actualiza la calificación del usuario para un curso usando el slug
 */
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { puntuacion, comentario } = await request.json()

    if (puntuacion === undefined || puntuacion < 1 || puntuacion > 5) {
      return ApiResponse.error(request, 'La puntuación debe estar entre 1 y 5', 400)
    }

    const course = await prisma.curso.findUnique({
      where: { slug: params.slug },
      select: { id: true }
    })

    if (!course) return ApiResponse.error(request, 'Curso no encontrado', 404)

    const valoracion = await prisma.valoracionCurso.upsert({
      where: {
        usuario_id_curso_id: {
          usuario_id: auth.user.id,
          curso_id: course.id
        }
      },
      update: {
        puntuacion,
        comentario,
        actualizado_en: new Date()
      },
      create: {
        usuario_id: auth.user.id,
        curso_id: course.id,
        puntuacion,
        comentario
      }
    })

    return ApiResponse.success(request, { valoracion }, 201)
  } catch (error) {
    return handleApiError(error, request)
  }
}
