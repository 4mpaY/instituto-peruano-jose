export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import { getConfigs } from '@/utils/libs/config'

/**
 * GET /api/metodos-pago
 * Retorna los métodos de pago manual activos y la config global (público)
 */
export async function GET(request: Request) {
  try {
    const [metodos, configs] = await Promise.all([
      prisma.metodoPagoManual.findMany({
        where: { estado: true },
        orderBy: [{ orden: 'asc' }, { creado_en: 'asc' }],
        select: {
          id: true,
          nombre: true,
          nombre_banco: true,
          numero_cuenta: true,
          cci: true,
          descripcion: true,
          imagen_url: true,
          orden: true
        }
      }),
      getConfigs()
    ])

    const pagoManualHabilitado = configs.PAGO_MANUAL_ENABLED === 'true'

    return ApiResponse.success(request, {
      habilitado: pagoManualHabilitado,
      metodos: pagoManualHabilitado ? metodos : [],
      whatsapp_numero: configs.PAGO_MANUAL_WHATSAPP_NUMERO || configs.WHATSAPP_NUMERO || '',
      whatsapp_mensaje: configs.PAGO_MANUAL_WHATSAPP_MENSAJE || ''
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
