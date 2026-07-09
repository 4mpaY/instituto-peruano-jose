import { readFile } from 'fs/promises'
import { join } from 'path'

import type { DisenoCertificadoId } from './index'
import type { FirmanteCertificado, SignatarioData } from './types'

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
 * Redimensiona y comprime un buffer de imagen para embebido en PDF.
 * - format 'jpeg': ideal para fotos (avatar, fondos). Reduce drásticamente el peso.
 * - format 'png':  conserva transparencia (logos, firmas).
 */
export async function compressImageForPdf(
  buffer: Buffer,
  opts: { maxWidth: number; format: 'jpeg' | 'png'; quality?: number }
): Promise<{ buffer: Buffer; mimeType: string; jsPdfFormat: string }> {
  try {
    const { default: sharp } = await import('sharp')

    const pipeline = sharp(buffer).resize(opts.maxWidth, undefined, { withoutEnlargement: true, fit: 'inside' })

    if (opts.format === 'jpeg') {
      const out = await pipeline.flatten({ background: '#ffffff' }).jpeg({ quality: opts.quality ?? 75, mozjpeg: false }).toBuffer()

      return { buffer: out, mimeType: 'image/jpeg', jsPdfFormat: 'JPEG' }
    } else {
      const out = await pipeline.png({ compressionLevel: 9 }).toBuffer()

      return { buffer: out, mimeType: 'image/png', jsPdfFormat: 'PNG' }
    }
  } catch {
    return { buffer, mimeType: 'image/png', jsPdfFormat: 'PNG' }
  }
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

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

/** Extrae subtemas del contenido de una lección (HTML, viñetas o texto plano). */
export function extractSubtemasFromContenido(contenido: string | null | undefined): string[] {
  if (!contenido?.trim()) return []

  const liMatches = contenido.match(/<li[^>]*>([\s\S]*?)<\/li>/gi)

  if (liMatches?.length) {
    return liMatches.map(m => stripHtml(m)).filter(Boolean)
  }

  const plain = stripHtml(contenido)
  const rawLines = plain.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  const items = rawLines
    .map(line => line.replace(/^[\s•\-*·–—]+/, '').replace(/^\d+[\.)]\s*/, '').trim())
    .filter(Boolean)

  if (items.length > 1) return items

  if (items.length === 1 && /[;|]/.test(items[0])) {
    return items[0].split(/[;|]/).map(s => s.trim()).filter(Boolean)
  }

  return items
}

const LEGACY_FIRMA_CONFIG_PREFIX = {
  IZQ: 'CERTIFICADO_FIRMA_IZQ',
  DER: 'CERTIFICADO_FIRMA_DER',
} as const

type FirmaLado = keyof typeof LEGACY_FIRMA_CONFIG_PREFIX

function firmaConfigPrefix(diseno: DisenoCertificadoId, lado: FirmaLado): string {
  return `CERTIFICADO_FIRMA_${diseno.toUpperCase()}_${lado}`
}

/** Lee un campo escopado por diseño, cayendo al valor legacy compartido si no fue configurado aún. */
function readFirmaCampo(
  configs: Record<string, string>,
  diseno: DisenoCertificadoId,
  lado: FirmaLado,
  campo: 'NOMBRE' | 'CARGO' | 'INSTITUCION' | 'FIRMA' | 'SELLO'
): string {
  const prefix = firmaConfigPrefix(diseno, lado)
  const legacyPrefix = LEGACY_FIRMA_CONFIG_PREFIX[lado]

  return configs[`${prefix}_${campo}`]?.trim() || configs[`${legacyPrefix}_${campo}`]?.trim() || ''
}

export function parseFirmanteConfig(
  configs: Record<string, string>,
  lado: FirmaLado,
  diseno: DisenoCertificadoId
): FirmanteCertificado | null {
  const nombre = readFirmaCampo(configs, diseno, lado, 'NOMBRE')
  const cargo = readFirmaCampo(configs, diseno, lado, 'CARGO')
  const institucion = readFirmaCampo(configs, diseno, lado, 'INSTITUCION')
  const firmaUrl = readFirmaCampo(configs, diseno, lado, 'FIRMA') || null

  // Always read sello regardless of other fields
  const selloUrl = readFirmaCampo(configs, diseno, lado, 'SELLO') || null

  if (!nombre && !cargo && !institucion && !firmaUrl && !selloUrl) return null

  return { nombre, cargo, institucion, firmaUrl, selloUrl }
}

export function resolveFirmantesCertificado(
  configs: Record<string, string>,
  opts: {
    gerenteGeneral?: SignatarioData | null
    profesorSnapshot?: SignatarioData | null
    mostrarFirmaDocente?: boolean
    nombreInstitucion?: string
    diseno: DisenoCertificadoId
  }
): { izquierdo: FirmanteCertificado; derecho: FirmanteCertificado } {
  const izqConfig = parseFirmanteConfig(configs, 'IZQ', opts.diseno)
  const derConfig = parseFirmanteConfig(configs, 'DER', opts.diseno)
  const defaultInst = opts.nombreInstitucion || ''

  const izquierdo: FirmanteCertificado = izqConfig ?? {
    nombre: opts.gerenteGeneral
      ? `${opts.gerenteGeneral.nombre} ${opts.gerenteGeneral.apellido || ''}`.trim()
      : '',
    cargo: opts.gerenteGeneral?.cargo || 'Gerente General',
    institucion: defaultInst,
    firmaUrl: opts.gerenteGeneral?.firma || null,
    selloUrl: readFirmaCampo(configs, opts.diseno, 'IZQ', 'SELLO') || null,
  }

  const derecho: FirmanteCertificado = derConfig ?? (
    opts.mostrarFirmaDocente !== false && opts.profesorSnapshot
      ? {
          nombre: `${opts.profesorSnapshot.nombre} ${opts.profesorSnapshot.apellido || ''}`.trim(),
          cargo: opts.profesorSnapshot.cargo || 'Director Académico',
          institucion: defaultInst,
          firmaUrl: opts.profesorSnapshot.firma || null,
          selloUrl: readFirmaCampo(configs, opts.diseno, 'DER', 'SELLO') || null,
        }
      : {
          nombre: '',
          cargo: 'Director Académico',
          institucion: defaultInst,
          firmaUrl: null,
          selloUrl: readFirmaCampo(configs, opts.diseno, 'DER', 'SELLO') || null,
        }
  )

  return { izquierdo, derecho }
}

type RgbColor = { r: number; g: number; b: number }

export async function drawFirmanteCertificadoBlock(
  doc: any,
  cx: number,
  lineY: number,
  firmante: FirmanteCertificado,
  opts?: { showLine?: boolean; darkColor?: RgbColor; grayColor?: RgbColor; isRight?: boolean }
) {
  const DARK = opts?.darkColor ?? { r: 30, g: 30, b: 30 }
  const GRAY = opts?.grayColor ?? { r: 100, g: 100, b: 100 }

  const GAP_TO_LINE = 2
  const SELLO_SIZE = 24
  const FIRMA_W = 40
  const FIRMA_H = 22

  if (firmante.selloUrl) {
    try {
      const buf = await fetchImageBuffer(firmante.selloUrl)

      if (buf) {
        const { buffer: comp, jsPdfFormat } = await compressImageForPdf(buf, { maxWidth: 240, format: 'png' })

        doc.addImage(comp, jsPdfFormat, cx - 40, lineY - GAP_TO_LINE - SELLO_SIZE, SELLO_SIZE, SELLO_SIZE)
      }
    } catch { /* skip */ }
  }

  if (firmante.firmaUrl) {
    try {
      const buf = await fetchImageBuffer(firmante.firmaUrl)

      if (buf) {
        const { buffer: comp, jsPdfFormat } = await compressImageForPdf(buf, { maxWidth: 320, format: 'png' })

        doc.addImage(comp, jsPdfFormat, cx - 13, lineY - GAP_TO_LINE - FIRMA_H, FIRMA_W, FIRMA_H)
      }
    } catch { /* skip */ }
  }

  if (opts?.showLine) {
    doc.setDrawColor(DARK.r, DARK.g, DARK.b)
    doc.setLineWidth(0.4)
    doc.line(cx - 40, lineY, cx + 40, lineY)
  }

  let textY = lineY + (opts?.showLine ? 5 : 2)

  if (firmante.nombre) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    doc.text(firmante.nombre, cx, textY, { align: 'center' })
    textY += 6
  }

  if (firmante.cargo) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    doc.text(firmante.cargo, cx, textY, { align: 'center' })
    textY += 5
  }

  if (firmante.institucion) {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
    const instLines = doc.splitTextToSize(firmante.institucion, 82)

    doc.text(instLines, cx, textY, { align: 'center' })
  }
}

export function parseSubtemasField(subtemas: unknown): string[] {
  if (!Array.isArray(subtemas)) return []

  return subtemas
    .filter((s): s is string => typeof s === 'string')
    .map(s => s.trim())
    .filter(Boolean)
}

/** Prioriza el campo dedicado `subtemas`; si está vacío, infiere desde el contenido. */
export function getSubtemasForLeccion(leccion: { subtemas?: unknown; contenido?: string | null }): string[] {
  const fromField = parseSubtemasField(leccion.subtemas)

  if (fromField.length) return fromField

  return extractSubtemasFromContenido(leccion.contenido)
}
