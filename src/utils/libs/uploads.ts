import { join, resolve } from 'path'
import { mkdir, writeFile } from 'fs/promises'

/**
 * Raíz de uploads en disco (persistida vía volumen en Docker/Coolify).
 */
export function getUploadsRoot() {
  return join(process.cwd(), 'public', 'uploads')
}

/**
 * Asegura que exista un subdirectorio dentro de public/uploads.
 */
export async function ensureUploadDir(...segments: string[]) {
  const dir = join(getUploadsRoot(), ...segments)

  await mkdir(dir, { recursive: true })

  return dir
}

/**
 * Resuelve una ruta de archivo bajo uploads de forma segura (anti path-traversal).
 */
export function resolveUploadPath(...segments: string[]) {
  const root = resolve(getUploadsRoot())
  const target = resolve(join(root, ...segments))

  if (!target.startsWith(root)) {
    throw new Error('Ruta de upload inválida')
  }

  return target
}

/**
 * Guarda un buffer en public/uploads/<folder>/<fileName> y devuelve la URL pública.
 */
export async function saveUploadFile(opts: {
  folder: string
  fileName: string
  buffer: Buffer
}): Promise<{ absolutePath: string; relativeUrl: string }> {
  const folder = opts.folder.replace(/[^a-zA-Z0-9_-]/g, '')
  const fileName = opts.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')

  const dir = await ensureUploadDir(folder)
  const absolutePath = join(dir, fileName)
  const relativeUrl = `/uploads/${folder}/${fileName}`

  await writeFile(absolutePath, opts.buffer)

  return { absolutePath, relativeUrl }
}

export function normalizeUploadFsError(error: unknown): { code?: string; path?: string; message: string } {
  const err = error as { code?: string; path?: string; message?: string }

  if (err?.code === 'EACCES') {
    return {
      code: err.code,
      path: err.path,
      message:
        `Error de permisos en el servidor (EACCES). No se pudo escribir en ${err.path || 'public/uploads'}. ` +
        'Asegúrese de montar un volumen en /app/public/uploads y que el entrypoint asigne permisos al usuario nextjs.',
    }
  }

  return {
    code: err?.code,
    path: err?.path,
    message: err?.message || 'Error al guardar el archivo',
  }
}
