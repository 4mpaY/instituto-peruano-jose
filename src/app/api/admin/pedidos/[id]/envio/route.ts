import { z } from 'zod'

import { handleApiError, validateRequest } from '@/utils/libs/validation'
import { ApiResponse } from '@/utils/libs/apiResponse'
import prisma from '@/utils/libs/prisma'
import { requireAdmin } from '@/utils/libs/auth-helpers'

const updateEnvioSchema = z.object({
  estado_envio: z.enum(['En origen', 'En tránsito', 'Listo para recojo', 'Entregado', 'Hubo un error']),
  empresa_transportista: z.string().min(1, 'La empresa es requerida'),
  numero_seguimiento: z.string().min(1, 'El número de seguimiento es requerido'),
  numero_recojo: z.string().optional().nullable(),
  error_telefono: z.string().optional().nullable(),
  departamento: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  direccion: z.string().optional(),
  referencia: z.string().optional(),
})

/**
 * PATCH /api/admin/pedidos/[id]/envio
 * Actualizar los datos de envío de un pedido (solo ADMIN).
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { id } = params
    const body = await request.json()

    const validation = validateRequest(updateEnvioSchema, body, request)

    if (!validation.success) {
      return validation.error
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      select: { datos_envio: true }
    })

    if (!pedido) {
      return ApiResponse.error(request, 'Pedido no encontrado', 404)
    }

    // Mantener los datos de envío existentes y mezclar con los nuevos
    const currentDatosEnvio = typeof pedido.datos_envio === 'object' && pedido.datos_envio !== null 
      ? pedido.datos_envio 
      : {}

    const newDatosEnvio = {
      ...(currentDatosEnvio as any),
      ...validation.data
    }

    await prisma.pedido.update({
      where: { id },
      data: {
        datos_envio: newDatosEnvio
      }
    })

    return ApiResponse.success(request, { message: 'Datos de envío actualizados correctamente' })
  } catch (error) {
    return handleApiError(error, request)
  }
}
