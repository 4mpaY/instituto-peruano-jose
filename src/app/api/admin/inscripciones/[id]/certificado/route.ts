export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'

/**
 * PATCH /api/admin/inscripciones/[id]/certificado
 * Habilita o deshabilita la descarga del certificado de una inscripción.
 * Usado para cursos gratuitos con certificado de pago.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const { habilitado } = await request.json()

    if (typeof habilitado !== 'boolean') {
      return ApiResponse.error(request, 'El campo habilitado debe ser un booleano', 400)
    }

    const inscripcion = await prisma.inscripcion.findUnique({ where: { id: params.id } })

    if (!inscripcion) {
      return ApiResponse.error(request, 'Inscripción no encontrada', 404)
    }

    const actualizada = await prisma.inscripcion.update({
      where: { id: params.id },
      data: { certificado_habilitado: habilitado },
      select: { id: true, certificado_habilitado: true, usuario_id: true, curso_id: true }
    })

    return ApiResponse.success(request, { inscripcion: actualizada })
  } catch (error) {
    return handleApiError(error, request)
  }
}
