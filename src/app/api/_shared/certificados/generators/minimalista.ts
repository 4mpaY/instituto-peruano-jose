import { readFile } from 'fs/promises'
import { join } from 'path'

import { fetchImageBuffer, compressImageForPdf, resolveLogoDimensions, formatDateLong, getSubtemasForLeccion, drawFirmanteCertificadoBlock } from './utils'
import type { GeneratorFn, ModuloData } from './types'

async function loadFontBase64(relativePath: string): Promise<string | null> {
  try {
    const buf = await readFile(join(process.cwd(), 'public', relativePath))

    
return buf.toString('base64')
  } catch {
    return null
  }
}

/**
 * Plantilla MINIMALISTA — Dos páginas:
 * - Página 1: Certificado formal con logos, nombre, curso y tabla de firmas.
 * - Página 2: Temario del programa en dos columnas.
 * Fuente: Poppins (ExtraLight / Regular / SemiBold / Bold).
 */
export const generarMinimalista: GeneratorFn = async data => {
  const {
    base64Logo, logoUrl, logoBuffer,
    nombreCompleto,
    cursoTitulo, cursoDuracion,
    fechaEmisionVal, fechaInicioVal, fechaFinVal,
    profesorSnapshot,
    firmanteIzquierdo, firmanteDerecho,
    qrDataUrl,
    codigoVerificacion,
    modulos,
    notasPorModulo, notaInscripcion,
  } = data

  const DARK  = { r: 30,  g: 30,  b: 30  }
  const GRAY  = { r: 100, g: 100, b: 100 }
  const LGRAY = { r: 220, g: 220, b: 220 }
  const GREEN = { r: 54,  g: 182, b: 88  }
  const TEAL  = { r: 19,  g: 153, b: 113 }

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  const W = doc.internal.pageSize.getWidth()   // 297
  const H = doc.internal.pageSize.getHeight()  // 210

  const margin      = 14   // margen página 1
  const BAR_H       = 3.5
  const footerH     = 36   // altura reservada para footer en página 2 (row1+gap+row2+gap+text+5mm)
  const bottomLimit = H - BAR_H - footerH  // límite inferior del temario

  // ── Poppins font registration ────────────────────────────────────────
  let hasPoppins = false

  const fontDefs = [
    { file: 'fonts/poppins/Poppins-ExtraLight.ttf', style: 'extralight' },
    { file: 'fonts/poppins/Poppins-Regular.ttf',    style: 'normal'     },
    { file: 'fonts/poppins/Poppins-SemiBold.ttf',   style: 'semibold'   },
    { file: 'fonts/poppins/Poppins-Bold.ttf',        style: 'bold'       },
  ]

  try {
    const bases = await Promise.all(fontDefs.map(f => loadFontBase64(f.file)))

    if (bases.every(b => b !== null)) {
      for (let i = 0; i < fontDefs.length; i++) {
        const fname = fontDefs[i].file.split('/').pop()!

        doc.addFileToVFS(fname, bases[i]!)
        doc.addFont(fname, 'Poppins', fontDefs[i].style)
      }

      hasPoppins = true
    }
  } catch { /* fallback to helvetica */ }

  const F          = hasPoppins ? 'Poppins' : 'helvetica'
  const setEL      = () => doc.setFont(F, hasPoppins ? 'extralight' : 'normal')
  const setNormal  = () => doc.setFont(F, 'normal')
  const setSB      = () => doc.setFont(F, hasPoppins ? 'semibold' : 'bold')
  const setBold    = () => doc.setFont(F, 'bold')

  // ── Mixed inline text renderer ───────────────────────────────────────
  // Renders array of {text, bold?, semibold?} centered at `cx`, wrapping
  // at maxW. Returns total height consumed.
  type Seg = { text: string; bold?: boolean; semibold?: boolean }

  const renderMixed = (segs: Seg[], cx: number, y: number, maxW: number, lh: number): number => {
    type Tok = { word: string; style: 'normal' | 'semibold' | 'bold' }
    const tokens: Tok[] = []

    for (const seg of segs) {
      const style: Tok['style'] = seg.bold ? 'bold' : seg.semibold ? 'semibold' : 'normal'

      for (const p of seg.text.split(/(\s+)/)) if (p) tokens.push({ word: p, style })
    }

    const wOf = (word: string, style: Tok['style']) => {
      if (style === 'bold') setBold()
      else if (style === 'semibold') setSB()
      else setNormal()
      
return doc.getTextWidth(word)
    }

    const lines: Tok[][] = []
    let cur: Tok[] = []; let curW = 0

    for (const tok of tokens) {
      const isSpace = /^\s+$/.test(tok.word)

      if (isSpace && cur.length === 0) continue
      const w = wOf(tok.word, tok.style)

      if (!isSpace && curW + w > maxW && cur.length > 0) {
        while (cur.length && /^\s+$/.test(cur[cur.length - 1].word)) cur.pop()
        lines.push(cur); cur = [tok]; curW = w
      } else { cur.push(tok); curW += w }
    }

    if (cur.length) {
      while (cur.length && /^\s+$/.test(cur[cur.length - 1].word)) cur.pop()
      lines.push(cur)
    }

    let cy = y

    for (const line of lines) {
      let lw = 0

      for (const t of line) lw += wOf(t.word, t.style)
      let x = cx - lw / 2

      for (const t of line) {
        if (t.style === 'bold') setBold()
        else if (t.style === 'semibold') setSB()
        else setNormal()
        doc.text(t.word, x, cy)
        x += wOf(t.word, t.style)
      }

      cy += lh
    }

    
return lines.length * lh
  }

  // ── Logos adicionales ────────────────────────────────────────────────
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
    doc.setFillColor(GREEN.r, GREEN.g, GREEN.b)
    doc.rect(0, 0, W, BAR_H, 'F')
    doc.setFillColor(GREEN.r, GREEN.g, GREEN.b)
    doc.rect(0, H - BAR_H, W, BAR_H, 'F')
  }

  // ── Helper: footer logos (página 2) ─────────────────────────────────
  // Fila 1 (centro): logo principal
  // Fila 2 (centro): logo1 + logo2 + logo3
  // Pie derecho: "Fecha de Emisión: <fecha>"
  const drawFooter = async () => {
    const row1H  = 11
    const row2H  = 9
    const rowGap = 3
    const textY  = H - BAR_H - 5
    const row2Y  = textY - row2H - rowGap
    const row1Y  = row2Y - row1H - rowGap

    // Fila 1: logo principal centrado
    if (logoBuffer && base64Logo) {
      const dims = await resolveLogoDimensions(logoBuffer, 60, row1H)

      try {
        const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

        doc.addImage(base64Logo, ext, (W - dims.w) / 2, row1Y + (row1H - dims.h) / 2, dims.w, dims.h, 'MFOOT_MAIN')
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

    // "Fecha de Emisión:" SemiBold + valor Regular, alineados a la derecha
    doc.setFontSize(8)
    setNormal()
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    const valTxt = fechaFirmadaTxt
    const valW   = doc.getTextWidth(valTxt)

    setSB()
    const lblTxt = 'Fecha de Emisión: '
    const lblW   = doc.getTextWidth(lblTxt)

    doc.text(lblTxt, W - 14 - valW - lblW, textY)
    setNormal()
    doc.text(valTxt, W - 14, textY, { align: 'right' })
  }

  // ── QR en negro ──────────────────────────────────────────────────────
  const blackQrBuf = await (async () => {
    try {
      const { default: sharp } = await import('sharp')
      const buf = Buffer.from(qrDataUrl.split(',')[1], 'base64')

      
return await sharp(buf).flatten({ background: '#ffffff' }).greyscale().threshold(200).png().toBuffer()
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

  // Logos centrados, alineados verticalmente al centro del QR
  const logoMaxH = 18; const logoMaxW = 55; const logoGap = 10
  const mainDims  = await resolveLogoDimensions(logoBuffer, logoMaxW, logoMaxH)
  const logo4Dims = logo4Buf ? await resolveLogoDimensions(logo4Buf, logoMaxW, logoMaxH) : null
  const totalLogosW = mainDims.w + (logo4Dims ? logoGap + logo4Dims.w : 0)
  const logosStartX = (W - totalLogosW) / 2
  const qrMidY      = qrY + qrSize / 2

  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext, logosStartX, qrMidY - mainDims.h / 2, mainDims.w, mainDims.h, 'LOGO_P1')
    } catch { /* skip */ }
  }

  if (logo4Buf && logo4Comp && logo4Dims) {
    try {
      doc.addImage(logo4Comp.buffer, logo4Comp.jsPdfFormat,
        logosStartX + mainDims.w + logoGap, qrMidY - logo4Dims.h / 2,
        logo4Dims.w, logo4Dims.h, 'LOGO4_P1')
    } catch { /* skip */ }
  }

  // QR esquina superior derecha
  const ptToMm = 0.352778

  /** Texto bajo el QR: "Verifica su autenticidad" + código. Devuelve Y inferior del bloque. */
  const drawQrVerificationLabels = (qrX: number, qrY: number, qrSize: number): number => {
    const cx = qrX + qrSize / 2

    doc.setFontSize(7.6)
    setNormal()
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
    doc.text('Verifica su', cx, qrY + qrSize + 3, { align: 'center' })
    doc.text('autenticidad', cx, qrY + qrSize + 5.8, { align: 'center' })

    doc.setFontSize(6)
    setNormal()
    const codeLines = doc.splitTextToSize(codigoVerificacion, qrSize + 10)
    const codeY = qrY + qrSize + 8.8
    const codeLh = 6 * ptToMm * 1.06

    doc.text(codeLines, cx, codeY, { align: 'center' })

    return codeY + codeLines.length * codeLh
  }

  doc.addImage(blackQrBuf, 'PNG', qrX, qrY, qrSize, qrSize)
  drawQrVerificationLabels(qrX, qrY, qrSize)

  const NOMBRE_SIZE = 30
  const CURSO_SIZE = 20
  const DESC_SIZE = 10.6
  const descLh = DESC_SIZE * ptToMm * 1.06

  const textMaxW = W - margin * 2 - 40
  const textMaxWCurso = W - margin * 2 - 60
  const sigLineY = H - BAR_H - 32

  // Definir área útil para el bloque de texto con holgura segura para evitar colisión con firmas y sellos
  const topLimit = 37
  const bottomLimitP1 = sigLineY - 32
  const availableSpace = bottomLimitP1 - topLimit

  const fechaInicioTxt = formatDateLong(fechaInicioVal)
  const fechaFinTxt = formatDateLong(fechaFinVal)
  const duracionTxt = cursoDuracion?.match(/hora/i) ? (cursoDuracion || '---') : `${cursoDuracion || '---'} horas académicas`

  const instName = 'Instituto Peruano de Gestión Ambiental. Seguridad y Calidad'

  const descSegs: Seg[] = [
    { text: 'Emitido por el ' },
    { text: `${instName},`, bold: true },
    { text: ` con una duración de ${duracionTxt}, realizado desde el ${fechaInicioTxt} hasta el ${fechaFinTxt}.` },
  ]

  const porcuantoTxt = 'Por cuanto: Para que conste y sea reconocido, se otorga el presente certificado en calidad de:'

  const nombreLines = doc.splitTextToSize(nombreCompleto, textMaxW)
  const cursoLines = doc.splitTextToSize(cursoTitulo, textMaxWCurso)
  const porcuantoLines = doc.splitTextToSize(porcuantoTxt, textMaxW)

  const descPlain = descSegs.map(s => s.text).join('')
  const descLineCount = doc.splitTextToSize(descPlain, textMaxW).length

  // Calcular la altura exacta de cada elemento basándose en sus fuentes (sin los gaps visuales)
  const h1 = 47 * ptToMm * 1.06
  const h2 = DESC_SIZE * ptToMm * 1.06
  const h3 = nombreLines.length * NOMBRE_SIZE * ptToMm * 1.06
  const h4 = DESC_SIZE * ptToMm * 1.06
  const h5 = cursoLines.length * CURSO_SIZE * ptToMm * 1.06
  const h6 = descLineCount * descLh
  const h7 = porcuantoLines.length * descLh
  const h8 = DESC_SIZE * ptToMm * 1.06
  const h9 = DESC_SIZE * ptToMm * 1.06

  const hTextOnly = h1 + h2 + h3 + h4 + h5 + h6 + h7 + h8 + h9

  // Para 9 elementos de texto, hay exactamente 8 gaps visuales intermedios
  const g = Math.max(2.0, (availableSpace - hTextOnly) / 8)

  const finalTotalHeight = hTextOnly + 8 * g
  const startY = topLimit + (availableSpace - finalTotalHeight) / 2

  let y = startY + h1

  // "CERTIFICADO" — ExtraLight, 47pt
  doc.setFontSize(47); setEL()
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.text('CERTIFICADO', cx, y, { align: 'center' })

  // "Otorgado a:" — Regular 10.6pt, gray
  y += g + h2
  doc.setFontSize(DESC_SIZE); setNormal()
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('Otorgado a:', cx, y, { align: 'center' })

  // Nombre del estudiante — Bold 30pt, teal
  y += g + h3
  doc.setFontSize(NOMBRE_SIZE); setBold()
  doc.setTextColor(TEAL.r, TEAL.g, TEAL.b)
  doc.text(nombreLines, cx, y - 2.2, { align: 'center' })

  // "Por haber concluido..." — Regular 10.6pt
  y += g + h4
  doc.setFontSize(DESC_SIZE); setNormal()
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.text('Por haber concluido y aprobado con éxito el curso de especialización de:', cx, y, { align: 'center' })

  // Nombre del curso — SemiBold 20pt
  y += g + h5
  doc.setFontSize(CURSO_SIZE); setSB()
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.text(cursoLines, cx, y - 1.0, { align: 'center' })

  // Descripción
  const descDrawY = y + g + descLh

  doc.setFontSize(DESC_SIZE); setNormal()
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  renderMixed(descSegs, cx, descDrawY, textMaxW, descLh)
  y += g + h6

  // "Por cuanto..."
  doc.setFontSize(DESC_SIZE); setNormal()
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)

  let cy = y + g

  for (const line of porcuantoLines) {
    cy += descLh
    doc.text(line, cx, cy, { align: 'center' })
  }

  y += g + h7

  // "APROBADO"
  y += g + h8
  doc.setFontSize(DESC_SIZE); setSB()
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('APROBADO', cx, y, { align: 'center' })

  // "Firmado, el..."
  y += g + h9
  doc.setFontSize(DESC_SIZE); setNormal()
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text(`Firmado, el ${fechaFirmadaTxt}.`, cx, y, { align: 'center' })

  // Firmas: gerente izquierda, docente derecha
  await drawFirmanteCertificadoBlock(doc, cx - 62, sigLineY, firmanteIzquierdo, { showLine: true, darkColor: DARK, grayColor: GRAY })
  await drawFirmanteCertificadoBlock(doc, cx + 62, sigLineY, firmanteDerecho, { showLine: true, darkColor: DARK, grayColor: GRAY, isRight: true })

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 2 — Temario del programa
  // ══════════════════════════════════════════════════════════════════════
  doc.addPage()
  setupPage()

  // Margen lateral 14mm (igual que pág. 1), gap vertical 5mm desde las barras
  const p2M     = 14
  const qr2Size = 28
  const qr2X    = W - p2M - qr2Size
  const qr2Y    = BAR_H + 5

  doc.addImage(blackQrBuf, 'PNG', qr2X, qr2Y, qr2Size, qr2Size)
  const qr2BlockBottom = drawQrVerificationLabels(qr2X, qr2Y, qr2Size)

  // "CERTIFICADO" — Regular Normal, green, 28pt — baseline ~5mm de gap visual desde barra
  const titleY = BAR_H + 12

  doc.setFontSize(28); setNormal()
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b)
  doc.text('CERTIFICADO', p2M, titleY)

  // Bloque de datos
  let infoY = titleY + 8
  const infoBlockW = W - p2M * 2 - qr2Size - 8

  const duracionFormat = (() => {
    if (!cursoDuracion) {
      return '---'
    }

    const numMatch = cursoDuracion.match(/(\d+)/)

    if (numMatch) {
      return `${numMatch[1]} Horas académicas`
    }

    return `${cursoDuracion} Horas académicas`
  })()

  const infoRows: Array<{ label: string; value: string }> = [
    { label: 'Curso de especialización:', value: cursoTitulo },
    { label: 'Duración:',                 value: duracionFormat },
    { label: 'Promedio Final:',           value: notaFinalCalc !== null ? Math.round(notaFinalCalc).toString() : '---' },
    { label: 'Estudiante:',               value: nombreCompleto },
    {
      label: 'Docente:',
      value: profesorSnapshot
        ? `${profesorSnapshot.nombre} ${profesorSnapshot.apellido || ''}`.trim()
        : '---',
    },
  ]

  doc.setFontSize(8)

  for (const { label, value } of infoRows) {
    setSB()
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    const lw = doc.getTextWidth(label)

    doc.text(label, p2M, infoY)
    setNormal()
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
    const vLines = doc.splitTextToSize(value, infoBlockW - lw - 2)

    doc.text(vLines, p2M + lw + 2, infoY)
    infoY += vLines.length * 5 + 1
  }

  // Separador
  const sepY = Math.max(infoY, qr2BlockBottom) + 3

  doc.setDrawColor(LGRAY.r, LGRAY.g, LGRAY.b)
  doc.setLineWidth(0.3)
  doc.line(p2M, sepY - 2, W - p2M, sepY - 2)

  // ── Temario: módulos, lecciones y subtemas del contenido ─────────────
  const sortedModulos = (modulos as ModuloData[])
    .sort((a, b) => a.orden - b.orden)
    .map(m => ({ ...m, lecciones: [...m.lecciones].sort((a, b) => a.orden - b.orden) }))

  const colW     = (W - p2M * 2 - 10) / 2
  const colLeft  = p2M
  const colRight = p2M + colW + 10
  const subIndent = 3

  const globalIndex = new Map<string, number>()
  let globalLessonNum = 0

  sortedModulos.forEach(m => {
    m.lecciones.forEach(l => {
      globalLessonNum += 1
      globalIndex.set(l.id, globalLessonNum)
    })
  })

  const calcModuloHeight = (modulo: ModuloData): number => {
    let h = 0

    for (const lec of modulo.lecciones) {
      doc.setFontSize(7.5)
      const titleLines = doc.splitTextToSize(lec.titulo.toUpperCase(), colW - subIndent)

      h += 4.5 + titleLines.length * 4 + 1

      doc.setFontSize(7)

      for (const subtema of getSubtemasForLeccion(lec)) {
        const bLines = doc.splitTextToSize(`• ${subtema}`, colW - subIndent)

        h += bLines.length * 3.8
      }

      h += 3
    }

    return h + 2
  }

  const totalModH = sortedModulos.reduce((sum, m) => sum + calcModuloHeight(m), 0)
  const leftTarget = totalModH / 2
  let leftFilled = 0
  const leftModulos: ModuloData[] = []
  const rightModulos: ModuloData[] = []

  for (const mod of sortedModulos) {
    if (leftFilled < leftTarget || leftModulos.length === 0) {
      leftModulos.push(mod)
      leftFilled += calcModuloHeight(mod)
    } else {
      rightModulos.push(mod)
    }
  }

  const renderModulos = (list: ModuloData[], startX: number, startY: number) => {
    let cy = startY

    for (const mod of list) {
      if (cy > bottomLimit) break

      for (const lec of mod.lecciones) {
        if (cy > bottomLimit) break

        const num = globalIndex.get(lec.id) ?? 0
        const numLabel = `LECCIÓN ${String(num).padStart(2, '0')}:`

        doc.setFontSize(7.5); setSB()
        doc.setTextColor(TEAL.r, TEAL.g, TEAL.b)
        doc.text(numLabel, startX + subIndent, cy)
        cy += 4.5

        const titleLines = doc.splitTextToSize(lec.titulo.toUpperCase(), colW - subIndent)

        doc.setFontSize(7.5); setBold()
        doc.setTextColor(DARK.r, DARK.g, DARK.b)
        doc.text(titleLines, startX + subIndent, cy)
        cy += titleLines.length * 4 + 1

        const subtemas = getSubtemasForLeccion(lec)

        doc.setFontSize(7); setNormal()
        doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)

        for (const subtema of subtemas) {
          const bLines = doc.splitTextToSize(`• ${subtema}`, colW - subIndent * 2)

          if (cy + bLines.length * 3.8 > bottomLimit) return
          doc.text(bLines, startX + subIndent * 2, cy)
          cy += bLines.length * 3.8
        }

        cy += 3
      }

      cy += 2
    }
  }

  renderModulos(leftModulos,  colLeft,  sepY + 5)
  renderModulos(rightModulos, colRight, sepY + 5)

  await drawFooter()

  return doc.output('arraybuffer')
}
