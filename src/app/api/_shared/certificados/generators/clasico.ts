import { fetchImageBuffer, formatDateLong } from './utils'

import type { GeneratorFn } from './types'

/**
 * Plantilla CLÁSICA — Diseño original con panel lateral degradado y QR.
 * Página 1: Certificado principal.
 * Página 2: Rendimiento académico + Contenido del programa.
 */
export const generarClasico: GeneratorFn = async data => {
  const {
    pr,
    pg,
    pb,
    logoBuffer,
    logoUrl,
    base64Logo,
    nombreInstitucion,
    slogan,
    disclaimer,
    institutionUrl,
    nombreCompleto,
    avatarBuffer,
    cursoTitulo,
    cursoDuracion,
    fechaEmisionVal,
    fechaInicioVal,
    fechaFinVal,
    gerenteGeneral,
    profesorSnapshot,
    mostrarFirmaDocente,
    codigoVerificacion,
    qrDataUrl,
    modulos,
    notasPorModulo,
    notaInscripcion,
    previewFlag
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
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
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
      } catch {
        /* skip */
      }
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
  doc.lines(
    [
      [21, 22, 41, 68, 60, 96],
      [0, 24],
      [-19, -12, -39, -48, -60, -96],
      [0, -24]
    ],
    237,
    0,
    [1, 1],
    'F',
    true
  )

  const ribR2 = Math.round(pr + (255 - pr) * 0.14)
  const ribG2 = Math.round(pg + (255 - pg) * 0.14)
  const ribB2 = Math.round(pb + (255 - pb) * 0.14)

  doc.setFillColor(ribR2, ribG2, ribB2)
  doc.lines(
    [
      [20, 18, 41, 62, 60, 88],
      [0, 32],
      [-19, -4, -39, -42, -60, -98],
      [0, -22]
    ],
    237,
    90,
    [1, 1],
    'F',
    true
  )

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

  // Área de contenido izquierda (blanco encima)
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
    } catch {
      /* default */
    }
  }

  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext, cx - logoDisplayW / 2, y, logoDisplayW, logoDisplayH)
    } catch {
      /* skip */
    }
  }

  y += logoDisplayH + 14

  // Título, nombre, curso, descripción
  doc.setFontSize(20)
  doc.setTextColor(18, 18, 18)
  doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICADO', cx, y, { align: 'center' })
  y += 11

  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text('Otorgado a:', cx, y, { align: 'center' })
  y += 11

  doc.setFontSize(20)
  doc.setTextColor(pr, pg, pb)
  doc.setFont('helvetica', 'bold')
  doc.text(nombreCompleto.toUpperCase(), cx, y, { align: 'center' })
  y += 11

  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text('Por haber concluido y aprobado con éxito el curso de:', cx, y, { align: 'center' })
  y += 10

  doc.setFontSize(20)
  doc.setTextColor(15, 15, 15)
  doc.setFont('helvetica', 'bold')
  const cursoLines = doc.splitTextToSize(cursoTitulo, contentW - 34)

  doc.text(cursoLines, cx, y, { align: 'center' })
  y += cursoLines.length * 7 + 6

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const descripcionTxt = `Emitido por ${nombreInstitucion}, con una duración de ${cursoDuracion || '---'}, realizado desde el ${formatDateLong(fechaInicioVal)} hasta el ${formatDateLong(fechaFinVal)}.`
  const descripcionLines = doc.splitTextToSize(descripcionTxt, contentW - 40)

  doc.text(descripcionLines, cx, y, { align: 'center' })
  y += descripcionLines.length * 6 + 4

  const porcuantoLines = doc.splitTextToSize(
    'Por cuanto: Para que conste y sea reconocido, se otorga el presente certificado en calidad de:',
    contentW - 40
  )

  doc.text(porcuantoLines, cx, y, { align: 'center' })
  y += porcuantoLines.length * 6 + 5

  doc.setFontSize(14)
  doc.setTextColor(pr, pg, pb)
  doc.setFont('helvetica', 'bold')
  doc.text('APROBADO', cx, y, { align: 'center' })
  const aprobadoW = doc.getTextWidth('APROBADO')

  doc.setDrawColor(pr, pg, pb)
  doc.setLineWidth(0.4)
  doc.line(cx - aprobadoW / 2 - 10, y - 1.5, cx - aprobadoW / 2 - 2, y - 1.5)
  doc.line(cx + aprobadoW / 2 + 2, y - 1.5, cx + aprobadoW / 2 + 10, y - 1.5)
  y += 8

  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text(`Firmado, el ${fechaFirmadaTxt}.`, cx, y, { align: 'center' })
  y += 12

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
  doc.setFontSize(10)
  doc.setTextColor(90, 90, 90)
  doc.setFont('helvetica', 'normal')
  doc.text(`Código de Registro: ${codigoVerificacion}`, 16, pageHeight - 12)
  doc.text(`Fecha de Emisión: ${fechaFirmadaTxt}`, 16, pageHeight - 7)

  void previewFlag

  // ── PÁGINA 2 ─────────────────────────────────────────────────────────
  doc.addPage()
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  const T = { sectionTitle: 9, label: 8, body: 8, small: 7, score: 22 }
  const margin = 12

  // Banda superior
  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, pageWidth, 18, 'F')

  const bandH = 20
  const maxLogoHP2 = bandH - 8
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

        if (logoP2H > maxLogoHP2) {
          logoP2H = maxLogoHP2
          logoP2W = logoP2H * ratio
        }
      }
    } catch {
      /* default */
    }
  }

  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext, margin, (bandH - logoP2H) / 2, logoP2W, logoP2H)
    } catch {
      /* skip */
    }
  }

  const logoRightEdge = margin + logoP2W + 4

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(nombreInstitucion.toUpperCase(), logoRightEdge, 10)
  doc.setFontSize(T.body)
  doc.setFont('helvetica', 'normal')
  doc.text(slogan, logoRightEdge, 16)
  doc.setFontSize(T.label)
  doc.setFont('helvetica', 'bold')
  doc.text(`Código: ${codigoVerificacion}`, pageWidth - margin, 9, { align: 'right' })
  doc.setFontSize(T.label)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha de emisión: ${fechaFirmadaTxt}`, pageWidth - margin, 15, { align: 'right' })

  // Zona A: Avatar + datos graduado
  const zoneAY = 24
  const avatarSize = 22
  const avatarX = margin

  if (avatarBuffer) {
    try {
      const avatarUrl = data.avatarBuffer ? '' : ''

      void avatarUrl
      const ext = 'PNG'
      const base64Avatar = `data:image/png;base64,${avatarBuffer.toString('base64')}`

      doc.setFillColor(240, 240, 240)
      doc.circle(avatarX + avatarSize / 2, zoneAY + avatarSize / 2, avatarSize / 2, 'F')
      doc.addImage(base64Avatar, ext, avatarX, zoneAY, avatarSize, avatarSize)
    } catch {
      /* skip */
    }
  } else {
    doc.setFillColor(pr, pg, pb)
    doc.circle(avatarX + avatarSize / 2, zoneAY + avatarSize / 2, avatarSize / 2, 'F')
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)

    const initials = nombreCompleto
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')

    doc.text(initials, avatarX + avatarSize / 2, zoneAY + avatarSize / 2 + 2.5, { align: 'center' })
  }

  const textX = avatarX + avatarSize + 5

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(25, 25, 25)
  doc.text(nombreCompleto, textX, zoneAY + 8)
  doc.setFontSize(T.body)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Certificado de Finalización', textX, zoneAY + 14)
  const cursoTituloP2Lines = doc.splitTextToSize(cursoTitulo, pageWidth - textX - margin - 80)

  doc.setFontSize(T.body)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(60, 60, 60)
  doc.text(cursoTituloP2Lines, textX, zoneAY + 20)

  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(margin, zoneAY + avatarSize + 5, pageWidth - margin, zoneAY + avatarSize + 5)

  // Zona B: columnas
  const zoneB_Y = zoneAY + avatarSize + 10
  const colGap = 6
  const colW = (pageWidth - margin * 2 - colGap) / 2
  const colLeft = margin
  const colRight = margin + colW + colGap

  // Columna izquierda: Rendimiento
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(colLeft, zoneB_Y, colW, 8, 1, 1, 'F')
  doc.setFontSize(T.sectionTitle)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('RENDIMIENTO ACADÉMICO', colLeft + colW / 2, zoneB_Y + 5.5, { align: 'center' })

  let yLeft = zoneB_Y + 13

  const promediosPorModulo = Object.values(notasPorModulo).map(e => {
    const raw = e.puntaje / e.count

    return raw > 20 ? raw / 5 : raw
  })

  const notaMax = 20

  const notaFinal =
    promediosPorModulo.length > 0
      ? promediosPorModulo.reduce((a, b) => a + b, 0) / promediosPorModulo.length
      : (() => {
          const raw = notaInscripcion ?? null

          return raw !== null ? (raw > 20 ? raw / 5 : raw) : null
        })()

  const notaDisplay = notaFinal !== null ? notaFinal.toFixed(2) : '---'
  const porcentaje = notaFinal !== null ? Math.min(notaFinal / notaMax, 1) : 0

  doc.setFontSize(T.score)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(notaDisplay, colLeft + colW / 2, yLeft + 10, { align: 'center' })
  doc.setFontSize(T.small)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text(`/ ${notaMax}.00`, colLeft + colW / 2 + 8, yLeft + 10)
  doc.setFontSize(T.label)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Promedio Ponderado Final', colLeft + colW / 2, yLeft + 16, { align: 'center' })
  yLeft += 22

  const barW = colW - 16
  const barX = colLeft + 8

  doc.setFillColor(230, 230, 230)
  doc.roundedRect(barX, yLeft, barW, 4, 2, 2, 'F')
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(barX, yLeft, barW * porcentaje, 4, 2, 2, 'F')
  doc.setFontSize(T.small)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(`${Math.round(porcentaje * 100)}%`, barX + barW + 2, yLeft + 3.5)
  yLeft += 10

  const modulosConNota = modulos.filter(m => notasPorModulo[m.id])

  if (modulosConNota.length > 0) {
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.line(colLeft + 4, yLeft, colLeft + colW - 4, yLeft)
    yLeft += 5
    doc.setFontSize(T.label)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text('Calificaciones por Módulo', colLeft + 4, yLeft)
    yLeft += 6

    for (const mod of modulosConNota) {
      if (yLeft > 168) break
      const entry = notasPorModulo[mod.id]
      const rawMod = entry.puntaje / entry.count
      const promMod = (rawMod > 20 ? rawMod / 5 : rawMod).toFixed(1)
      const tituloMod = doc.splitTextToSize(mod.titulo, colW - 22)

      doc.setFontSize(T.body)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(tituloMod, colLeft + 4, yLeft)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(pr, pg, pb)
      doc.text(promMod, colLeft + colW - 4, yLeft, { align: 'right' })
      doc.setDrawColor(210, 210, 210)
      doc.setLineWidth(0.15)
      doc.line(colLeft + 4 + doc.getTextWidth(tituloMod[0]) + 2, yLeft + 0.5, colLeft + colW - 10, yLeft + 0.5)
      yLeft += tituloMod.length * 4.5 + 2
    }
  }

  // Columna derecha: Contenido del programa
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(colRight, zoneB_Y, colW, 8, 1, 1, 'F')
  doc.setFontSize(T.sectionTitle)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('CONTENIDO DEL PROGRAMA', colRight + colW / 2, zoneB_Y + 5.5, { align: 'center' })

  let yRight = zoneB_Y + 13
  const contentBottomLimit = pageHeight - 22
  let onExtraPage = false

  const startNewModulosPage = () => {
    doc.addPage()
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    doc.setFillColor(pr, pg, pb)
    doc.rect(0, 0, pageWidth, 8, 'F')
    doc.setFontSize(T.small)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('CONTENIDO DEL PROGRAMA ACADÉMICO (continuación)', margin, 5.5)
    onExtraPage = true

    return 14
  }

  for (const modulo of modulos) {
    const modTxt = `${modulo.orden + 1}. ${modulo.titulo}`.toUpperCase()
    const modLines = doc.splitTextToSize(modTxt, colW - 8)
    const modH = modLines.length * 4.5 + 4

    if (yRight + modH > contentBottomLimit) {
      yRight = startNewModulosPage()
    }

    const modX = onExtraPage ? margin : colRight
    const modWd = onExtraPage ? pageWidth - margin * 2 : colW

    doc.setFillColor(
      Math.round(pr * 0.12 + 255 * 0.88),
      Math.round(pg * 0.12 + 255 * 0.88),
      Math.round(pb * 0.12 + 255 * 0.88)
    )
    doc.roundedRect(modX, yRight, modWd, modH, 1, 1, 'F')
    doc.setFontSize(T.sectionTitle)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pr, pg, pb)
    doc.text(modLines, modX + 4, yRight + 4.5)
    yRight += modH + 2

    for (const leccion of modulo.lecciones) {
      const lecTxt = `${modulo.orden + 1}.${leccion.orden + 1}  ${leccion.titulo}`
      const lecLines = doc.splitTextToSize(lecTxt, modWd - 14)
      const lecH = lecLines.length * 4 + 1.5

      if (yRight + lecH > contentBottomLimit) {
        yRight = startNewModulosPage()
      }

      doc.setFillColor(pr, pg, pb)
      doc.circle(modX + 4, yRight + 1.5, 0.9, 'F')
      doc.setFontSize(T.body)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(lecLines, modX + 7, yRight + 2.5)
      yRight += lecH
    }

    yRight += 3
  }

  // Pie de página 2
  const footerTopY = pageHeight - 20

  doc.setFillColor(245, 245, 245)
  doc.rect(0, footerTopY, pageWidth, 20, 'F')
  doc.setDrawColor(pr, pg, pb)
  doc.setLineWidth(0.4)
  doc.line(0, footerTopY, pageWidth, footerTopY)

  if (disclaimer) {
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2 - 60)

    doc.setFontSize(T.small)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(disclaimerLines, margin, footerTopY + 5)
  }

  if (institutionUrl) {
    doc.setFontSize(T.small)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pr, pg, pb)
    doc.text(institutionUrl, pageWidth - margin, footerTopY + 5, { align: 'right' })
  }

  return doc.output('arraybuffer')
}
