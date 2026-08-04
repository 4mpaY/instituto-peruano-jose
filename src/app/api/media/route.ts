export const dynamic = 'force-dynamic'

import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import { requireAuth } from '@/utils/libs/auth-helpers'

/** Tipos MIME permitidos y su extensión segura */
const ALLOWED_MIMES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/webm': 'webm',

  // Documentos de Office
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
}

/** Tamaño máximo: 50 MB */
const MAX_FILE_SIZE = 50 * 1024 * 1024

/**
 * Verifica los magic bytes del archivo para confirmar que el tipo MIME
 * corresponde con el contenido real (no confiar solo en el header del cliente).
 */
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xff, 0xd8, 0xff]],
    'image/png': [[0x89, 0x50, 0x4e, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'video/mp4': [
      [0x00, 0x00, 0x00],
      [0x66, 0x74, 0x79, 0x70]
    ],
    'video/webm': [[0x1a, 0x45, 0xdf, 0xa3]],

    // Office antiguo (OLE2 / CFBF)
    'application/msword': [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
    'application/vnd.ms-excel': [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],

    // Office moderno (OpenXML / ZIP based)
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4b, 0x03, 0x04]], // PK..
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4b, 0x03, 0x04]] // PK..
  }

  const mimeSignatures = signatures[mimeType]

  if (!mimeSignatures) return false
  if (mimeType.startsWith('video/')) return true // Los containers de video son complejos, confiamos en extensión+mime

  return mimeSignatures.some(sig => sig.every((byte, i) => buffer[i] === byte))
}

/**
 * GET /api/media
 * Listar todos los archivos subidos (requiere autenticación)
 */
export async function GET(request: Request) {
  try {
    // 🔐 SEGURIDAD: Requiere autenticación
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const media = await prisma.media.findMany({
      orderBy: { creado_en: 'desc' }
    })

    return ApiResponse.success(request, media)
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * POST /api/media
 * Subir un nuevo archivo (requiere autenticación + validación estricta de tipo)
 */
export async function POST(request: Request) {
  try {
    // 🔐 SEGURIDAD: Requiere autenticación
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    // 🔐 SEGURIDAD: Verificar tamaño antes de leer el body completo
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10)

    if (contentLength > MAX_FILE_SIZE) {
      return ApiResponse.error(
        request,
        `El archivo supera el tamaño máximo permitido (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        413
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return ApiResponse.error(request, 'No se proporcionó ningún archivo', 400)
    }

    // 🔐 SEGURIDAD: Verificar tamaño real del archivo
    if (file.size > MAX_FILE_SIZE) {
      return ApiResponse.error(
        request,
        `El archivo supera el tamaño máximo permitido (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        413
      )
    }

    // 🔐 SEGURIDAD: Validar MIME type contra lista blanca
    if (!ALLOWED_MIMES[file.type]) {
      return ApiResponse.error(
        request,
        `Tipo de archivo no permitido. Tipos aceptados: imágenes (jpg, png, webp, gif), PDF, video (mp4, webm)`,
        400
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 🔐 SEGURIDAD: Verificar magic bytes (contenido real del archivo)
    if (!verifyMagicBytes(buffer, file.type)) {
      return ApiResponse.error(request, 'El contenido del archivo no coincide con su tipo declarado', 400)
    }

    const { searchParams } = new URL(request.url)
    const isSignature = searchParams.get('isSignature') === 'true'

    // 🔐 SEGURIDAD: Extensión determinada por MIME type (no por nombre del usuario)
    const safeExtension = ALLOWED_MIMES[file.type]
    const id = randomUUID()
    const nombreArchivo = `${id}.${safeExtension}`
    const nombreOriginal = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') // Sanitizar nombre original

    // Ruta relativa para la URL y ruta absoluta para guardar
    const folder = isSignature ? 'firmas' : 'cursos'
    const relativePath = `/uploads/${folder}/${nombreArchivo}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder)
    const absolutePath = join(uploadDir, nombreArchivo)

    try {
      // Asegurar que el directorio existe
      await mkdir(uploadDir, { recursive: true })

      // Escribir el archivo
      await writeFile(absolutePath, buffer)
    } catch (fsError: any) {
      console.error('❌ Error de sistema de archivos en subida:', {
        code: fsError.code,
        path: fsError.path,
        absolutePath: absolutePath
      })

      if (fsError.code === 'EACCES') {
        return ApiResponse.error(
          request,
          `Error de permisos en el servidor (EACCES). No se pudo crear/escribir en ${fsError.path}. Monte un volumen persistente en /app/public/uploads (compose/Coolify) y redespliegue; el entrypoint asigna permisos al usuario nextjs.`,
          500
        )
      }

      throw fsError // Re-lanzar otros errores para ser capturados por el catch general
    }

    // Si es firma, no guardamos en la tabla Media para que no aparezca en la galería general
    if (isSignature) {
      return ApiResponse.success(request, { url: relativePath }, 201)
    }

    const tipo = file.type.startsWith('image/') ? 'IMAGEN' : file.type.startsWith('video/') ? 'VIDEO' : 'OTRO'

    const mediaResult = await prisma.media.create({
      data: {
        id,
        nombre: nombreOriginal,
        url: relativePath,
        tipo,
        mimetype: file.type,
        peso: file.size
      }
    })

    return ApiResponse.success(request, mediaResult, 201)
  } catch (error) {
    return handleApiError(error, request)
  }
}
