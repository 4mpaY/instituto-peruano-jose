export const dynamic = 'force-dynamic'

import { Prisma } from '@prisma/client'

import prisma from '@/utils/libs/prisma'
import { validateRequest, handleApiError } from '@/utils/libs/validation'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { listarPedidosQuerySchema } from '@/schemas/pedido.schema'

/**
 * GET /api/pedidos
 * Listar todos los pedidos (solo ADMIN)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())

    const validation = validateRequest(listarPedidosQuerySchema, query, request)

    if (!validation.success) {
      return validation.error
    }

    const { page, limit, estado, buscar, nro_pedido, nombre, cursoId } = validation.data

    const where: any = {}
    
    // Si el estado no es 'TODOS', aplicamos el filtro. 
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }

    if (nro_pedido) {
      const nro = parseInt(nro_pedido)

      if (!isNaN(nro)) {
        where.numero_pedido = nro
      }
    }

    if (nombre) {
      where.OR = [
        { usuario: { nombre: { contains: nombre, mode: 'insensitive' } } },
        { usuario: { apellido: { contains: nombre, mode: 'insensitive' } } },
        { usuario: { correo: { contains: nombre, mode: 'insensitive' } } }
      ]
    }

    if (cursoId && cursoId !== 'TODOS') {
      where.detalles = {
        some: {
          curso_id: cursoId
        }
      }
    }

    if (buscar) {
      // Búsqueda general por transaccion_id o términos varios si no se especificaron filtros fijos
      if (!where.OR) {
        where.OR = [
          { usuario: { nombre: { contains: buscar, mode: 'insensitive' } } },
          { usuario: { apellido: { contains: buscar, mode: 'insensitive' } } },
          { usuario: { correo: { contains: buscar, mode: 'insensitive' } } },
          { transaccion_id: { contains: buscar } }
        ]
      }
    }

    const skip = (page - 1) * limit

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creado_en: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              correo: true,
              numero_documento: true,
              celular: true
            }
          },
          cupon: {
            select: {
              codigo: true
            }
          },
          metodo_pago_manual: {
            select: {
              nombre: true,
              nombre_banco: true
            }
          },
          detalles: {
            include: {
              curso: {
                select: {
                  titulo: true
                }
              }
            }
          }
        }
      }),
      prisma.pedido.count({ where })
    ])

    const pedidoIds = pedidos.map(p => p.id)
    let tipoByPedido = new Map<string, string>()
    let certByDetalle = new Map<string, string | null>()

    if (pedidoIds.length > 0) {
      const tipos = await prisma.$queryRaw<Array<{ id: string; tipo: string }>>`
        SELECT id, tipo::text AS tipo FROM pedidos
        WHERE id IN (${Prisma.join(pedidoIds)})
      `

      tipoByPedido = new Map(tipos.map(t => [t.id, t.tipo]))

      const certs = await prisma.$queryRaw<Array<{ id: string; certificado_tipo: string | null }>>`
        SELECT id, certificado_tipo::text AS certificado_tipo
        FROM detalles_pedido
        WHERE pedido_id IN (${Prisma.join(pedidoIds)})
      `

      certByDetalle = new Map(certs.map(c => [c.id, c.certificado_tipo]))
    }

    const pedidosEnriquecidos = pedidos.map(p => ({
      ...p,
      tipo: tipoByPedido.get(p.id) || 'CURSO',
      detalles: p.detalles.map(d => ({
        ...d,
        certificado_tipo: certByDetalle.get(d.id) || null,
      })),
    }))

    return ApiResponse.success(request, {
      pedidos: pedidosEnriquecidos,
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
