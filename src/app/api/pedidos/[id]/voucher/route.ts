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
  'application/pdf': 'pdf',
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

    if (contentLength > MAX_SIZE * 5) {
      return ApiResponse.error(request, 'El tamaño total supera el máximo permitido (25MB)', 413)
    }

    const formData = await request.formData()
    const files = formData.getAll('voucher') as File[]
    const existingUrls = formData.get('existing_urls') as string | null

    const existingCount = existingUrls ? existingUrls.split(',').filter(Boolean).length : 0

    if ((!files || files.length === 0) && existingCount === 0) {
      return ApiResponse.error(request, 'No se proporcionó ningún archivo', 400)
    }

    if (files.length + existingCount > 5) {
      return ApiResponse.error(request, 'Solo se permiten hasta 5 comprobantes', 400)
    }

    const savedUrls: string[] = []

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return ApiResponse.error(request, `El archivo ${file.name} supera el tamaño máximo (5MB)`, 413)
      }

      if (!ALLOWED_IMAGE_MIMES[file.type]) {
        return ApiResponse.error(request, `Formato no permitido en ${file.name}. Usa JPG, PNG, WEBP o PDF`, 400)
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const ext = ALLOWED_IMAGE_MIMES[file.type]
      const fileName = `${randomUUID()}.${ext}`

      try {
        const saved = await saveUploadFile({
          folder: 'vouchers',
          fileName,
          buffer,
        })

        savedUrls.push(saved.relativeUrl)
      } catch (fsError) {
        const normalized = normalizeUploadFsError(fsError)

        console.error('[voucher upload] FS error:', normalized)
        
return ApiResponse.error(request, normalized.message, 500)
      }
    }

    const finalUrl = [existingUrls, ...savedUrls].filter(Boolean).join(',')

    await prisma.pedido.update({
      where: { id: params.id },
      data: {
        comprobante_url: finalUrl,
        comprobante_subido_en: new Date(),
      },
    })

    return ApiResponse.success(request, { comprobante_url: finalUrl })
  } catch (error) {
    return handleApiError(error, request)
  }
}
