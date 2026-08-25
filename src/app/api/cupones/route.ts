export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { parsePeruDate } from '@/utils/functions/dateHelpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import { sanitizeDatetimeInput } from '@/utils/functions/sanitizeDatetime'

/**
 * GET /api/cupones
 * Listar cupones (Solo ADMIN)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const buscar = searchParams.get('buscar') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (buscar) {
      where.OR = [
        { codigo: { contains: buscar, mode: 'insensitive' } }
      ]
    }

    const [cupones, total] = await Promise.all([
      prisma.cupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creado_en: 'desc' },
        include: {
          cursos: {
            include: {
              curso: { select: { id: true, titulo: true } }
            }
          }
        }
      }),
      prisma.cupon.count({ where })
    ])

    return ApiResponse.success(request, {
      cupones,
      paginacion: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * POST /api/cupones
 * Crear un nuevo cupón (Solo ADMIN)
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const data = await request.json()
    
    // Validación básica manual (podría usarse un esquema de Zod)
    if (!data.codigo || !data.valor || !data.tipo) {
      return ApiResponse.error(request, 'Faltan campos obligatorios', 400)
    }

    const cuponExistente = await prisma.cupon.findUnique({
      where: { codigo: data.codigo.toUpperCase() }
    })

    if (cuponExistente) {
      return ApiResponse.error(request, 'Ya existe un cupón con ese código', 400)
    }

    const cursoIds: string[] = Array.isArray(data.cursoIds) ? data.cursoIds : []

    const fechaExpiracion = sanitizeDatetimeInput(data.fecha_expiracion)

    const nuevoCupon = await prisma.cupon.create({
      data: {
        codigo: data.codigo.toUpperCase(),
        valor: data.valor,
        tipo: data.tipo,
        limite_uso: data.limite_uso ? Number(data.limite_uso) : null,
        fecha_expiracion: fechaExpiracion ? parsePeruDate(fechaExpiracion) : null,
        esta_activo: data.esta_activo !== undefined ? data.esta_activo : true,
        cursos: cursoIds.length > 0
          ? { create: cursoIds.map((id: string) => ({ curso_id: id })) }
          : undefined
      },
      include: {
        cursos: {
          include: {
            curso: { select: { id: true, titulo: true } }
          }
        }
      }
    })

    return ApiResponse.success(request, nuevoCupon, 201)
  } catch (error) {
    return handleApiError(error, request)
  }
}
