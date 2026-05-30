export const dynamic = 'force-dynamic'

import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'

/**
 * GET /api/admin/comentarios
 * Lista comentarios con filtro por estado y curso
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') || undefined
    const cursoId = searchParams.get('cursoId') || undefined
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(50, Number(searchParams.get('limit') || '20'))
    const skip = (page - 1) * limit

    const where: any = { respuesta_a_id: null }

    if (estado && ['PENDIENTE', 'APROBADO', 'RECHAZADO'].includes(estado)) {
      where.estado = estado
    }

    if (cursoId) {
      where.leccion = { modulo: { curso_id: cursoId } }
    }

    const [comentarios, total] = await Promise.all([
      prisma.comentario.findMany({
        where,
        include: {
          usuario: {
            select: { id: true, nombre: true, apellido: true, avatar: true, rol: true }
          },
          leccion: {
            select: {
              id: true,
              titulo: true,
              modulo: { select: { titulo: true, curso: { select: { id: true, titulo: true } } } }
            }
          },
          respuestas: {
            include: {
              usuario: {
                select: { id: true, nombre: true, apellido: true, avatar: true, rol: true }
              }
            },
            orderBy: { creado_en: 'asc' }
          }
        },
        orderBy: { creado_en: 'desc' },
        skip,
        take: limit
      }),
      prisma.comentario.count({ where })
    ])

    return ApiResponse.success(request, {
      comentarios,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
