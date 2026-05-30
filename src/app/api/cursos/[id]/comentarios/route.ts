export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { requireProfesorOrAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'

/**
 * GET /api/cursos/[id]/comentarios
 * Obtener todos los comentarios de todas las lecciones de un curso
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireProfesorOrAdmin(request)

    if (!auth.authorized) return auth.error

    const { user } = auth
    const { id: cursoId } = params

    // Verificar que el curso existe
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { profesor_id: true, id: true }
    })

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    // Si es PROFESOR, solo puede ver comentarios si es el dueño
    if (user.rol === 'PROFESOR' && curso.profesor_id !== user.id) {
      return ApiResponse.error(request, 'No tienes permiso para ver los comentarios de este curso', 403)
    }

    const { searchParams } = new URL(request.url)
    const estadoFilter = searchParams.get('estado')

    const whereEstado = estadoFilter && ['PENDIENTE', 'APROBADO', 'RECHAZADO'].includes(estadoFilter)
      ? { estado: estadoFilter as any }
      : {}

    // Obtener todos los comentarios de las lecciones de este curso
    const comentarios = await prisma.comentario.findMany({
      where: {
        leccion: { modulo: { curso_id: cursoId } },
        respuesta_a_id: null,
        ...whereEstado
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            avatar: true,
            rol: true
          }
        },
        leccion: {
          select: {
            id: true,
            titulo: true,
            modulo: {
              select: {
                titulo: true
              }
            }
          }
        },
        respuestas: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                avatar: true,
                rol: true
              }
            }
          }
        }
      },
      orderBy: {
        creado_en: 'desc'
      }
    })

    return ApiResponse.success(request, { comentarios })
  } catch (error) {
    console.error('[API_CURSO_COMENTARIOS]', error)
    
return ApiResponse.error(request, 'Error al obtener comentarios', 500)
  }
}
