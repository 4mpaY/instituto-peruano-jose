export const dynamic = 'force-dynamic'

import { randomUUID } from 'crypto'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import { normalizeUploadFsError, saveUploadFile } from '@/utils/libs/uploads'

const ALLOWED_IMAGE_MIMES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

/**
 * POST /api/pedidos/[id]/voucher
 * Sube/reemplaza la imagen del comprobante.
 * - Dueño del pedido: solo si está PENDIENTE
 * - Admin: puede reemplazar en cualquier estado
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const pedido = await prisma.pedido.findUnique({
      where: { id: params.id },
      select: { id: true, usuario_id: true, estado: true },
    })

    if (!pedido) {
      return ApiResponse.error(request, 'Pedido no encontrado', 404)
    }

    const esAdmin = auth.user.rol === 'ADMIN'
    const esDueno = pedido.usuario_id === auth.user.id

    if (!esAdmin && !esDueno) {
      return ApiResponse.error(request, 'No tienes permiso para modificar este pedido', 403)
    }

    if (!esAdmin && pedido.estado !== 'PENDIENTE') {
      return ApiResponse.error(request, 'Solo se puede subir comprobante a pedidos pendientes', 400)
    }

    const contentLength = parseInt(request.headers.get('content-length') || '0', 10)

    if (contentLength > MAX_SIZE) {
      return ApiResponse.error(request, 'La imagen supera el tamaño máximo permitido (5MB)', 413)
    }

    const formData = await request.formData()
    const file = formData.get('voucher') as File | null

    if (!file) {
      return ApiResponse.error(request, 'No se proporcionó ninguna imagen', 400)
    }

    if (file.size > MAX_SIZE) {
      return ApiResponse.error(request, 'La imagen supera el tamaño máximo permitido (5MB)', 413)
    }

    if (!ALLOWED_IMAGE_MIMES[file.type]) {
      return ApiResponse.error(request, 'Solo se permiten imágenes JPG, PNG o WEBP', 400)
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = ALLOWED_IMAGE_MIMES[file.type]
    const fileName = `${randomUUID()}.${ext}`

    let relativePath: string

    try {
      const saved = await saveUploadFile({
        folder: 'vouchers',
        fileName,
        buffer,
      })

      relativePath = saved.relativeUrl
    } catch (fsError) {
      const normalized = normalizeUploadFsError(fsError)

      console.error('[voucher upload] FS error:', normalized)

      return ApiResponse.error(request, normalized.message, 500)
    }

    await prisma.pedido.update({
      where: { id: params.id },
      data: {
        comprobante_url: relativePath,
        comprobante_subido_en: new Date(),
      },
    })

    return ApiResponse.success(request, { comprobante_url: relativePath })
  } catch (error) {
    return handleApiError(error, request)
  }
}
