export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { actualizarCursoSchema } from '@/schemas/curso.schema'
import { validateRequest, handleApiError } from '@/utils/libs/validation'
import { requireProfesorOrAdmin, requireAuth } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { sanitizeDatetimeInput } from '@/utils/functions/sanitizeDatetime'

/**
 * Genera un slug a partir de un texto
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function generateUniqueSlug(titulo: string, excludeId?: string): Promise<string> {
  const slug = generateSlug(titulo)
  let counter = 0
  let candidateSlug = slug

  while (true) {
    const existing = await prisma.curso.findUnique({
      where: { slug: candidateSlug }
    })

    if (!existing || existing.id === excludeId) {
      return candidateSlug
    }

    counter++
    candidateSlug = `${slug}-${counter}`
  }
}

const cursoInclude = {
  profesor: {
    select: { id: true, nombre: true, apellido: true, avatar: true }
  },
  categoria: {
    select: { id: true, nombre: true }
  },
  modulos: {
    orderBy: { orden: 'asc' as const },
    include: {
      lecciones: {
        orderBy: { orden: 'asc' as const },
        select: {
          id: true,
          titulo: true,
          orden: true,
          duracion: true,
          video_url: true,
          recursos: true,
          es_vista_previa: true,
          contenido: true,
          estado: true,
          es_en_vivo: true,
          fecha_programada: true,
          fecha_fin: true,
          enlace_reunion: true
        }
      },
      examenes: {
        orderBy: { orden: 'asc' as const },
        select: {
          id: true,
          titulo: true,
          tipo: true,
          peso: true,
          progreso_minimo: true,
          orden: true,
          puntaje_aprobacion: true,
          intentos_maximos: true,
          esta_publicado: true,
          limite_tiempo: true,
          modulo_id: true,
          _count: { select: { preguntas: true } }
        }
      }
    }
  },
  _count: {
    select: { modulos: true, inscripciones: true }
  }
}

/**
 * GET /api/cursos/[id]
 * Obtener curso completo con módulos, lecciones, profesor y categoría
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { id } = params

    const curso = await prisma.curso.findUnique({
      where: { id },
      include: cursoInclude
    })

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    const { user } = auth

    if (user.rol === 'PROFESOR' && curso.profesor_id !== user.id) {
      return ApiResponse.error(request, 'No tienes permiso para ver este curso', 403)
    }

    return ApiResponse.success(request, curso)
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * PATCH /api/cursos/[id]
 * Actualizar datos del curso
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireProfesorOrAdmin(request)

    if (!auth.authorized) return auth.error

    const { user } = auth
    const { id } = params
    const body = await request.json()
    const validation = validateRequest(actualizarCursoSchema, body, request)

    if (!validation.success) return validation.error

    const data = validation.data

    // Verificar que el curso existe
    const curso = await prisma.curso.findUnique({
      where: { id }
    })

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    // Si es PROFESOR, solo puede editar si es el dueño
    if (user.rol === 'PROFESOR' && curso.profesor_id !== user.id) {
      return ApiResponse.error(request, 'No tienes permiso para editar este curso', 403)
    }

    const updateData: any = { ...data }

    // Si se actualiza el título, regenerar slug
    if (data.titulo && data.titulo !== curso.titulo) {
      updateData.slug = await generateUniqueSlug(data.titulo, id)
    }

    if (data.fecha_inicio) {
      const fechaInicio = sanitizeDatetimeInput(data.fecha_inicio)

      updateData.fecha_inicio = fechaInicio ? new Date(fechaInicio) : null
    } else if (data.fecha_inicio === null) {
      updateData.fecha_inicio = null
    }

    if (data.fecha_fin) {
      const fechaFin = sanitizeDatetimeInput(data.fecha_fin)

      updateData.fecha_fin = fechaFin ? new Date(fechaFin) : null
    } else if (data.fecha_fin === null) {
      updateData.fecha_fin = null
    }

    // Verificar profesor si se cambia
    if (data.profesor_id && data.profesor_id !== curso.profesor_id) {
      const profesor = await prisma.usuario.findUnique({
        where: { id: data.profesor_id }
      })

      if (!profesor) {
        return ApiResponse.error(request, 'El profesor seleccionado no existe', 404)
      }

      if (profesor.rol !== 'PROFESOR' && profesor.rol !== 'ADMIN') {
        return ApiResponse.error(request, 'El usuario seleccionado no tiene rol de profesor', 400)
      }
    }

    // Verificar categoría si se cambia
    if (data.categoria_id) {
      const categoria = await prisma.categoria.findUnique({
        where: { id: data.categoria_id }
      })

      if (!categoria) {
        return ApiResponse.error(request, 'La categoría seleccionada no existe', 404)
      }
    }

    const cursoActualizado = await prisma.curso.update({
      where: { id },
      data: updateData,
      include: cursoInclude
    })

    return ApiResponse.success(request, { curso: cursoActualizado })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * DELETE /api/cursos/[id]
 * Eliminar un curso (solo en estado BORRADOR)
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireProfesorOrAdmin(request)

    if (!auth.authorized) return auth.error

    const { user } = auth
    const { id } = params

    const curso = await prisma.curso.findUnique({
      where: { id },
      include: {
        _count: { select: { inscripciones: true } }
      }
    })

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    // Si es PROFESOR, solo puede eliminar si es el dueño
    if (user.rol === 'PROFESOR' && curso.profesor_id !== user.id) {
      return ApiResponse.error(request, 'No tienes permiso para eliminar este curso', 403)
    }

    if (curso.estado !== 'BORRADOR') {
      return ApiResponse.error(
        request,
        'Solo se pueden eliminar cursos en estado Borrador. Archiva el curso primero.',
        400
      )
    }

    if (curso._count.inscripciones > 0) {
      return ApiResponse.error(
        request,
        `No se puede eliminar: este curso tiene ${curso._count.inscripciones} inscripción(es)`,
        409
      )
    }

    await prisma.curso.delete({
      where: { id }
    })

    return ApiResponse.success(request, { message: 'Curso eliminado exitosamente' })
  } catch (error) {
    return handleApiError(error, request)
  }
}
