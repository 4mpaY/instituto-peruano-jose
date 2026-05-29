export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'

/**
 * POST /api/admin/inscripciones/[id]/completar-todo
 * Marca todas las lecciones del curso como completadas para el alumno de esa inscripción.
 * El admin puede hacer esto sin importar la configuración completar_automatico del curso.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: params.id },
      select: { id: true, usuario_id: true, curso_id: true }
    })

    if (!inscripcion) {
      return ApiResponse.error(request, 'Inscripción no encontrada', 404)
    }

    const lecciones = await prisma.leccion.findMany({
      where: { modulo: { curso_id: inscripcion.curso_id } },
      select: { id: true }
    })

    const totalLecciones = lecciones.length

    if (totalLecciones === 0) {
      await prisma.progresoCurso.upsert({
        where: { usuario_id_curso_id: { usuario_id: inscripcion.usuario_id, curso_id: inscripcion.curso_id } },
        update: { porcentaje_progreso: 100 },
        create: { usuario_id: inscripcion.usuario_id, curso_id: inscripcion.curso_id, porcentaje_progreso: 100 }
      })

      return ApiResponse.success(request, { porcentaje: 100, leccionesCompletadas: 0 })
    }

    const ahora = new Date()

    await prisma.$transaction([
      ...lecciones.map(l =>
        prisma.progresoLeccion.upsert({
          where: { usuario_id_leccion_id: { usuario_id: inscripcion.usuario_id, leccion_id: l.id } },
          update: { esta_completado: true, completado_en: ahora },
          create: { usuario_id: inscripcion.usuario_id, leccion_id: l.id, esta_completado: true, completado_en: ahora }
        })
      ),
      prisma.progresoCurso.upsert({
        where: { usuario_id_curso_id: { usuario_id: inscripcion.usuario_id, curso_id: inscripcion.curso_id } },
        update: { porcentaje_progreso: 100 },
        create: { usuario_id: inscripcion.usuario_id, curso_id: inscripcion.curso_id, porcentaje_progreso: 100 }
      })
    ])

    return ApiResponse.success(request, { porcentaje: 100, leccionesCompletadas: totalLecciones })
  } catch (error) {
    return handleApiError(error, request)
  }
}
