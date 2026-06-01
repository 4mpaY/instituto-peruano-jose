import prisma from '@/utils/libs/prisma'
import { crearLeccionSchema } from '@/schemas/leccion.schema'
import { validateRequest, handleApiError } from '@/utils/libs/validation'
import { requireProfesorOrAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'

/**
 * POST /api/cursos/[id]/modulos/[moduloId]/lecciones
 * Crear una lección dentro de un módulo
 */
export async function POST(request: Request, { params }: { params: { id: string; moduloId: string } }) {
  try {
    const auth = await requireProfesorOrAdmin(request)

    if (!auth.authorized) return auth.error

    const { user } = auth

    const { id: cursoId, moduloId } = params
    const body = await request.json()

    const validation = validateRequest(crearLeccionSchema, body, request)

    if (!validation.success) return validation.error

    // Verificar que el módulo existe y pertenece al curso
    const modulo = await prisma.modulo.findFirst({
      where: { id: moduloId, curso_id: cursoId }
    })

    if (!modulo) {
      return ApiResponse.error(request, 'Módulo no encontrado en este curso', 404)
    }

    // Verificar propiedad del curso
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { profesor_id: true }
    })

    if (user.rol === 'PROFESOR' && curso?.profesor_id !== user.id) {
      return ApiResponse.error(request, 'No tienes permiso para gestionar este curso', 403)
    }

    // Calcular el siguiente orden
    const ultimaLeccion = await prisma.leccion.findFirst({
      where: { modulo_id: moduloId },
      orderBy: { orden: 'desc' }
    })

    const orden = (ultimaLeccion?.orden ?? -1) + 1

    const nuevaLeccion = await prisma.leccion.create({
      data: {
        titulo: validation.data.titulo,
        contenido: validation.data.contenido || null,
        duracion: validation.data.duracion || null,
        enlace_reunion: validation.data.enlace_reunion || null,
        video_url: validation.data.video_url || null,
        es_vista_previa: validation.data.es_vista_previa || false,
        es_en_vivo: validation.data.es_en_vivo || false,
        fecha_programada: validation.data.fecha_programada ? new Date(validation.data.fecha_programada) : null,
        fecha_fin: validation.data.fecha_fin ? new Date(validation.data.fecha_fin) : null,
        recursos: validation.data.recursos || [],
        orden,
        estado: 'PUBLICADO',
        modulo_id: moduloId
      }
    })

    return ApiResponse.success(request, { leccion: nuevaLeccion }, 201)
  } catch (error) {
    return handleApiError(error, request)
  }
}
