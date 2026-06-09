import { fetchImageBuffer, compressImageForPdf, resolveLogoDimensions, formatDateLong } from './utils'
import type { GeneratorFn, ModuloData } from './types'

function extractBullets(html: string | null | undefined): string[] {
  if (!html) return []
  const matches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi)
  if (!matches) return []
  return matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean)
}

/**
 * Plantilla MINIMALISTA — Dos páginas:
 * - Página 1: Certificado formal con logos, nombre, curso y firmas.
 * - Página 2: Temario del programa en dos columnas con logos al pie.
 */
export const generarMinimalista: GeneratorFn = async data => {
  const {
    pr, pg, pb,
    base64Logo, logoUrl, logoBuffer,
    nombreInstitucion,
    nombreCompleto,
    cursoTitulo, cursoDuracion,
    fechaEmisionVal, fechaInicioVal, fechaFinVal,
    gerenteGeneral, profesorSnapshot,
    codigoVerificacion,
    qrDataUrl,
    modulos,
    notasPorModulo, notaInscripcion,
  } = data

  const DARK  = { r: 30,  g: 30,  b: 30  }
  const GRAY  = { r: 100, g: 100, b: 100 }
  const LGRAY = { r: 220, g: 220, b: 220 }

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  const W = doc.internal.pageSize.getWidth()   // 297
  const H = doc.internal.pageSize.getHeight()  // 210

  const margin      = 14
  const BAR_H       = 3.5
  const footerH     = 32
  const bottomLimit = H - BAR_H - footerH

  // ── Logos adicionales (public/logos/) ────────────────────────────────
  const [logo1Buf, logo2Buf, logo3Buf, logo4Buf] = await Promise.all([
    fetchImageBuffer('/logos/logo1.png'),
    fetchImageBuffer('/logos/logo2.png'),
    fetchImageBuffer('/logos/logo3.png'),
    fetchImageBuffer('/logos/logo4.png'),
  ])
  const [logo1Comp, logo2Comp, logo3Comp, logo4Comp] = await Promise.all([
    logo1Buf ? compressImageForPdf(logo1Buf, { maxWidth: 300, format: 'png' }) : null,
    logo2Buf ? compressImageForPdf(logo2Buf, { maxWidth: 300, format: 'png' }) : null,
    logo3Buf ? compressImageForPdf(logo3Buf, { maxWidth: 300, format: 'png' }) : null,
    logo4Buf ? compressImageForPdf(logo4Buf, { maxWidth: 300, format: 'png' }) : null,
  ])

  // ── Nota final ───────────────────────────────────────────────────────
  const promedios = Object.values(notasPorModulo).map(e => {
    const raw = e.puntaje / e.count
    return raw > 20 ? raw / 5 : raw
  })
  const notaFinalCalc =
    promedios.length > 0
      ? promedios.reduce((a, b) => a + b, 0) / promedios.length
      : (() => {
          const raw = notaInscripcion ?? null
          return raw !== null ? (raw > 20 ? raw / 5 : raw) : null
        })()

  const fechaFirmadaTxt = new Date(fechaEmisionVal).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })

  // ── Helper: fondo + barras ───────────────────────────────────────────
  const setupPage = () => {
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, W, H, 'F')
    doc.setFillColor(pr, pg, pb)
    doc.rect(0, 0, W, BAR_H, 'F')
    doc.setFillColor(pr, pg, pb)
    doc.rect(0, H - BAR_H, W, BAR_H, 'F')
  }

  // ── Helper: firma (siempre dibuja línea + label aunque user sea null) ──
  const drawSignatureBlock = async (cx: number, lineY: number, user: typeof gerenteGeneral, label: string) => {
    if (user?.firma) {
      try {
        const buf = await fetchImageBuffer(user.firma)
        if (buf) {
          const { buffer: comp, jsPdfFormat } = await compressImageForPdf(buf, { maxWidth: 300, format: 'png' })
          doc.addImage(comp, jsPdfFormat, cx - 18, lineY - 22, 36, 20)
        }
      } catch { /* skip */ }
    }
    doc.setDrawColor(DARK.r, DARK.g, DARK.b)
    doc.setLineWidth(0.4)
    doc.line(cx - 40, lineY, cx + 40, lineY)
    if (user) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(DARK.r, DARK.g, DARK.b)
      doc.text(`${user.nombre || ''} ${user.apellido || ''}`.trim(), cx, lineY + 5, { align: 'center' })
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
      doc.text(label, cx, lineY + 11, { align: 'center' })
      const instLines = doc.splitTextToSize(nombreInstitucion, 82)
      doc.text(instLines, cx, lineY + 16, { align: 'center' })
    } else {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
      doc.text(label, cx, lineY + 6, { align: 'center' })
      const instLines = doc.splitTextToSize(nombreInstitucion, 82)
      doc.text(instLines, cx, lineY + 11, { align: 'center' })
    }
  }

  // ── Helper: footer de logos (página 2) ──────────────────────────────
  // Fila 1: logo principal centrado solo.
  // Fila 2: logo1 + logo2 + logo3 centrados (sin logo4).
  const drawFooter = async () => {
    const row1H   = 11
    const row2H   = 9
    const rowGap  = 3
    const textH   = 5
    // Calcular posición Y de abajo hacia arriba
    const textY  = H - BAR_H - 2
    const row2Y  = textY - textH - rowGap - row2H
    const row1Y  = row2Y - rowGap - row1H

    // Fila 1: logo principal centrado
    if (logoBuffer && base64Logo) {
      const dims = await resolveLogoDimensions(logoBuffer, 60, row1H)
      const lx = (W - dims.w) / 2
      try {
        const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'
        doc.addImage(base64Logo, ext, lx, row1Y + (row1H - dims.h) / 2, dims.w, dims.h, 'MFOOT_MAIN')
      } catch { /* skip */ }
    }

    // Fila 2: logo1 + logo2 + logo3 centrados
    type LogoEntry = { buf: Buffer; comp: { buffer: Buffer; jsPdfFormat: string } }
    const row2Entries: LogoEntry[] = []
    if (logo1Buf && logo1Comp) row2Entries.push({ buf: logo1Buf, comp: logo1Comp })
    if (logo2Buf && logo2Comp) row2Entries.push({ buf: logo2Buf, comp: logo2Comp })
    if (logo3Buf && logo3Comp) row2Entries.push({ buf: logo3Buf, comp: logo3Comp })

    if (row2Entries.length > 0) {
      const logoGap = 10
      const dims2 = await Promise.all(row2Entries.map(({ buf }) => resolveLogoDimensions(buf, 44, row2H)))
      const totalW = dims2.reduce((s, d) => s + d.w, 0) + logoGap * (row2Entries.length - 1)
      let lx = (W - totalW) / 2
      for (let i = 0; i < row2Entries.length; i++) {
        const { comp } = row2Entries[i]
        const { w, h } = dims2[i]
        try {
          doc.addImage(comp.buffer, comp.jsPdfFormat, lx, row2Y + (row2H - h) / 2, w, h, `MFOOT_R2_${i}`)
        } catch { /* skip */ }
        lx += w + logoGap
      }
    }

    // Fecha y código de verificación
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
    doc.text(`Fecha de Emisión: ${fechaFirmadaTxt}`, W - margin, textY, { align: 'right' })
    doc.text(`Cód. verificación: ${codigoVerificacion}`, margin, textY)
  }

  // ── QR en negro (convierte el QR de color a negro puro) ─────────────
  // threshold(200): píxeles con gris < 200 → negro; > 200 → blanco
  // El verde #36B658 tiene gris ≈133 → negro ✓; fondo blanco 255 → blanco ✓
  const blackQrBuf = await (async () => {
    try {
      const { default: sharp } = await import('sharp')
      const base64 = qrDataUrl.split(',')[1]
      const buf = Buffer.from(base64, 'base64')
      return await sharp(buf)
        .flatten({ background: '#ffffff' })
        .greyscale()
        .threshold(200)
        .png()
        .toBuffer()
    } catch {
      return Buffer.from(qrDataUrl.split(',')[1], 'base64')
    }
  })()

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 1 — Certificado formal
  // ══════════════════════════════════════════════════════════════════════
  setupPage()

  const cx      = W / 2
  const qrSize  = 28
  const qrX     = W - margin - qrSize
  const qrY     = BAR_H + 5
  const logoMaxH = 18
  const logoMaxW = 55
  const logoGap  = 10

  // ── Logos centrados horizontalmente, alineados al centro vertical del QR ──
  const mainDims  = await resolveLogoDimensions(logoBuffer, logoMaxW, logoMaxH)
  const logo4Dims = logo4Buf ? await resolveLogoDimensions(logo4Buf, logoMaxW, logoMaxH) : null

  const totalLogosW = mainDims.w + (logo4Dims ? logoGap + logo4Dims.w : 0)
  const logosStartX = (W - totalLogosW) / 2
  const qrCenterY    = qrY + qrSize / 2   // centro vertical del QR

  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'
      doc.addImage(base64Logo, ext, logosStartX, qrCenterY - mainDims.h / 2, mainDims.w, mainDims.h, 'LOGO_P1')
    } catch { /* skip */ }
  }
  if (logo4Buf && logo4Comp && logo4Dims) {
    try {
      const lx = logosStartX + mainDims.w + logoGap
      doc.addImage(logo4Comp.buffer, logo4Comp.jsPdfFormat, lx, qrCenterY - logo4Dims.h / 2, logo4Dims.w, logo4Dims.h, 'LOGO4_P1')
    } catch { /* skip */ }
  }

  // ── QR esquina superior derecha — negro, sin borde ───────────────────
  doc.addImage(blackQrBuf, 'PNG', qrX, qrY, qrSize, qrSize)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('Verifica su',  qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' })
  doc.text('autenticidad', qrX + qrSize / 2, qrY + qrSize + 8, { align: 'center' })

  // ── Cuerpo central — distribución proporcional ───────────────────────
  // contentTop comienza después del QR (el elemento más alto del header)
  const contentTop    = qrY + qrSize + 12          // ~49mm — CERTIFICADO va más abajo
  const sigLineY      = H - BAR_H - 32             // ~174mm
  const contentBottom = sigLineY - 22              // deja ~22mm libres antes de las firmas

  // Pre-calcular alturas variables (con fuentes actualizadas)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  const cursoLines = doc.splitTextToSize(cursoTitulo, W - margin * 2 - 60)
  const cursoH = cursoLines.length * 8

  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  const nombreLines = doc.splitTextToSize(nombreCompleto, W - margin * 2 - 40)
  const NAME_H = nombreLines.length * 10

  const fechaInicioTxt = formatDateLong(fechaInicioVal)
  const fechaFinTxt    = formatDateLong(fechaFinVal)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const descFull  = `Emitido por el ${nombreInstitucion}, con una duración de ${cursoDuracion || '---'}, realizado desde el ${fechaInicioTxt} hasta el ${fechaFinTxt}.`
  const descLines = doc.splitTextToSize(descFull, W - margin * 2 - 40)
  const descH = descLines.length * 5.5

  const porcuanto      = 'Por cuanto: Para que conste y sea reconocido, se otorga el presente certificado en calidad de:'
  const porcuantoLines = doc.splitTextToSize(porcuanto, W - margin * 2 - 40)
  const porcuantoH = porcuantoLines.length * 5.5

  // Alturas fijas de cada bloque
  const CERT_H  = 10   // avance real tras "CERTIFICADO" (34pt, cap≈8.5mm, sin gap extra)
  const OTO_H   = 5    // "Otorgado a:"
  const PORH_H  = 5    // "Por haber concluido..."
  const APR_H   = 5    // "APROBADO"
  const FIRM_H  = 5    // "Firmado, el..."
  // Factores: nombre→PORH=0.8, curso→desc=1.0, desc→porcuanto=0.3, porcuanto→APROBADO=1.5 → total=3.6
  const fixedContent = CERT_H + OTO_H + 7 + NAME_H + PORH_H + 7 + cursoH + descH + porcuantoH + APR_H + FIRM_H
  const totalGapH    = (contentBottom - contentTop) - fixedContent
  const gap          = Math.min(4, Math.max(2, totalGapH / 3.6))

  let y = contentTop

  // "CERTIFICADO"
  doc.setFontSize(34)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.text('CERTIFICADO', cx, y, { align: 'center' })
  y += CERT_H

  // "Otorgado a:"
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('Otorgado a:', cx, y, { align: 'center' })
  y += OTO_H + 7

  // Nombre del estudiante (fuente más grande)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(nombreLines, cx, y, { align: 'center' })
  y += NAME_H + gap * 0.8

  // "Por haber concluido..."
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.text('Por haber concluido y aprobado con éxito el curso de especialización de:', cx, y, { align: 'center' })
  y += PORH_H + 7

  // Nombre del curso (fuente más grande, permite 2+ líneas)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.text(cursoLines, cx, y, { align: 'center' })
  y += cursoH + gap

  // Descripción institucional
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text(descLines, cx, y, { align: 'center' })
  y += descH + gap * 0.3

  // "Por cuanto..."
  doc.text(porcuantoLines, cx, y, { align: 'center' })
  y += porcuantoH + gap * 1.5

  // "APROBADO"
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('APROBADO', cx, y, { align: 'center' })
  y += APR_H + 1

  // "Firmado, el..."
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text(`Firmado, el ${fechaFirmadaTxt}.`, cx, y, { align: 'center' })

  // ── Firmas: admin izquierda, docente derecha (siempre ambas) ─────────
  await drawSignatureBlock(cx - 62, sigLineY, gerenteGeneral,  'Gerente General')
  await drawSignatureBlock(cx + 62, sigLineY, profesorSnapshot, 'Director Académico')

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 2 — Temario del programa
  // ══════════════════════════════════════════════════════════════════════
  doc.addPage()
  setupPage()

  // QR — esquina superior derecha
  const qr2Size = 28
  const qr2X    = W - margin - qr2Size
  const qr2Y    = BAR_H + 5
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(qr2X - 2, qr2Y - 2, qr2Size + 4, qr2Size + 4, 1.5, 1.5, 'F')
  doc.addImage(blackQrBuf, 'PNG', qr2X, qr2Y, qr2Size, qr2Size)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('Verifica su',   qr2X + qr2Size / 2, qr2Y + qr2Size + 4, { align: 'center' })
  doc.text('autenticidad',  qr2X + qr2Size / 2, qr2Y + qr2Size + 8, { align: 'center' })

  // "CERTIFICADO" — título superior izquierda
  const titleY = BAR_H + 10
  doc.setFontSize(22)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(pr, pg, pb)
  doc.text('CERTIFICADO', margin, titleY)

  // Bloque de datos del curso
  let infoY = titleY + 7
  const infoBlockW = W - margin * 2 - qr2Size - 14

  const infoRows: Array<{ label: string; value: string }> = [
    { label: 'Curso de especialización:', value: cursoTitulo },
    { label: 'Duración:',                 value: cursoDuracion || '---' },
    { label: 'Promedio Final:',           value: notaFinalCalc !== null ? notaFinalCalc.toFixed(2) : '---' },
    { label: 'Estudiante:',               value: nombreCompleto },
    {
      label: 'Docente:',
      value: profesorSnapshot
        ? `${profesorSnapshot.nombre} ${profesorSnapshot.apellido || ''}`.trim()
        : '---',
    },
  ]

  doc.setFontSize(8.5)
  for (const { label, value } of infoRows) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    const lw = doc.getTextWidth(label)
    doc.text(label, margin, infoY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
    const vLines = doc.splitTextToSize(value, infoBlockW - lw - 2)
    doc.text(vLines, margin + lw + 2, infoY)
    infoY += vLines.length * 5 + 1
  }

  // Separador horizontal
  const sepY = Math.max(infoY, qr2Y + qr2Size + 10) + 4
  doc.setDrawColor(LGRAY.r, LGRAY.g, LGRAY.b)
  doc.setLineWidth(0.3)
  doc.line(margin, sepY - 2, W - margin, sepY - 2)

  // ── Temario en dos columnas ───────────────────────────────────────────
  const allLecciones = (modulos as ModuloData[])
    .sort((a, b) => a.orden - b.orden)
    .flatMap(m => m.lecciones.sort((a, b) => a.orden - b.orden))

  const colW      = (W - margin * 2 - 10) / 2
  const colLeft   = margin
  const colRight  = margin + colW + 10

  const globalIndex = new Map<string, number>()
  allLecciones.forEach((l, i) => globalIndex.set(l.id, i + 1))

  const half      = Math.ceil(allLecciones.length / 2)
  const leftLecs  = allLecciones.slice(0, half)
  const rightLecs = allLecciones.slice(half)

  const renderLecciones = (list: typeof allLecciones, startX: number, startY: number): void => {
    let cy = startY
    for (const lec of list) {
      const bullets  = extractBullets(lec.contenido)
      const num      = globalIndex.get(lec.id) ?? 0
      const numLabel = `LECCIÓN ${String(num).padStart(2, '0')}:`

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(pr, pg, pb)
      doc.text(numLabel, startX, cy)
      cy += 4.5

      const titleLines = doc.splitTextToSize(lec.titulo.toUpperCase(), colW - 6)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(DARK.r, DARK.g, DARK.b)
      doc.text(titleLines, startX, cy)
      cy += titleLines.length * 4 + 1

      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
      for (const bullet of bullets) {
        const bLines = doc.splitTextToSize(`• ${bullet}`, colW - 6)
        if (cy + bLines.length * 3.8 > bottomLimit) break
        doc.text(bLines, startX, cy)
        cy += bLines.length * 3.8
      }
      cy += 4
      if (cy > bottomLimit) break
    }
  }

  renderLecciones(leftLecs,  colLeft,  sepY + 5)
  renderLecciones(rightLecs, colRight, sepY + 5)

  await drawFooter()

  return doc.output('arraybuffer')
}
