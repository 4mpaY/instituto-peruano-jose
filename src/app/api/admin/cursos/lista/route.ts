export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/admin/cursos/lista
 * Lista simplificada de cursos publicados para el selector de cupones (Solo ADMIN)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const cursos = await prisma.curso.findMany({
      select: { id: true, titulo: true, estado: true, tipo_emision: true, fecha_inicio: true, creado_en: true },
      orderBy: { titulo: 'asc' }
    })

    return ApiResponse.success(request, { cursos })
  } catch (error) {
    return handleApiError(error, request)
  }
}
