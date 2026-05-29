import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { requireAuth } from '@/utils/libs/auth-helpers'

/**
 * POST /api/estudiante/enroll
 * Inscripción directa en cursos gratuitos (sin pasarela de pago).
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { cursoId } = await request.json()

    if (!cursoId) {
      return ApiResponse.error(request, 'Se requiere el ID del curso', 400)
    }

    const curso = await prisma.curso.findUnique({
      where: { id: cursoId, estado: 'PUBLICADO' },
      select: { id: true, slug: true, es_gratis: true, precio: true, vigencia_meses: true }
    })

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    if (!curso.es_gratis && Number(curso.precio) > 0) {
      return ApiResponse.error(request, 'Este curso no es gratuito', 400)
    }

    const inscripcionExistente = await prisma.inscripcion.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: auth.user.id,
          curso_id: cursoId
        }
      }
    })

    if (inscripcionExistente) {
      return ApiResponse.error(request, 'Ya estás inscrito en este curso', 400)
    }

    const fechaInscripcion = new Date()

    await prisma.inscripcion.create({
      data: {
        usuario_id: auth.user.id,
        curso_id: cursoId,
        estado: 'ACTIVO',
        inscrito_en: fechaInscripcion
      }
    })

    return ApiResponse.success(request, { slug: curso.slug }, 201)
  } catch (error) {
    return handleApiError(error, request)
  }
}
