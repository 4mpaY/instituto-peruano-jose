export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/admin/certificados/buscar-usuarios?q=texto
 * Busca estudiantes para el autocomplete del modal de creación de certificados
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    const usuarios = await prisma.usuario.findMany({
      where: {
        esta_activo: true,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { apellido: { contains: q, mode: 'insensitive' } },
          { correo: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { id: true, nombre: true, apellido: true, correo: true, avatar: true },
      orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
      take: 20
    })

    return ApiResponse.success(request, { usuarios })
  } catch (error) {
    return handleApiError(error, request)
  }
}
