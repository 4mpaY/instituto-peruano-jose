export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { requireProfesorOrAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/cursos/[id]/valoraciones
 * Obtener estadísticas y lista de valoraciones de un curso (Solo ADMIN o PROFESOR dueño)
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireProfesorOrAdmin(request)

    if (!auth.authorized) return auth.error

    const { user } = auth
    const { id: cursoId } = params

    // Verificar que el curso existe y permisos
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, profesor_id: true }
    })

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    if (user.rol === 'PROFESOR' && curso.profesor_id !== user.id) {
      return ApiResponse.error(request, 'No tienes permiso para ver las valoraciones de este curso', 403)
    }

    // Obtener estadísticas (promedio y conteo)
    const estadisticas = await prisma.valoracionCurso.aggregate({
      where: { curso_id: cursoId },
      _avg: { puntuacion: true },
      _count: { id: true }
    })

    // Obtener lista detallada de valoraciones
    const valoraciones = await prisma.valoracionCurso.findMany({
      where: { curso_id: cursoId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            avatar: true
          }
        }
      },
      orderBy: { creado_en: 'desc' }
    })

    return ApiResponse.success(request, {
      promedio: estadisticas._avg.puntuacion || 0,
      total: estadisticas._count.id,
      valoraciones
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
