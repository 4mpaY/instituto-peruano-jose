export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import { sanitizeDatetimeInput } from '@/utils/functions/sanitizeDatetime'
import { parsePeruDate } from '@/utils/functions/dateHelpers'


/**
 * GET /api/cupones/[id]
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const cupon = await prisma.cupon.findUnique({
      where: { id: params.id },
      include: {
        cursos: {
          include: {
            curso: { select: { id: true, titulo: true } }
          }
        }
      }
    })

    if (!cupon) {
      return ApiResponse.error(request, 'Cupón no encontrado', 404)
    }

    return ApiResponse.success(request, cupon)
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * PATCH /api/cupones/[id]
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const data = await request.json()

    // No permitir cambiar el código si ya existe otro con ese nombre
    if (data.codigo) {
      const cuponExistente = await prisma.cupon.findFirst({
        where: { 
          codigo: data.codigo.toUpperCase(),
          id: { not: params.id }
        }
      })

      if (cuponExistente) {
        return ApiResponse.error(request, 'Ya existe otro cupón con ese código', 400)
      }

      data.codigo = data.codigo.toUpperCase()
    }

    const { cursoIds, ...camposBase } = data

    if (cursoIds !== undefined) {
      await prisma.cuponCurso.deleteMany({ where: { cupon_id: params.id } })
      
      if (Array.isArray(cursoIds) && cursoIds.length > 0) {
        await prisma.cuponCurso.createMany({
          data: cursoIds.map((id: string) => ({ cupon_id: params.id, curso_id: id }))
        })
      }
    }

    const fechaExpiracion = sanitizeDatetimeInput(camposBase.fecha_expiracion)

    const cuponActualizado = await prisma.cupon.update({
      where: { id: params.id },
      data: {
        ...camposBase,
        valor: camposBase.valor ? Number(camposBase.valor) : undefined,
        limite_uso: camposBase.limite_uso !== undefined ? (camposBase.limite_uso ? Number(camposBase.limite_uso) : null) : undefined,
        fecha_expiracion: fechaExpiracion ? parsePeruDate(fechaExpiracion) : undefined
      },
      include: {
        cursos: {
          include: {
            curso: { select: { id: true, titulo: true } }
          }
        }
      }
    })

    return ApiResponse.success(request, cuponActualizado)
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * DELETE /api/cupones/[id]
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    // TODO: ¿Deberíamos borrarlo o solo desactivarlo? 
    // Por ahora borrado físico, pero si tiene pedidos asociados lanzará error de FK, lo cual es correcto.
    await prisma.cupon.delete({
      where: { id: params.id }
    })

    return ApiResponse.success(request, { message: 'Cupón eliminado correctamente' })
  } catch (error) {
    return handleApiError(error, request)
  }
}
