import { readFile } from 'fs/promises'
import { join } from 'path'

/** Convierte un color hex (#RRGGBB) a rgb [r, g, b] */
export function hexToRgb(hex: string): [number, number, number] {
  try {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)

    
return [isNaN(r) ? 30 : r, isNaN(g) ? 120 : g, isNaN(b) ? 70 : b]
  } catch {
    return [30, 120, 70]
  }
}

/** Carga una imagen (local /public o remota) y devuelve Buffer */
export async function fetchImageBuffer(url: string | null): Promise<Buffer | null> {
  try {
    if (!url) return null

    if (url.startsWith('/')) {
      const filePath = join(process.cwd(), 'public', url.replace(/\/+/g, '/'))

      
return await readFile(filePath)
    }

    const response = await fetch(url)

    if (!response.ok) return null
    
return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

/** Formatea una fecha a formato largo en español peruano */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return '---'
  
return new Date(date).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Formatea una fecha a formato corto dd/mm/yyyy */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '---'
  
return new Date(date).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
}

/**
 * Resuelve las dimensiones del logo respetando aspect ratio con Sharp.
 * Devuelve { w, h } en mm.
 */
export async function resolveLogoDimensions(
  logoBuffer: Buffer | null,
  maxW: number,
  maxH: number
): Promise<{ w: number; h: number }> {
  if (!logoBuffer) return { w: maxH, h: maxH }

  try {
    const { default: sharp } = await import('sharp')
    const meta = await sharp(logoBuffer).metadata()

    if (meta.width && meta.height) {
      const ratio = meta.width / meta.height
      let h = maxH
      const w = Math.min(h * ratio, maxW)

      if (w === maxW) h = maxW / ratio
      
return { w, h }
    }
  } catch { /* default */ }

  
return { w: maxH, h: maxH }
}
