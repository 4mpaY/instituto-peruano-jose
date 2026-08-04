import { readFile } from 'fs/promises'

import { NextResponse } from 'next/server'

import { resolveUploadPath } from '@/utils/libs/uploads'

/**
 * Mapeo de extensiones a Content-Type para servir archivos correctamente
 */
const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

/**
 * GET /uploads/*
 * Sirve archivos subidos desde disco (necesario en standalone/Docker;
 * los archivos nuevos no siempre los sirve el static de Next).
 */
export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  try {
    const pathSegments = params.path || []

    if (pathSegments.length === 0) {
      return new NextResponse('No encontrado', { status: 404 })
    }

    // Bloquear segmentos peligrosos
    if (pathSegments.some(s => s === '..' || s.includes('\\') || s === '')) {
      return new NextResponse('Ruta inválida', { status: 400 })
    }

    const filePath = resolveUploadPath(...pathSegments)
    const ext = pathSegments[pathSegments.length - 1]?.split('.').pop()?.toLowerCase() || ''
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

    try {
      const fileBuffer = await readFile(filePath)

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return new NextResponse('Archivo no encontrado', { status: 404 })
      }

      throw error
    }
  } catch (error) {
    console.error('Error serving upload:', error)

    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}
