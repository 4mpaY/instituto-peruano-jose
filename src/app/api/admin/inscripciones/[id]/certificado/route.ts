export const dynamic = 'force-dynamic'

import { requireAdmin } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import { setInscripcionCertificadoHabilitacion } from '@/app/api/_shared/certificados/getInscripcionCertificadoHabilitacion'

type TipoCertificadoPago = 'ipg' | 'cid'

/**
 * PATCH /api/admin/inscripciones/[id]/certificado
 * Habilita o deshabilita la descarga del certificado IPG o CID de una inscripción.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const body = await request.json()
    const { habilitado, tipo } = body as { habilitado?: boolean; tipo?: TipoCertificadoPago }

    if (typeof habilitado !== 'boolean') {
      return ApiResponse.error(request, 'El campo habilitado debe ser un booleano', 400)
    }

    const tipoCert: TipoCertificadoPago = tipo === 'cid' ? 'cid' : 'ipg'

    const actualizada = await setInscripcionCertificadoHabilitacion(params.id, tipoCert, habilitado)

    if (!actualizada) {
      return ApiResponse.error(request, 'Inscripción no encontrada', 404)
    }

    return ApiResponse.success(request, { inscripcion: actualizada })
  } catch (error) {
    return handleApiError(error, request)
  }
}
