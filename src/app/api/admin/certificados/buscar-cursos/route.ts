export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/admin/certificados/buscar-cursos?buscar=texto
 * Busca cursos para el autocomplete del modal de creación de certificados
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar') || ''

    const cursos = await prisma.curso.findMany({
      where: buscar
        ? { titulo: { contains: buscar, mode: 'insensitive' } }
        : {},
      select: { id: true, titulo: true, estado: true },
      orderBy: [{ estado: 'asc' }, { titulo: 'asc' }]
    })

    return ApiResponse.success(request, { cursos })
  } catch (error) {
    return handleApiError(error, request)
  }
}
