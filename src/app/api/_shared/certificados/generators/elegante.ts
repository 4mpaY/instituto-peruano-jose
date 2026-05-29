import { fetchImageBuffer, formatDateLong, resolveLogoDimensions } from './utils'

import type { GeneratorFn } from './types'

/**
 * Plantilla ELEGANTE — Fondo crema/ivory, bordes ornamentales, paleta sobria.
 * Estilo clásico universitario. 2 páginas.
 */
export const generarElegante: GeneratorFn = async data => {
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
    cursoTitulo,
    cursoDuracion,
    fechaEmisionVal,
    fechaInicioVal,
    fechaFinVal,
    vigenciaHastaVal,
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

  void previewFlag
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const cx = W / 2

  // Paleta elegante
  const IVORY: [number, number, number] = [252, 249, 240]
  const DARK: [number, number, number] = [30, 25, 20]
  const GOLD: [number, number, number] = [168, 133, 55]
  const MUTED: [number, number, number] = [110, 100, 85]

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
        const buf = await fetchImageBuffer(user.firma)

        if (buf) {
          const ext = user.firma.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'png'

          doc.addImage(buf, ext.toUpperCase(), x - 16, lineY - 28, 32, 28)
        }
      } catch {
        /* skip */
      }
    }

    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.5)
    doc.line(x - 38, lineY, x + 38, lineY)
    const name = `${user.nombre || ''} ${user.apellido || ''}`.trim()

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text(name, x, lineY + 6, { align: 'center' })

    if (user.cargo) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...MUTED)
      doc.text(user.cargo, x, lineY + 11, { align: 'center' })
    }
  }

  // Función que dibuja borde ornamental
  const drawBorder = () => {
    const pad = 6

    // Marco exterior color primario
    doc.setDrawColor(pr, pg, pb)
    doc.setLineWidth(2.5)
    doc.rect(pad, pad, W - pad * 2, H - pad * 2)

    // Marco dorado interior
    doc.rect(pad + 3.5, pad + 3.5, W - (pad + 3.5) * 2, H - (pad + 3.5) * 2)

    // Marco fino interior
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.3)
    doc.rect(pad + 5.5, pad + 5.5, W - (pad + 5.5) * 2, H - (pad + 5.5) * 2)

    // Esquinas ornamentales (pequeños cuadros)
    const corners = [
      [pad + 2, pad + 2],
      [W - pad - 4, pad + 2],
      [pad + 2, H - pad - 4],
      [W - pad - 4, H - pad - 4]
    ] as [number, number][]

    doc.setFillColor(...GOLD)
    corners.forEach(([cx2, cy2]) => doc.rect(cx2 - 1, cy2 - 1, 2, 2, 'F'))
  }

  // ── PÁGINA 1 ─────────────────────────────────────────────────────────

  // Fondo ivory
  doc.setFillColor(...IVORY)
  doc.rect(0, 0, W, H, 'F')
  drawBorder()

  let y = 18

  // Logo centrado
  const { w: lw, h: lh } = await resolveLogoDimensions(logoBuffer, 44, 18)

  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext, cx - lw / 2, y, lw, lh)
    } catch {
      /* skip */
    }
  }

  y += lh + 4

  // Nombre institución
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(nombreInstitucion.toUpperCase(), cx, y, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...MUTED)
  doc.text(slogan, cx, y + 5, { align: 'center' })
  y += 10

  // Separador ornamental
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.4)
  doc.line(cx - 50, y, cx - 5, y)
  doc.line(cx + 5, y, cx + 50, y)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GOLD)
  doc.text('❖', cx, y + 1.5, { align: 'center' })
  y += 8

  // "LA PRESENTE INSTITUCIÓN CERTIFICA QUE:"
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text('LA PRESENTE INSTITUCIÓN CERTIFICA QUE:', cx, y, { align: 'center' })
  y += 8

  // Nombre del alumno — muy prominente
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(nombreCompleto, cx, y, { align: 'center' })
  y += 4

  // Subrayado dorado decorativo bajo el nombre
  const nLen = Math.min(doc.getTextWidth(nombreCompleto), 160)

  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1)
  doc.line(cx - nLen / 2, y, cx + nLen / 2, y)
  doc.setLineWidth(0.3)
  doc.line(cx - nLen / 2 + 4, y + 2, cx + nLen / 2 - 4, y + 2)
  y += 8

  // Texto formal
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK)
  const texto1 = 'Ha culminado satisfactoriamente el programa de capacitación especializada denominado:'

  doc.text(doc.splitTextToSize(texto1, W - 80), cx, y, { align: 'center' })
  y += 8

  // Título del curso — prominente
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  const cursoL = doc.splitTextToSize(`"${cursoTitulo}"`, W - 80)

  doc.text(cursoL, cx, y, { align: 'center' })
  y += cursoL.length * 7 + 4

  // Detalles
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...MUTED)
  const vigenciaTxt = vigenciaHastaVal ? formatDateLong(vigenciaHastaVal) : 'sin caducidad'
  const detalle = `Con una duración de ${cursoDuracion || '---'}, impartido desde el ${formatDateLong(fechaInicioVal)} hasta el ${formatDateLong(fechaFinVal)}, obteniendo la calificación de:`
  const detalleLines = doc.splitTextToSize(detalle, W - 80)

  doc.text(detalleLines, cx, y, { align: 'center' })
  y += detalleLines.length * 5 + 4

  // APROBADO ornamentado
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GOLD)
  doc.text('APROBADO', cx, y, { align: 'center' })
  const aW = doc.getTextWidth('APROBADO')

  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.4)
  doc.line(cx - aW / 2 - 12, y - 1.5, cx - aW / 2 - 3, y - 1.5)
  doc.line(cx + aW / 2 + 3, y - 1.5, cx + aW / 2 + 12, y - 1.5)
  y += 5

  // Fecha
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(`Otorgado en la ciudad de Lima, a ${fechaFirmadaTxt}.`, cx, y, { align: 'center' })
  y += 12

  // Firmas
  const hasGerente = gerenteGeneral !== null

  if (hasGerente && mostrarFirmaDocente) {
    await addSignatureBlock(cx - 62, y + 24, gerenteGeneral)
    await addSignatureBlock(cx + 62, y + 24, profesorSnapshot)
  } else if (hasGerente) {
    await addSignatureBlock(cx, y + 24, gerenteGeneral)
  } else if (mostrarFirmaDocente) {
    await addSignatureBlock(cx, y + 24, profesorSnapshot)
  }

  // QR esquina inferior derecha
  const qrSz = 22
  const qrX = W - qrSz - 15
  const qrY = H - qrSz - 14

  doc.setFillColor(255, 255, 255)
  doc.roundedRect(qrX - 2, qrY - 2, qrSz + 4, qrSz + 4, 1, 1, 'F')
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSz, qrSz)

  // Código de verificación (pie)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(`Código de Verificación: ${codigoVerificacion}`, 16, H - 10)
  doc.text(`Emisión: ${fechaFirmadaTxt}`, 16, H - 6)
  doc.text(`Vigencia de acceso: ${vigenciaTxt}`, W - 16, H - 10, { align: 'right' })
  if (institutionUrl) doc.text(institutionUrl, W - qrSz - 20, H - 10, { align: 'right' })

  // ── PÁGINA 2 (Rendimiento + Contenido) ───────────────────────────────
  doc.addPage()
  doc.setFillColor(...IVORY)
  doc.rect(0, 0, W, H, 'F')
  drawBorder()

  // Banda superior sobria
  doc.setFillColor(pr, pg, pb)
  doc.rect(8.5, 8.5, W - 17, 13, 'F')
  const { w: lw2, h: lh2 } = await resolveLogoDimensions(logoBuffer, 30, 9)

  if (base64Logo) {
    try {
      const ext2 = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext2, 14, 8.5 + (13 - lh2) / 2, lw2, lh2)
    } catch {
      /* skip */
    }
  }

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(nombreInstitucion.toUpperCase(), W - 14, 14, { align: 'right' })
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text(`Código: ${codigoVerificacion}`, W - 14, 19.5, { align: 'right' })

  const pm = 14
  const p2Y = 28
  const cW2 = (W - pm * 2 - 8) / 2
  const cL = pm
  const cR = cL + cW2 + 8

  const T = { h: 8.5, b: 7.5, s: 6.5, sc: 20 }

  // Col izquierda: Rendimiento
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(cL, p2Y, cW2, 7.5, 1, 1, 'F')
  doc.setFontSize(T.h)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('RENDIMIENTO ACADÉMICO', cL + cW2 / 2, p2Y + 5.5, { align: 'center' })

  let yL = p2Y + 12

  const promedios = Object.values(notasPorModulo).map(e => {
    const r = e.puntaje / e.count

    return r > 20 ? r / 5 : r
  })

  const nf =
    promedios.length > 0
      ? promedios.reduce((a, b) => a + b, 0) / promedios.length
      : (() => {
          const r = notaInscripcion ?? null

          return r !== null ? (r > 20 ? r / 5 : r) : null
        })()

  const nd = nf !== null ? nf.toFixed(2) : '---'
  const pct = nf !== null ? Math.min(nf / 20, 1) : 0

  doc.setFontSize(T.sc)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(nd, cL + cW2 / 2, yL + 8, { align: 'center' })
  doc.setFontSize(T.s)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text('/ 20.00', cL + cW2 / 2 + 7, yL + 8)
  doc.setFontSize(T.b)
  doc.setTextColor(...MUTED)
  doc.text('Promedio Ponderado Final', cL + cW2 / 2, yL + 14, { align: 'center' })
  yL += 20

  const bw = cW2 - 14

  doc.setFillColor(220, 214, 200)
  doc.roundedRect(cL + 7, yL, bw, 3.5, 1.5, 1.5, 'F')
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(cL + 7, yL, bw * pct, 3.5, 1.5, 1.5, 'F')
  doc.setFontSize(T.s)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(`${Math.round(pct * 100)}%`, cL + 7 + bw + 2, yL + 3)
  yL += 9

  for (const mod of modulos.filter(m => notasPorModulo[m.id])) {
    if (yL > H - 16) break
    const e = notasPorModulo[mod.id]
    const pm2 = (e.puntaje / e.count > 20 ? e.puntaje / e.count / 5 : e.puntaje / e.count).toFixed(1)
    const tl = doc.splitTextToSize(mod.titulo, cW2 - 22)

    doc.setFontSize(T.b)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    doc.text(tl, cL + 4, yL)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GOLD)
    doc.text(pm2, cL + cW2 - 4, yL, { align: 'right' })
    doc.setDrawColor(200, 190, 170)
    doc.setLineWidth(0.1)
    doc.line(cL + 4 + doc.getTextWidth(tl[0]) + 2, yL + 0.5, cL + cW2 - 10, yL + 0.5)
    yL += tl.length * 4.5 + 2
  }

  // Col derecha: Contenido
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(cR, p2Y, cW2, 7.5, 1, 1, 'F')
  doc.setFontSize(T.h)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('CONTENIDO DEL PROGRAMA', cR + cW2 / 2, p2Y + 5.5, { align: 'center' })

  let yR = p2Y + 12

  for (const mod of modulos) {
    const mt = `${mod.orden + 1}. ${mod.titulo}`.toUpperCase()
    const ml = doc.splitTextToSize(mt, cW2 - 8)
    const mh = ml.length * 4 + 3.5

    if (yR + mh > H - 16) break
    doc.setFillColor(245, 240, 228)
    doc.roundedRect(cR, yR, cW2, mh, 1, 1, 'F')
    doc.setFillColor(...GOLD)
    doc.rect(cR, yR, 2, mh, 'F')
    doc.setFontSize(T.h)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pr, pg, pb)
    doc.text(ml, cR + 4.5, yR + 3.5)
    yR += mh + 1.5

    for (const lec of mod.lecciones) {
      const ll = doc.splitTextToSize(`${mod.orden + 1}.${lec.orden + 1}  ${lec.titulo}`, cW2 - 14)
      const lh = ll.length * 3.8 + 1

      if (yR + lh > H - 16) break
      doc.setFillColor(...GOLD)
      doc.circle(cR + 4, yR + 1.5, 0.7, 'F')
      doc.setFontSize(T.s)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK)
      doc.text(ll, cR + 7, yR + 2.5)
      yR += lh
    }

    yR += 2
  }

  // Pie p2
  doc.setFontSize(T.s)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...MUTED)
  if (disclaimer) doc.text(disclaimer.substring(0, 90), cL, H - 12)
  doc.text(`${nombreInstitucion} · ${institutionUrl || ''}`, W / 2, H - 12, { align: 'center' })

  return doc.output('arraybuffer')
}
