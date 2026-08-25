export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { parsePeruDate } from '@/utils/functions/dateHelpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireProfesorOrAdmin } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/cursos/[id]/examenes
 * Lista todos los exámenes del curso (FINAL e INTERMEDIOS)
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireProfesorOrAdmin(request)

    if (!auth.authorized) return auth.error

    const { id: cursoId } = params

    const curso = await prisma.curso.findUnique({ where: { id: cursoId } })

    if (!curso) return ApiResponse.error(request, 'Curso no encontrado', 404)

    if (auth.user.rol === 'PROFESOR' && curso.profesor_id !== auth.user.id) {
      return ApiResponse.error(request, 'No tienes permiso para ver este curso', 403)
    }

    const examenes = await prisma.examen.findMany({
      where: { curso_id: cursoId },
      orderBy: [{ tipo: 'asc' }, { orden: 'asc' }],
      include: {
        preguntas: {
          orderBy: { orden: 'asc' },
          include: { opciones: { orderBy: { orden: 'asc' } } }
        },
        modulo: { select: { id: true, titulo: true, orden: true } }
      }
    })

    return ApiResponse.success(request, { examenes })
  } catch (error: any) {
    return handleApiError(error, request)
  }
}

/**
 * POST /api/cursos/[id]/examenes
 * Crear un nuevo examen (FINAL o INTERMEDIO)
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireProfesorOrAdmin(request)

    if (!auth.authorized) return auth.error

    const { id: cursoId } = params
    const body = await request.json()
    
    const {
      titulo,
      descripcion,
      tipo = 'INTERMEDIO',
      peso = 20,
      progreso_minimo = 0,
      limite_tiempo,
      puntaje_aprobacion = 60,
      intentos_maximos = 1,
      esta_publicado = false,
      mezclar_preguntas = false,
      modulo_id,
      fecha_inicio,
      fecha_fin
    } = body

    if (!titulo) return ApiResponse.error(request, 'El título es requerido', 400)

    const curso = await prisma.curso.findUnique({ where: { id: cursoId } })

    if (!curso) return ApiResponse.error(request, 'Curso no encontrado', 404)

    if (auth.user.rol === 'PROFESOR' && curso.profesor_id !== auth.user.id) {
      return ApiResponse.error(request, 'No tienes permiso para editar este curso', 403)
    }

    // Validate modulo_id if provided
    if (modulo_id) {
      const modulo = await prisma.modulo.findUnique({ where: { id: modulo_id } })

      if (!modulo || modulo.curso_id !== cursoId) {
        return ApiResponse.error(request, 'Módulo no encontrado en este curso', 404)
      }
    }

    // Determine next orden for INTERMEDIO within the module
    let orden: number | null = null

    if (tipo === 'INTERMEDIO' && modulo_id) {
      const maxOrden = await prisma.examen.aggregate({
        where: { curso_id: cursoId, modulo_id, tipo: 'INTERMEDIO' },
        _max: { orden: true }
      })


      orden = (maxOrden._max.orden ?? -1) + 1
    }

    const examen = await prisma.examen.create({
      data: {
        titulo,
        descripcion,
        tipo,
        peso: Number(peso),
        progreso_minimo: Number(progreso_minimo),
        orden,
        limite_tiempo: limite_tiempo ? Number(limite_tiempo) : null,
        puntaje_aprobacion: Number(puntaje_aprobacion),
        intentos_maximos: Number(intentos_maximos),
        esta_publicado,
        mezclar_preguntas,
        curso_id: cursoId,
        modulo_id: modulo_id || null,
        fecha_inicio: fecha_inicio ? parsePeruDate(fecha_inicio) : null,
        fecha_fin: fecha_fin ? parsePeruDate(fecha_fin) : null
      },
      include: {
        modulo: { select: { id: true, titulo: true, orden: true } },
        _count: { select: { preguntas: true } }
      }
    })

    return ApiResponse.success(request, { examen }, 201)
  } catch (error: any) {
    return handleApiError(error, request)
  }
}
