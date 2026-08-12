import prisma from '@/utils/libs/prisma'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * POST /api/estudiante/progreso
 * Cuerpo: { leccionId: string, estaCompletado: boolean }
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { leccionId, estaCompletado } = await request.json()

    if (!leccionId) {
      return ApiResponse.error(request, 'ID de lección es requerido', 400)
    }

    // 1. Obtener información de la lección y el curso
    const leccion = await prisma.leccion.findUnique({
      where: { id: leccionId },
      include: {
        modulo: {
          select: { curso_id: true }
        }
      }
    })

    if (!leccion) {
      return ApiResponse.error(request, 'Lección no encontrada', 404)
    }

    const cursoId = leccion.modulo.curso_id

    // 2. Actualizar o crear ProgresoLeccion
    await prisma.progresoLeccion.upsert({
      where: {
        usuario_id_leccion_id: {
          usuario_id: auth.user.id,
          leccion_id: leccionId
        }
      },
      update: {
        esta_completado: estaCompletado,
        completado_en: estaCompletado ? new Date() : null
      },
      create: {
        usuario_id: auth.user.id,
        leccion_id: leccionId,
        esta_completado: estaCompletado,
        completado_en: estaCompletado ? new Date() : null
      }
    })

    // 3. Verificar si el curso tiene evaluaciones
    const examenesDelCurso = await prisma.examen.count({
      where: {
        curso_id: cursoId,
        esta_publicado: true
      }
    })

    let porcentaje = 0
    let progresoCurso = await prisma.progresoCurso.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: auth.user.id,
          curso_id: cursoId
        }
      }
    })

    if (examenesDelCurso > 0) {
      // Si hay exámenes, el porcentaje se mantiene (se actualiza al enviar un examen)
      porcentaje = progresoCurso?.porcentaje_progreso || 0
      
      if (!progresoCurso) {
        progresoCurso = await prisma.progresoCurso.create({
          data: {
            usuario_id: auth.user.id,
            curso_id: cursoId,
            porcentaje_progreso: 0
          }
        })
      }
    } else {
      // Si no hay exámenes, se calcula en base a las lecciones
      const todasLasLecciones = await prisma.leccion.findMany({
        where: {
          modulo: { curso_id: cursoId }
        },
        select: { id: true }
      })

      const totalLecciones = todasLasLecciones.length

      if (totalLecciones > 0) {
        const leccionesCompletadasCount = await prisma.progresoLeccion.count({
          where: {
            usuario_id: auth.user.id,
            esta_completado: true,
            leccion: {
              modulo: { curso_id: cursoId }
            }
          }
        })

        porcentaje = Math.round((leccionesCompletadasCount / totalLecciones) * 100)
      } else {
        porcentaje = 100
      }

      progresoCurso = await prisma.progresoCurso.upsert({
        where: {
          usuario_id_curso_id: {
            usuario_id: auth.user.id,
            curso_id: cursoId
          }
        },
        update: {
          porcentaje_progreso: porcentaje
        },
        create: {
          usuario_id: auth.user.id,
          curso_id: cursoId,
          porcentaje_progreso: porcentaje
        }
      })
    }

    return ApiResponse.success(request, { 
      porcentaje,
      leccionId,
      estaCompletado,
      progresoCursoId: progresoCurso.id
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
