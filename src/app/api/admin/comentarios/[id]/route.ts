export const dynamic = 'force-dynamic'

import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'

/**
 * PATCH /api/admin/comentarios/[id]
 * Actualiza el estado de un comentario (APROBADO | RECHAZADO)
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const { estado } = await request.json()

    if (!['APROBADO', 'RECHAZADO'].includes(estado)) {
      return ApiResponse.error(request, 'Estado inválido', 400)
    }

    const comentario = await prisma.comentario.findUnique({ where: { id: params.id } })

    if (!comentario) return ApiResponse.error(request, 'Comentario no encontrado', 404)

    const actualizado = await prisma.comentario.update({
      where: { id: params.id },
      data: { estado }
    })

    return ApiResponse.success(request, { comentario: actualizado })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * DELETE /api/admin/comentarios/[id]
 * Elimina un comentario y sus respuestas (cascade)
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const comentario = await prisma.comentario.findUnique({ where: { id: params.id } })

    if (!comentario) return ApiResponse.error(request, 'Comentario no encontrado', 404)

    await prisma.comentario.delete({ where: { id: params.id } })

    return ApiResponse.success(request, { message: 'Comentario eliminado' })
  } catch (error) {
    return handleApiError(error, request)
  }
}
