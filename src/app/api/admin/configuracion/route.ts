export const dynamic = 'force-dynamic'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'

/**
 * GET /api/admin/configuracion
 * Obtiene todas las configuraciones del sistema
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized || auth.user.rol !== 'ADMIN') {
      return ApiResponse.error(request, 'No tienes permisos para realizar esta acción', 403)
    }

    const configuraciones = await prisma.configuracion.findMany({
      orderBy: { clave: 'asc' }
    })

    return ApiResponse.success(request, configuraciones)
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * POST /api/admin/configuracion
 * Actualiza o crea configuraciones
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized || auth.user.rol !== 'ADMIN') {
      return ApiResponse.error(request, 'No tienes permisos para realizar esta acción', 403)
    }

    const { configuraciones } = await request.json()

    if (!Array.isArray(configuraciones)) {
      return ApiResponse.error(request, 'Datos inválidos', 400)
    }

    // Actualizar en lote usando upsert de Prisma
    for (const conf of configuraciones) {
      try {
        if (conf.valor === undefined || conf.valor === null) {
          console.error(`[CONFIG_SAVE_ERROR] Clave ${conf.clave} tiene un valor inválido:`, conf.valor)

          // Forzar a string vacío o saltar
          conf.valor = ''
        }

        await prisma.configuracion.upsert({
          where: { clave: conf.clave },
          update: {
            valor: String(conf.valor),
            descripcion: conf.descripcion || ''
          },
          create: {
            clave: conf.clave,
            valor: String(conf.valor),
            descripcion: conf.descripcion || ''
          }
        })
      } catch (err: any) {
        console.error(`[CONFIG_SAVE_ERROR] Falló al guardar la clave "${conf.clave}":`, err)
        throw err
      }
    }

    // Limpiar caché después de actualizar
    const { clearConfigCache } = await import('@/utils/libs/config')

    clearConfigCache()

    return ApiResponse.success(request, { message: 'Configuraciones actualizadas' })
  } catch (error: any) {
    console.error('[CONFIG_ROUTE_ERROR] Error general:', error)
    
return handleApiError(error, request)
  }
}
