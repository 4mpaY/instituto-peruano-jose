export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/admin/inscripciones/certificados-pago
 * Lista inscripciones a cursos que tienen precio_certificado > 0.
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const { searchParams } = new URL(request.url)
    const nombre = searchParams.get('nombre') || ''
    const soloSinHabilitar = searchParams.get('pendientes') === 'true'

    const where: any = {
      curso: { precio_certificado: { not: null, gt: 0 } },
      estado: 'ACTIVO'
    }

    if (soloSinHabilitar) {
      where.certificado_habilitado = false
    }

    if (nombre) {
      where.OR = [
        { usuario: { nombre: { contains: nombre, mode: 'insensitive' } } },
        { usuario: { apellido: { contains: nombre, mode: 'insensitive' } } },
        { usuario: { correo: { contains: nombre, mode: 'insensitive' } } }
      ]
    }

    const inscripciones = await prisma.inscripcion.findMany({
      where,
      orderBy: { inscrito_en: 'desc' },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, correo: true, avatar: true } },
        curso: { select: { id: true, titulo: true, precio_certificado: true, moneda: true } }
      }
    })

    return ApiResponse.success(request, { inscripciones })
  } catch (error) {
    return handleApiError(error, request)
  }
}
