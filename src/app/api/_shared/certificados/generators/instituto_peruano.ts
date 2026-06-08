import { fetchImageBuffer, compressImageForPdf, formatDateLong, resolveLogoDimensions } from './utils'
import type { GeneratorFn, ModuloData } from './types'

// Colores corporativos fijos del Instituto Peruano
const GREEN  = { r: 54,  g: 182, b: 88  }  // #36B658
const TEAL   = { r: 19,  g: 153, b: 113 }  // #139971
const DARK   = { r: 30,  g: 30,  b: 30  }
const GRAY   = { r: 100, g: 100, b: 100 }
const LGRAY  = { r: 220, g: 220, b: 220 }

/** Extrae los textos de los <li> de un HTML */
function extractBullets(html: string | null | undefined): string[] {
  if (!html) return []
  const matches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi)
  if (!matches) return []
  return matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean)
}

/**
 * Plantilla INSTITUTO PERUANO
 * Diseño fiel al certificado oficial del Instituto Peruano de Gestión Ambiental,
 * Seguridad y Calidad. Dos páginas:
 * - Página 1: Certificado principal con firmas.
 * - Página 2: Resumen del programa con temario por lección.
 */
export const generarInstitutoPeruano: GeneratorFn = async data => {
  const {
    base64Logo,
    logoUrl,
    logoBuffer,
    nombreInstitucion,
    nombreCompleto,
    cursoTitulo,
    cursoDuracion,
    fechaEmisionVal,
    fechaInicioVal,
    fechaFinVal,
    gerenteGeneral,
    profesorSnapshot,
    codigoVerificacion,
    qrDataUrl,
    modulos,
    notasPorModulo,
    notaInscripcion,
  } = data

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  const W = doc.internal.pageSize.getWidth()   // 297
  const H = doc.internal.pageSize.getHeight()  // 210

  const margin = 14
  const BAR_H = 3.5

  // ── Logos adicionales del pie (logo2, logo3, logo4) ──────────────────
  const [logo2Buf, logo3Buf, logo4Buf] = await Promise.all([
    fetchImageBuffer('/logos/logo2.png'),
    fetchImageBuffer('/logos/logo3.png'),
    fetchImageBuffer('/logos/logo4.png'),
  ])

  const [logo2Comp, logo3Comp, logo4Comp] = await Promise.all([
    logo2Buf ? compressImageForPdf(logo2Buf, { maxWidth: 300, format: 'png' }) : null,
    logo3Buf ? compressImageForPdf(logo3Buf, { maxWidth: 300, format: 'png' }) : null,
    logo4Buf ? compressImageForPdf(logo4Buf, { maxWidth: 300, format: 'png' }) : null,
  ])

  // ── Firma helper ─────────────────────────────────────────────────────
  const drawSignatureBlock = async (
    cx: number,
    lineY: number,
    user: typeof gerenteGeneral,
    labelOverride?: string
  ) => {
    if (!user) return
    if (user.firma) {
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
    doc.line(cx - 38, lineY, cx + 38, lineY)
    const nombre = `${user.nombre || ''} ${user.apellido || ''}`.trim()
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    doc.text(nombre, cx, lineY + 5, { align: 'center' })
    const cargo = labelOverride || user.cargo || ''
    if (cargo) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
      doc.text(cargo, cx, lineY + 10, { align: 'center' })
      doc.text(nombreInstitucion, cx, lineY + 15, { align: 'center' })
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 1 — Certificado principal
  // ══════════════════════════════════════════════════════════════════════
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, W, H, 'F')

  // Barra superior verde claro
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b)
  doc.rect(0, 0, W, BAR_H, 'F')

  // Barra inferior verde claro
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b)
  doc.rect(0, H - BAR_H, W, BAR_H, 'F')

  // ── Header: logos izquierda | QR derecha ─────────────────────────────
  const headerY = BAR_H + 5
  const logoMaxH = 16
  const logoMaxW = 52

  // Logo principal (IPG)
  let logoW = logoMaxH
  let logoH = logoMaxH
  if (logoBuffer) {
    const dims = await resolveLogoDimensions(logoBuffer, logoMaxW, logoMaxH)
    logoW = dims.w
    logoH = dims.h
  }
  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'
      doc.addImage(base64Logo, ext, margin, headerY, logoW, logoH, 'LOGO_P1')
    } catch { /* skip */ }
  }

  // Logo CCL (logo2) junto al IPG
  if (logo2Comp) {
    try {
      const dims = await resolveLogoDimensions(logo2Buf!, logoMaxW, logoMaxH)
      doc.addImage(logo2Comp.buffer, logo2Comp.jsPdfFormat, margin + logoW + 6, headerY + (logoH - dims.h) / 2, dims.w, dims.h, 'LOGO2_P1')
    } catch { /* skip */ }
  }

  // QR en esquina superior derecha
  const qrSize = 28
  const qrX = W - margin - qrSize
  const qrY = headerY
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 1.5, 1.5, 'F')
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('Verifica su', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' })
  doc.text('autenticidad', qrX + qrSize / 2, qrY + qrSize + 8, { align: 'center' })

  // Línea separadora bajo el header
  const sepY = headerY + logoMaxH + 5
  doc.setDrawColor(LGRAY.r, LGRAY.g, LGRAY.b)
  doc.setLineWidth(0.3)
  doc.line(margin, sepY, W - margin, sepY)

  // ── Cuerpo central ────────────────────────────────────────────────────
  const cx = W / 2
  let y = sepY + 10

  // "CERTIFICADO"
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.text('CERTIFICADO', cx, y, { align: 'center' })
  y += 10

  // "Otorgado a:"
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('Otorgado a:', cx, y, { align: 'center' })
  y += 9

  // Nombre del estudiante (teal, grande)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(TEAL.r, TEAL.g, TEAL.b)
  doc.text(nombreCompleto, cx, y, { align: 'center' })
  y += 10

  // Texto "Por haber concluido..."
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  doc.text('Por haber concluido y aprobado con éxito el curso de especialización de:', cx, y, { align: 'center' })
  y += 9

  // Nombre del curso
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(DARK.r, DARK.g, DARK.b)
  const cursoLines = doc.splitTextToSize(cursoTitulo, W - margin * 2 - 60)
  doc.text(cursoLines, cx, y, { align: 'center' })
  y += cursoLines.length * 7 + 7

  // Descripción institucional
  const fechaInicioTxt = formatDateLong(fechaInicioVal)
  const fechaFinTxt    = formatDateLong(fechaFinVal)
  const descripcion = `Emitido por el ${nombreInstitucion}, con una duración de ${cursoDuracion || '---'}, realizado desde el ${fechaInicioTxt} hasta el ${fechaFinTxt}.`
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  const descLines = doc.splitTextToSize(descripcion, W - margin * 2 - 50)
  doc.text(descLines, cx, y, { align: 'center' })
  y += descLines.length * 5.5 + 4

  // "Por cuanto..."
  const porcuanto = 'Por cuanto: Para que conste y sea reconocido, se otorga el presente certificado en calidad de:'
  const porcuantoLines = doc.splitTextToSize(porcuanto, W - margin * 2 - 50)
  doc.text(porcuantoLines, cx, y, { align: 'center' })
  y += porcuantoLines.length * 5.5 + 5

  // "APROBADO"
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(TEAL.r, TEAL.g, TEAL.b)
  doc.text('APROBADO', cx, y, { align: 'center' })
  const aprobadoW = doc.getTextWidth('APROBADO')
  doc.setDrawColor(TEAL.r, TEAL.g, TEAL.b)
  doc.setLineWidth(0.4)
  doc.line(cx - aprobadoW / 2 - 12, y - 1.5, cx - aprobadoW / 2 - 2, y - 1.5)
  doc.line(cx + aprobadoW / 2 + 2, y - 1.5, cx + aprobadoW / 2 + 12, y - 1.5)
  y += 8

  // "Firmado, el..."
  const fechaFirmadaTxt = new Date(fechaEmisionVal).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text(`Firmado, el ${fechaFirmadaTxt}.`, cx, y, { align: 'center' })
  y += 4

  // ── Firmas ────────────────────────────────────────────────────────────
  const sigLineY = H - BAR_H - 30
  const hasGerente = gerenteGeneral !== null

  if (hasGerente && data.mostrarFirmaDocente && profesorSnapshot) {
    await drawSignatureBlock(cx - 58, sigLineY, gerenteGeneral, 'Gerente General')
    await drawSignatureBlock(cx + 58, sigLineY, profesorSnapshot, 'Director Académico')
  } else if (hasGerente) {
    await drawSignatureBlock(cx - 40, sigLineY, gerenteGeneral, 'Gerente General')
  } else if (data.mostrarFirmaDocente && profesorSnapshot) {
    await drawSignatureBlock(cx, sigLineY, profesorSnapshot, 'Director Académico')
  }

  // ══════════════════════════════════════════════════════════════════════
  // PÁGINA 2 — Temario del programa
  // ══════════════════════════════════════════════════════════════════════
  doc.addPage()
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, W, H, 'F')

  // Barras verde
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b)
  doc.rect(0, 0, W, BAR_H, 'F')
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b)
  doc.rect(0, H - BAR_H, W, BAR_H, 'F')

  // ── "CERTIFICADO" título superior izquierda (teal, delgado) ──────────
  const p2TitleY = BAR_H + 9
  doc.setFontSize(22)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(TEAL.r, TEAL.g, TEAL.b)
  doc.text('CERTIFICADO', margin, p2TitleY)

  // ── Bloque de datos del curso (izquierda) ─────────────────────────────
  const infoX = margin
  let infoY = p2TitleY + 7

  // Calcular nota final igual que en otros generadores
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

  const infoLines: Array<{ label: string; value: string }> = [
    { label: 'Curso de especialización:', value: cursoTitulo },
    { label: 'Duración:', value: cursoDuracion || '---' },
    { label: 'Promedio Final:', value: notaFinalCalc !== null ? notaFinalCalc.toFixed(2) : '---' },
    { label: 'Estudiante:', value: nombreCompleto },
    { label: 'Docente:', value: profesorSnapshot ? `${profesorSnapshot.nombre} ${profesorSnapshot.apellido || ''}`.trim() : '---' },
  ]

  const infoBlockW = W - margin * 2 - qrSize - 14
  doc.setFontSize(8.5)

  for (const { label, value } of infoLines) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK.r, DARK.g, DARK.b)
    const labelW = doc.getTextWidth(label)
    doc.text(label, infoX, infoY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
    const valueLines = doc.splitTextToSize(value, infoBlockW - labelW - 2)
    doc.text(valueLines, infoX + labelW + 2, infoY)
    infoY += valueLines.length * 5 + 1
  }

  // ── QR esquina derecha (p2) ───────────────────────────────────────────
  const qr2Size = 28
  const qr2X = W - margin - qr2Size
  const qr2Y = BAR_H + 5
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(qr2X - 2, qr2Y - 2, qr2Size + 4, qr2Size + 4, 1.5, 1.5, 'F')
  doc.addImage(qrDataUrl, 'PNG', qr2X, qr2Y, qr2Size, qr2Size)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text('Verifica su', qr2X + qr2Size / 2, qr2Y + qr2Size + 4, { align: 'center' })
  doc.text('autenticidad', qr2X + qr2Size / 2, qr2Y + qr2Size + 8, { align: 'center' })

  // ── Separador horizontal ──────────────────────────────────────────────
  const lessonStartY = Math.max(infoY, qr2Y + qr2Size + 10) + 4
  doc.setDrawColor(LGRAY.r, LGRAY.g, LGRAY.b)
  doc.setLineWidth(0.3)
  doc.line(margin, lessonStartY - 2, W - margin, lessonStartY - 2)

  // ── Temario: lecciones en 2 columnas ─────────────────────────────────
  const allLecciones = (modulos as ModuloData[])
    .sort((a, b) => a.orden - b.orden)
    .flatMap(m => m.lecciones.sort((a, b) => a.orden - b.orden))

  const colW = (W - margin * 2 - 10) / 2
  const colLeft  = margin
  const colRight = margin + colW + 10
  const footerReserve = BAR_H + 22  // espacio para logos + fecha

  const bottomLimit = H - footerReserve

  // Pre-calcular altura de cada lección
  const calcLecHeight = (leccion: (typeof allLecciones)[number]): number => {
    const bullets = extractBullets(leccion.contenido)
    // Línea de número + título
    const titleLines = doc.splitTextToSize(leccion.titulo.toUpperCase(), colW - 20)
    let h = 5 + titleLines.length * 4  // número + título
    for (const b of bullets) {
      const bLines = doc.splitTextToSize(`• ${b}`, colW - 8)
      h += bLines.length * 3.8
    }
    h += 5 // espaciado inferior
    return h
  }

  // Dividir en dos columnas balanceadas
  const half = Math.ceil(allLecciones.length / 2)
  const leftLecs  = allLecciones.slice(0, half)
  const rightLecs = allLecciones.slice(half)

  // Índice global para número de lección
  const globalIndex: Map<string, number> = new Map()
  allLecciones.forEach((l, i) => globalIndex.set(l.id, i + 1))

  const renderLecciones = (list: typeof allLecciones, startX: number, startY: number) => {
    let cy = startY
    for (const lec of list) {
      const bullets = extractBullets(lec.contenido)
      const num = globalIndex.get(lec.id) ?? 0
      const numLabel = `LECCIÓN ${String(num).padStart(2, '0')}:`

      // Número en verde turquesa
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(TEAL.r, TEAL.g, TEAL.b)
      doc.text(numLabel, startX, cy)
      cy += 4.5

      // Título en negrita oscuro
      const titleLines = doc.splitTextToSize(lec.titulo.toUpperCase(), colW - 6)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(DARK.r, DARK.g, DARK.b)
      doc.text(titleLines, startX, cy)
      cy += titleLines.length * 4 + 1

      // Bullets en gris normal
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
      for (const bullet of bullets) {
        const bLines = doc.splitTextToSize(`• ${bullet}`, colW - 6)
        if (cy + bLines.length * 3.8 > bottomLimit) break
        doc.text(bLines, startX, cy)
        cy += bLines.length * 3.8
      }

      cy += 4  // separación entre lecciones
      if (cy > bottomLimit) break
    }
  }

  renderLecciones(leftLecs,  colLeft,  lessonStartY)
  renderLecciones(rightLecs, colRight, lessonStartY)

  // ── Footer página 2: logos + fecha ───────────────────────────────────
  const footerY = H - BAR_H - 18
  const logoFooterH = 10
  const logoGap = 8

  // Centrar logos: IPG + CCL + CIREVA + BioTerrar
  type LogoEntry = { buf: Buffer; comp: { buffer: Buffer; jsPdfFormat: string } }
  const footerLogos: LogoEntry[] = []

  if (logoBuffer && base64Logo) footerLogos.push({ buf: logoBuffer, comp: { buffer: logoBuffer, jsPdfFormat: 'PNG' } })
  if (logo2Buf && logo2Comp)    footerLogos.push({ buf: logo2Buf,   comp: logo2Comp })
  if (logo3Buf && logo3Comp)    footerLogos.push({ buf: logo3Buf,   comp: logo3Comp })
  if (logo4Buf && logo4Comp)    footerLogos.push({ buf: logo4Buf,   comp: logo4Comp })

  // Calcular ancho total
  const logoDims: Array<{ w: number; h: number }> = await Promise.all(
    footerLogos.map(({ buf }) => resolveLogoDimensions(buf, 40, logoFooterH))
  )
  const totalLogosW = logoDims.reduce((s, d) => s + d.w, 0) + logoGap * (footerLogos.length - 1)
  let lx = (W - totalLogosW) / 2

  for (let i = 0; i < footerLogos.length; i++) {
    const { comp } = footerLogos[i]
    const { w, h } = logoDims[i]
    const ly = footerY + (logoFooterH - h) / 2
    try {
      if (i === 0 && base64Logo) {
        const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'
        doc.addImage(base64Logo, ext, lx, ly, w, h, `FOOT_LOGO_${i}`)
      } else {
        doc.addImage(comp.buffer, comp.jsPdfFormat, lx, ly, w, h, `FOOT_LOGO_${i}`)
      }
    } catch { /* skip */ }
    lx += w + logoGap
  }

  // Fecha de emisión (bottom right)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b)
  doc.text(`Fecha de Emisión: ${fechaFirmadaTxt}`, W - margin, H - BAR_H - 5, { align: 'right' })

  // Código de verificación (bottom left)
  doc.text(`Cód. verificación: ${codigoVerificacion}`, margin, H - BAR_H - 5)

  return doc.output('arraybuffer')
}
