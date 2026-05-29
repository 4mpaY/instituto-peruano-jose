import prisma from '@/utils/libs/prisma'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * POST /api/estudiante/progreso/completar-todo
 * Cuerpo: { cursoId: string }
 * Marca todas las lecciones del curso como completadas para el alumno autenticado.
 * Solo funciona si el curso tiene completar_automatico = true.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { cursoId } = await request.json()

    if (!cursoId) {
      return ApiResponse.error(request, 'ID de curso es requerido', 400)
    }

    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, completar_automatico: true }
    })

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    if (!curso.completar_automatico) {
      return ApiResponse.error(request, 'Este curso no tiene habilitada la finalización automática', 403)
    }

    const inscripcion = await prisma.inscripcion.findFirst({
      where: { usuario_id: auth.user.id, curso_id: cursoId, estado: 'ACTIVO' }
    })

    if (!inscripcion) {
      return ApiResponse.error(request, 'No tienes una inscripción activa en este curso', 403)
    }

    const lecciones = await prisma.leccion.findMany({
      where: { modulo: { curso_id: cursoId } },
      select: { id: true }
    })

    const totalLecciones = lecciones.length

    if (totalLecciones === 0) {
      await prisma.progresoCurso.upsert({
        where: { usuario_id_curso_id: { usuario_id: auth.user.id, curso_id: cursoId } },
        update: { porcentaje_progreso: 100 },
        create: { usuario_id: auth.user.id, curso_id: cursoId, porcentaje_progreso: 100 }
      })

      return ApiResponse.success(request, { porcentaje: 100, leccionesCompletadas: 0 })
    }

    const ahora = new Date()

    await prisma.$transaction([
      ...lecciones.map(l =>
        prisma.progresoLeccion.upsert({
          where: { usuario_id_leccion_id: { usuario_id: auth.user.id, leccion_id: l.id } },
          update: { esta_completado: true, completado_en: ahora },
          create: { usuario_id: auth.user.id, leccion_id: l.id, esta_completado: true, completado_en: ahora }
        })
      ),
      prisma.progresoCurso.upsert({
        where: { usuario_id_curso_id: { usuario_id: auth.user.id, curso_id: cursoId } },
        update: { porcentaje_progreso: 100 },
        create: { usuario_id: auth.user.id, curso_id: cursoId, porcentaje_progreso: 100 }
      })
    ])

    return ApiResponse.success(request, { porcentaje: 100, leccionesCompletadas: totalLecciones })
  } catch (error) {
    return handleApiError(error, request)
  }
}
