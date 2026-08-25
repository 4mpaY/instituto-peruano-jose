export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { parsePeruDate } from '@/utils/functions/dateHelpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireProfesorOrAdmin } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

async function verifyCursoAccess(request: Request, cursoId: string) {
  const auth = await requireProfesorOrAdmin(request)

  if (!auth.authorized) return { authorized: false as const, error: auth.error }

  const curso = await prisma.curso.findUnique({ where: { id: cursoId } })

  if (!curso) return { authorized: false as const, error: ApiResponse.error(request, 'Curso no encontrado', 404) }

  if (auth.user.rol === 'PROFESOR' && curso.profesor_id !== auth.user.id) {
    return { authorized: false as const, error: ApiResponse.error(request, 'No tienes permiso', 403) }
  }

  return { authorized: true as const, auth, curso }
}

/**
 * GET /api/cursos/[id]/examenes/[examenId]
 * Obtener un examen con todas sus preguntas
 */
export async function GET(request: Request, { params }: { params: { id: string; examenId: string } }) {
  try {
    const access = await verifyCursoAccess(request, params.id)

    if (!access.authorized) return access.error

    const examen = await prisma.examen.findUnique({
      where: { id: params.examenId },
      include: {
        preguntas: {
          orderBy: { orden: 'asc' },
          include: { opciones: { orderBy: { orden: 'asc' } } }
        },
        modulo: { select: { id: true, titulo: true, orden: true } }
      }
    })

    if (!examen || examen.curso_id !== params.id) {
      return ApiResponse.error(request, 'Examen no encontrado', 404)
    }

    return ApiResponse.success(request, { examen })
  } catch (error: any) {
    return handleApiError(error, request)
  }
}

/**
 * PATCH /api/cursos/[id]/examenes/[examenId]
 * Actualizar configuración de un examen
 */
export async function PATCH(request: Request, { params }: { params: { id: string; examenId: string } }) {
  try {
    const access = await verifyCursoAccess(request, params.id)

    if (!access.authorized) return access.error

    const examen = await prisma.examen.findUnique({ where: { id: params.examenId } })

    if (!examen || examen.curso_id !== params.id) {
      return ApiResponse.error(request, 'Examen no encontrado', 404)
    }

    const body = await request.json()

    const {
      titulo,
      descripcion,
      peso,
      progreso_minimo,
      limite_tiempo,
      puntaje_aprobacion,
      intentos_maximos,
      esta_publicado,
      mezclar_preguntas,
      modulo_id,
      fecha_inicio,
      fecha_fin
    } = body

    const updated = await prisma.examen.update({
      where: { id: params.examenId },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(peso !== undefined && { peso: Number(peso) }),
        ...(progreso_minimo !== undefined && { progreso_minimo: Number(progreso_minimo) }),
        ...(limite_tiempo !== undefined && { limite_tiempo: limite_tiempo ? Number(limite_tiempo) : null }),
        ...(puntaje_aprobacion !== undefined && { puntaje_aprobacion: Number(puntaje_aprobacion) }),
        ...(intentos_maximos !== undefined && { intentos_maximos: Number(intentos_maximos) }),
        ...(esta_publicado !== undefined && { esta_publicado }),
        ...(mezclar_preguntas !== undefined && { mezclar_preguntas }),
        ...(modulo_id !== undefined && { modulo_id: modulo_id || null }),
        ...(fecha_inicio !== undefined && { fecha_inicio: fecha_inicio ? parsePeruDate(fecha_inicio) : null }),
        ...(fecha_fin !== undefined && { fecha_fin: fecha_fin ? parsePeruDate(fecha_fin) : null })
      },
      include: {
        modulo: { select: { id: true, titulo: true, orden: true } },
        _count: { select: { preguntas: true } }
      }
    })

    return ApiResponse.success(request, { examen: updated })
  } catch (error: any) {
    return handleApiError(error, request)
  }
}

/**
 * DELETE /api/cursos/[id]/examenes/[examenId]
 * Eliminar un examen
 */
export async function DELETE(request: Request, { params }: { params: { id: string; examenId: string } }) {
  try {
    const access = await verifyCursoAccess(request, params.id)

    if (!access.authorized) return access.error

    const examen = await prisma.examen.findUnique({ where: { id: params.examenId } })

    if (!examen || examen.curso_id !== params.id) {
      return ApiResponse.error(request, 'Examen no encontrado', 404)
    }

    await prisma.examen.delete({ where: { id: params.examenId } })

    return ApiResponse.success(request, { message: 'Examen eliminado' })
  } catch (error: any) {
    return handleApiError(error, request)
  }
}
