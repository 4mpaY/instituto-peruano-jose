import type { GeneratorFn } from './types'
import { fetchImageBuffer, formatDateLong } from './utils'

/**
 * Plantilla CLÁSICA RESUMIDA — Igual que Clásico, pero en la página 2
 * solo muestra los módulos y lecciones en dos columnas, sin notas,
 * para ahorrar espacio.
 */
export const generarClasicoResumido: GeneratorFn = async (data) => {
  const {
    pr, pg, pb,
    logoBuffer, logoUrl, base64Logo,
    nombreInstitucion, slogan,
    nombreCompleto, avatarBuffer,
    cursoTitulo, cursoDuracion,
    fechaEmisionVal, fechaInicioVal, fechaFinVal,
    gerenteGeneral, profesorSnapshot, mostrarFirmaDocente,
    codigoVerificacion, qrDataUrl,
    modulos,
    previewFlag,
  } = data

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // ── Helpers ──────────────────────────────────────────────────────────
  const dpR = Math.round(pr * 0.52)
  const dpG = Math.round(pg * 0.52)
  const dpB = Math.round(pb * 0.52)

  const fechaFirmadaTxt = new Date(fechaEmisionVal).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  })

  const addSignatureBlock = async (x: number, lineY: number, user: any) => {
    if (!user) return

    if (user.firma) {
      try {
        const signatureBuffer = await fetchImageBuffer(user.firma)

        if (signatureBuffer) {
          const sigExt = user.firma.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'png'

          doc.addImage(signatureBuffer, sigExt.toUpperCase(), x - 17, lineY - 34, 34, 34)
        }
      } catch { /* skip */ }
    }

    doc.setDrawColor(50, 50, 50)
    doc.setLineWidth(0.5)
    doc.line(x - 36, lineY, x + 36, lineY)
    const nombreFirmante = `${user.nombre || ''} ${user.apellido || ''}`.trim()

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(25, 25, 25)
    doc.text(nombreFirmante, x, lineY + 7, { align: 'center' })

    if (user.cargo) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(user.cargo, x, lineY + 13, { align: 'center' })
    }
  }

  // ── PÁGINA 1 ─────────────────────────────────────────────────────────
  const panelW = 72
  const contentW = pageWidth - panelW
  const cx = contentW / 2

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Gradiente del panel lateral
  const gradStrips = 70

  for (let i = 0; i < gradStrips; i++) {
    const t = i / (gradStrips - 1)
    const r = Math.round(pr + (255 - pr) * 0.12 - (pr + (255 - pr) * 0.12 - dpR) * t)
    const g = Math.round(pg + (255 - pg) * 0.12 - (pg + (255 - pg) * 0.12 - dpG) * t)
    const b = Math.round(pb + (255 - pb) * 0.12 - (pb + (255 - pb) * 0.12 - dpB) * t)

    doc.setFillColor(Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b)))
    doc.rect(contentW, (i / gradStrips) * pageHeight, panelW, pageHeight / gradStrips + 0.5, 'F')
  }

  // Ribbons diagonales
  const ribR1 = Math.round(pr + (255 - pr) * 0.28)
  const ribG1 = Math.round(pg + (255 - pg) * 0.28)
  const ribB1 = Math.round(pb + (255 - pb) * 0.28)

  doc.setFillColor(ribR1, ribG1, ribB1)
  doc.lines([[21, 22, 41, 68, 60, 96], [0, 24], [-19, -12, -39, -48, -60, -96], [0, -24]], 237, 0, [1, 1], 'F', true)

  const ribR2 = Math.round(pr + (255 - pr) * 0.14)
  const ribG2 = Math.round(pg + (255 - pg) * 0.14)
  const ribB2 = Math.round(pb + (255 - pb) * 0.14)

  doc.setFillColor(ribR2, ribG2, ribB2)
  doc.lines([[20, 18, 41, 62, 60, 88], [0, 32], [-19, -4, -39, -42, -60, -98], [0, -22]], 237, 90, [1, 1], 'F', true)

  // QR
  const qrSz = 30
  const qrX0 = contentW + (panelW - qrSz) / 2
  const qrY0 = pageHeight - qrSz - 24

  doc.setFillColor(255, 255, 255)
  doc.roundedRect(qrX0 - 3, qrY0 - 3, qrSz + 6, qrSz + 6, 2, 2, 'F')
  doc.addImage(qrDataUrl, 'PNG', qrX0, qrY0, qrSz, qrSz)
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.text('Escanea para verificar', contentW + panelW / 2, pageHeight - 16, { align: 'center' })

  // Área de contenido izquierda
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, contentW, pageHeight, 'F')

  // "CERTIFICADO" vertical
  doc.setFontSize(55)
  doc.setTextColor(Math.round(pr * 0.55), Math.round(pg * 0.55), Math.round(pb * 0.55))
  doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICADO', contentW + panelW / 2 + 8, 148, { angle: 90 })

  // ── Logo ──
  let y = 10
  const maxLogoH = 22
  const maxLogoW = 60
  let logoDisplayW = maxLogoH
  let logoDisplayH = maxLogoH

  if (logoBuffer) {
    try {
      const { default: sharp } = await import('sharp')
      const meta = await sharp(logoBuffer).metadata()

      if (meta.width && meta.height) {
        const ratio = meta.width / meta.height

        logoDisplayH = maxLogoH
        logoDisplayW = Math.min(logoDisplayH * ratio, maxLogoW)
        if (logoDisplayW === maxLogoW) logoDisplayH = maxLogoW / ratio
      }
    } catch { /* default */ }
  }

  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext, cx - logoDisplayW / 2, y, logoDisplayW, logoDisplayH)
    } catch { /* skip */ }
  }

  y += logoDisplayH + 14

  // Título, nombre, curso, descripción
  doc.setFontSize(20); doc.setTextColor(18, 18, 18); doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICADO', cx, y, { align: 'center' }); y += 11

  doc.setFontSize(12); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal')
  doc.text('Otorgado a:', cx, y, { align: 'center' }); y += 11

  doc.setFontSize(20); doc.setTextColor(pr, pg, pb); doc.setFont('helvetica', 'bold')
  doc.text(nombreCompleto.toUpperCase(), cx, y, { align: 'center' }); y += 11

  doc.setFontSize(12); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal')
  doc.text('Por haber concluido y aprobado con éxito el curso de:', cx, y, { align: 'center' }); y += 10

  doc.setFontSize(20); doc.setTextColor(15, 15, 15); doc.setFont('helvetica', 'bold')
  const cursoLines = doc.splitTextToSize(cursoTitulo, contentW - 34)

  doc.text(cursoLines, cx, y, { align: 'center' }); y += cursoLines.length * 7 + 6

  doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
  const descripcionTxt = `Emitido por ${nombreInstitucion}, con una duración de ${cursoDuracion || '---'}, realizado desde el ${formatDateLong(fechaInicioVal)} hasta el ${formatDateLong(fechaFinVal)}.`
  const descripcionLines = doc.splitTextToSize(descripcionTxt, contentW - 40)

  doc.text(descripcionLines, cx, y, { align: 'center' }); y += descripcionLines.length * 6 + 4

  const porcuantoLines = doc.splitTextToSize('Por cuanto: Para que conste y sea reconocido, se otorga el presente certificado en calidad de:', contentW - 40)

  doc.text(porcuantoLines, cx, y, { align: 'center' }); y += porcuantoLines.length * 6 + 5

  doc.setFontSize(14); doc.setTextColor(pr, pg, pb); doc.setFont('helvetica', 'bold')
  doc.text('APROBADO', cx, y, { align: 'center' })
  const aprobadoW = doc.getTextWidth('APROBADO')

  doc.setDrawColor(pr, pg, pb); doc.setLineWidth(0.4)
  doc.line(cx - aprobadoW / 2 - 10, y - 1.5, cx - aprobadoW / 2 - 2, y - 1.5)
  doc.line(cx + aprobadoW / 2 + 2, y - 1.5, cx + aprobadoW / 2 + 10, y - 1.5)
  y += 8

  doc.setFontSize(12); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal')
  doc.text(`Firmado, el ${fechaFirmadaTxt}.`, cx, y, { align: 'center' }); y += 12

  // Firmas
  const hasGerente = gerenteGeneral !== null

  if (hasGerente && mostrarFirmaDocente) {
    await addSignatureBlock(cx - 54, y + 20, gerenteGeneral)
    await addSignatureBlock(cx + 54, y + 20, profesorSnapshot)
  } else if (hasGerente) {
    await addSignatureBlock(cx, y + 20, gerenteGeneral)
  } else if (mostrarFirmaDocente) {
    await addSignatureBlock(cx, y + 20, profesorSnapshot)
  }

  // Footer página 1
  doc.setFontSize(10); doc.setTextColor(90, 90, 90); doc.setFont('helvetica', 'normal')
  doc.text(`Código de Registro: ${codigoVerificacion}`, 16, pageHeight - 12)
  doc.text(`Fecha de Emisión: ${fechaFirmadaTxt}`, 16, pageHeight - 7)

  void previewFlag
  void avatarBuffer

  // ── PÁGINA 2 ─────────────────────────────────────────────────────────
  doc.addPage()
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  const T = { label: 8, body: 9, small: 7 }
  const margin = 16

  // Dibujar un marco ligero alrededor de la página (como en la referencia)
  doc.setDrawColor(pr, pg, pb)
  doc.setLineWidth(0.8)
  doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 5, 5)

  // Banda superior — esquinas redondeadas que siguen el marco (r=5, kappa=0.5523)
  const bk = 0.5523
  const br = 5
  const bx = 8, by = 8
  const bRight = pageWidth - 8
  const bandBottom = 24

  doc.setFillColor(pr, pg, pb)
  doc.path([
    { op: 'm', c: [bx, by + br] },
    { op: 'c', c: [bx, by + br - br * bk, bx + br - br * bk, by, bx + br, by] },
    { op: 'l', c: [bRight - br, by] },
    { op: 'c', c: [bRight - br + br * bk, by, bRight, by + br - br * bk, bRight, by + br] },
    { op: 'l', c: [bRight, bandBottom] },
    { op: 'l', c: [bx, bandBottom] },
    { op: 'h', c: [] }
  ])
  doc.fill()

  const bandH = 15.6 // 24 - 8.4
  const maxLogoHP2 = bandH - 4
  const maxLogoWP2 = 40
  let logoP2W = maxLogoHP2
  let logoP2H = maxLogoHP2

  if (logoBuffer) {
    try {
      const { default: sharp } = await import('sharp')
      const meta = await sharp(logoBuffer).metadata()

      if (meta.width && meta.height) {
        const ratio = meta.width / meta.height

        logoP2H = maxLogoHP2
        logoP2W = Math.min(logoP2H * ratio, maxLogoWP2)
        if (logoP2W === maxLogoWP2) logoP2H = maxLogoWP2 / ratio
        if (logoP2H > maxLogoHP2) { logoP2H = maxLogoHP2; logoP2W = logoP2H * ratio }
      }
    } catch { /* default */ }
  }

  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext, margin, 8.4 + (bandH - logoP2H) / 2, logoP2W, logoP2H)
    } catch { /* skip */ }
  }

  const logoRightEdge = margin + logoP2W + 4

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text(nombreInstitucion.toUpperCase(), logoRightEdge, 14)
  doc.setFontSize(T.body); doc.setFont('helvetica', 'normal')
  doc.text(slogan, logoRightEdge, 20)
  doc.setFontSize(T.label); doc.setFont('helvetica', 'bold')
  doc.text(`Código: ${codigoVerificacion}`, pageWidth - margin, 13, { align: 'right' })
  doc.setFontSize(T.label); doc.setFont('helvetica', 'normal')
  doc.text(`Fecha de emisión: ${fechaFirmadaTxt}`, pageWidth - margin, 19, { align: 'right' })

  // Contenido de módulos y lecciones a dos columnas
  let currentY = 32
  const colGap = 12
  const colW = (pageWidth - margin * 2 - colGap) / 2
  const col1X = margin
  const col2X = margin + colW + colGap
  const limitY = pageHeight - 20

  let currentColumn = 1

  const addLine = (text: string, isModule: boolean) => {
    doc.setFontSize(T.body)
    doc.setFont('helvetica', isModule ? 'bold' : 'normal')
    doc.setTextColor(30, 30, 30)

    const prefix = isModule ? '' : '- '
    const lines = doc.splitTextToSize(prefix + text, colW)
    const lineHeight = isModule ? 5 : 4.5
    const requiredSpace = lines.length * lineHeight + (isModule ? 3 : 1)

    if (currentY + requiredSpace > limitY) {
      if (currentColumn === 1) {
        currentColumn = 2
        currentY = 32
      } else {
        // Nueva página si ambas columnas se llenaron (manteniendo el formato)
        doc.addPage()
        doc.setFillColor(255, 255, 255)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')
        doc.setDrawColor(pr, pg, pb)
        doc.setLineWidth(0.8)
        doc.roundedRect(8, 8, pageWidth - 16, pageHeight - 16, 5, 5)

        // Header simplificado en página extra — esquinas redondeadas
        doc.setFillColor(pr, pg, pb)
        doc.path([
          { op: 'm', c: [8, 8 + 5] },
          { op: 'c', c: [8, 8 + 5 - 5 * 0.5523, 8 + 5 - 5 * 0.5523, 8, 8 + 5, 8] },
          { op: 'l', c: [pageWidth - 13, 8] },
          { op: 'c', c: [pageWidth - 13 + 5 * 0.5523, 8, pageWidth - 8, 8 + 5 - 5 * 0.5523, pageWidth - 8, 8 + 5] },
          { op: 'l', c: [pageWidth - 8, 18] },
          { op: 'l', c: [8, 18] },
          { op: 'h', c: [] }
        ])
        doc.fill()
        doc.setFontSize(T.label); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
        doc.text('CONTENIDO DEL PROGRAMA ACADÉMICO (continuación)', margin, 14.5)

        currentColumn = 1
        currentY = 26
      }
    }

    const x = currentColumn === 1 ? col1X : col2X

    if (isModule) currentY += 2 // Extra gap before module
    doc.text(lines, x, currentY)
    currentY += lines.length * lineHeight
  }

  for (const modulo of modulos) {
    const tituloMod = `- ${modulo.titulo}`.toUpperCase()

    addLine(tituloMod, true)

    for (const leccion of modulo.lecciones) {
      addLine(leccion.titulo, false)
    }
  }

  return doc.output('arraybuffer')
}
