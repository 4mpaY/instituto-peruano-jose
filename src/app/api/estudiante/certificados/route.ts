export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/estudiante/certificados
 * Lista todos los certificados del estudiante autenticado
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const certificados = await prisma.certificado.findMany({
      where: { usuario_id: auth.user.id },
      include: {
        curso: {
          select: {
            id: true,
            titulo: true,
            slug: true,
            miniatura: true,
            duracion: true,
            nivel: true,
            profesor: {
              select: { nombre: true, apellido: true }
            }
          }
        }
      },
      orderBy: { emitido_en: 'desc' }
    })

    return ApiResponse.success(request, {
      certificados: certificados.map(c => ({
        id: c.id,
        codigo_verificacion: c.codigo_verificacion,
        emitido_en: c.emitido_en,
        tipo: c.tipo,
        curso: c.curso
      }))
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
