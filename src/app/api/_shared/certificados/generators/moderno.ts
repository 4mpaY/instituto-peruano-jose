import { fetchImageBuffer, formatDateLong, resolveLogoDimensions } from './utils'

import type { GeneratorFn } from './types'

/**
 * Plantilla MODERNA — Dark mode, fondo oscuro, acento de color primario.
 * Ideal para academias tech / startups. Solo página 1 (compacta).
 */
export const generarModerno: GeneratorFn = async data => {
  const {
    pr,
    pg,
    pb,
    logoBuffer,
    logoUrl,
    base64Logo,
    nombreInstitucion,
    slogan,
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
    disclaimer,
    institutionUrl,
    previewFlag
  } = data

  void previewFlag
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // Paleta dark
  const BG: [number, number, number] = [15, 23, 42] // #0f172a
  const SURFACE: [number, number, number] = [30, 41, 59] // #1e293b
  const TEXT: [number, number, number] = [226, 232, 240] // #e2e8f0
  const MUTED: [number, number, number] = [100, 116, 139] // #64748b

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

          doc.addImage(buf, ext.toUpperCase(), x - 15, lineY - 26, 30, 26)
        }
      } catch {
        /* skip */
      }
    }

    doc.setDrawColor(pr, pg, pb)
    doc.setLineWidth(0.6)
    doc.line(x - 35, lineY, x + 35, lineY)
    const name = `${user.nombre || ''} ${user.apellido || ''}`.trim()

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...TEXT)
    doc.text(name, x, lineY + 5, { align: 'center' })

    if (user.cargo) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...MUTED)
      doc.text(user.cargo, x, lineY + 10, { align: 'center' })
    }
  }

  // ── PÁGINA 1 ─────────────────────────────────────────────────────────

  // Fondo oscuro completo
  doc.setFillColor(...BG)
  doc.rect(0, 0, W, H, 'F')

  // Franja lateral izquierda de color primario (glow effect con strips)
  const accentW = 8

  for (let i = 0; i < 20; i++) {
    const alpha = 1 - i / 20
    const r = Math.round(pr + (BG[0] - pr) * (1 - alpha))
    const g = Math.round(pg + (BG[1] - pg) * (1 - alpha))
    const b = Math.round(pb + (BG[2] - pb) * (1 - alpha))

    doc.setFillColor(r, g, b)
    doc.rect(accentW + i * 3, 0, 3, H, 'F')
  }

  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, accentW, H, 'F')

  // Panel de contenido (surface)
  doc.setFillColor(...SURFACE)
  doc.roundedRect(accentW + 62, 0, W - accentW - 62, H, 0, 0, 'F')

  // Área izquierda: logo + QR + institución
  const leftCx = accentW + 30
  const { w: lw, h: lh } = await resolveLogoDimensions(logoBuffer, 42, 18)

  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext, leftCx - lw / 2, 12, lw, lh)
    } catch {
      /* skip */
    }
  }

  // Nombre institución
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(nombreInstitucion.toUpperCase(), leftCx, 12 + lh + 6, { align: 'center' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(slogan, leftCx, 12 + lh + 12, { align: 'center' })

  // Línea separadora
  doc.setDrawColor(pr, pg, pb)
  doc.setLineWidth(0.3)
  doc.line(accentW + 4, 12 + lh + 16, accentW + 56, 12 + lh + 16)

  // QR centrado en panel izquierdo
  const qrSz = 28
  const qrX = leftCx - qrSz / 2
  const qrY = H - qrSz - 22

  doc.setFillColor(255, 255, 255)
  doc.roundedRect(qrX - 2, qrY - 2, qrSz + 4, qrSz + 4, 2, 2, 'F')
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSz, qrSz)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text('VERIFICAR', leftCx, qrY + qrSz + 7, { align: 'center' })

  // Código vertical a lo largo del acento
  doc.setFontSize(5)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.text(codigoVerificacion, accentW / 2, H / 2, { angle: 90, align: 'center' })

  // ── Área de contenido derecha ──
  const contentX = accentW + 68
  const contentW = W - contentX - 12
  const ccx = contentX + contentW / 2

  let y = 16

  // Badge "CERTIFICADO"
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(ccx - 28, y, 56, 7, 3, 3, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('CERTIFICADO DE FINALIZACIÓN', ccx, y + 5, { align: 'center' })
  y += 13

  // Nombre del alumno — muy grande
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...TEXT)
  const nameLines = doc.splitTextToSize(nombreCompleto.toUpperCase(), contentW)

  doc.text(nameLines, ccx, y, { align: 'center' })
  y += nameLines.length * 9 + 2

  // Línea de acento bajo el nombre
  doc.setDrawColor(pr, pg, pb)
  doc.setLineWidth(1.2)
  doc.line(ccx - 40, y, ccx + 40, y)
  y += 6

  // Subtítulo
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text('ha completado satisfactoriamente el programa:', ccx, y, { align: 'center' })
  y += 7

  // Título del curso
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  const cursoL = doc.splitTextToSize(cursoTitulo, contentW - 10)

  doc.text(cursoL, ccx, y, { align: 'center' })
  y += cursoL.length * 6 + 4

  // Detalles: duración, fechas en chips
  const chips = [
    { label: 'DURACIÓN', value: cursoDuracion || '---' },
    { label: 'INICIO', value: formatDateLong(fechaInicioVal) },
    { label: 'CULMINACIÓN', value: formatDateLong(fechaFinVal) }
  ]

  const chipW = (contentW - 8) / chips.length

  chips.forEach((chip, i) => {
    const cx2 = contentX + chipW * i + chipW / 2 + (i > 0 ? 4 : 0)

    doc.setFillColor(
      Math.round(pr * 0.15 + BG[0] * 0.85),
      Math.round(pg * 0.15 + BG[1] * 0.85),
      Math.round(pb * 0.15 + BG[2] * 0.85)
    )
    doc.roundedRect(contentX + chipW * i + (i > 0 ? 4 : 0), y, chipW - 2, 12, 2, 2, 'F')
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pr, pg, pb)
    doc.text(chip.label, cx2, y + 4.5, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...TEXT)
    doc.text(chip.value, cx2, y + 9.5, { align: 'center' })
  })
  y += 16

  // "Firmado el..."
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(`Lima, ${fechaFirmadaTxt}`, ccx, y, { align: 'center' })
  y += 12

  // Firmas
  const hasGerente = gerenteGeneral !== null

  if (hasGerente && mostrarFirmaDocente) {
    await addSignatureBlock(contentX + contentW / 4, y + 20, gerenteGeneral)
    await addSignatureBlock(contentX + (contentW * 3) / 4, y + 20, profesorSnapshot)
  } else if (hasGerente) {
    await addSignatureBlock(ccx, y + 20, gerenteGeneral)
  } else if (mostrarFirmaDocente) {
    await addSignatureBlock(ccx, y + 20, profesorSnapshot)
  }

  // Footer (línea inferior)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(`Código: ${codigoVerificacion}`, 16, H - 6)
  doc.text(
    `Vigencia de acceso: ${vigenciaHastaVal ? formatDateLong(vigenciaHastaVal) : 'sin caducidad'}`,
    W - 16,
    H - 6,
    { align: 'right' }
  )
  doc.text(`Emitido por ${nombreInstitucion} · ${institutionUrl || ''}`, ccx, H - 10, { align: 'center' })
  void disclaimer

  // ── PÁGINA 2 (Rendimiento + Contenido) ───────────────────────────────
  doc.addPage()
  doc.setFillColor(...BG)
  doc.rect(0, 0, W, H, 'F')
  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, accentW, H, 'F')
  doc.setFillColor(...SURFACE)
  doc.rect(accentW, 0, W - accentW, H, 'F')

  // Banda superior
  doc.setFillColor(pr, pg, pb)
  doc.rect(accentW, 0, W - accentW, 12, 'F')

  if (base64Logo) {
    try {
      const ext2 = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'
      const { w: lw2, h: lh2 } = await resolveLogoDimensions(logoBuffer, 28, 8)

      doc.addImage(base64Logo, ext2, accentW + 4, (12 - lh2) / 2, lw2, lh2)
    } catch {
      /* skip */
    }
  }

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(nombreInstitucion.toUpperCase(), W - 8, 7.5, { align: 'right' })

  const pm = 14
  const p2Y = 18
  const cW2 = (W - accentW - pm * 2 - 8) / 2
  const cL = accentW + pm
  const cR = cL + cW2 + 8

  const T = { h: 8, b: 7, s: 6, sc: 18 }

  // Col izquierda
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(cL, p2Y, cW2, 7, 1.5, 1.5, 'F')
  doc.setFontSize(T.h)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('RENDIMIENTO', cL + cW2 / 2, p2Y + 5, { align: 'center' })

  let yL = p2Y + 11

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
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text('Promedio Final', cL + cW2 / 2, yL + 13, { align: 'center' })
  yL += 18

  const bw = cW2 - 12

  doc.setFillColor(30, 41, 59)
  doc.roundedRect(cL + 6, yL, bw, 3, 1.5, 1.5, 'F')
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(cL + 6, yL, bw * pct, 3, 1.5, 1.5, 'F')
  doc.setFontSize(T.s)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(`${Math.round(pct * 100)}%`, cL + 6 + bw + 1.5, yL + 2.5)
  yL += 8

  for (const mod of modulos.filter(m => notasPorModulo[m.id])) {
    if (yL > H - 12) break
    const e = notasPorModulo[mod.id]
    const pm2 = (e.puntaje / e.count > 20 ? e.puntaje / e.count / 5 : e.puntaje / e.count).toFixed(1)
    const tl = doc.splitTextToSize(mod.titulo, cW2 - 18)

    doc.setFontSize(T.s)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...TEXT)
    doc.text(tl, cL + 3, yL)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pr, pg, pb)
    doc.text(pm2, cL + cW2 - 3, yL, { align: 'right' })
    yL += tl.length * 3.5 + 1.5
  }

  // Col derecha: Contenido
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(cR, p2Y, cW2, 7, 1.5, 1.5, 'F')
  doc.setFontSize(T.h)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('CONTENIDO DEL PROGRAMA', cR + cW2 / 2, p2Y + 5, { align: 'center' })

  let yR = p2Y + 11

  for (const mod of modulos) {
    const mt = `${mod.orden + 1}. ${mod.titulo}`.toUpperCase()
    const ml = doc.splitTextToSize(mt, cW2 - 8)
    const mh = ml.length * 3.5 + 3

    if (yR + mh > H - 10) break
    doc.setFillColor(
      Math.round(pr * 0.3 + BG[0] * 0.7),
      Math.round(pg * 0.3 + BG[1] * 0.7),
      Math.round(pb * 0.3 + BG[2] * 0.7)
    )
    doc.roundedRect(cR, yR, cW2, mh, 1, 1, 'F')
    doc.setFontSize(T.h)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pr, pg, pb)
    doc.text(ml, cR + 3, yR + 3)
    yR += mh + 1

    for (const lec of mod.lecciones) {
      const ll = doc.splitTextToSize(`${mod.orden + 1}.${lec.orden + 1} ${lec.titulo}`, cW2 - 12)
      const lh = ll.length * 3 + 1

      if (yR + lh > H - 10) break
      doc.setFillColor(pr, pg, pb)
      doc.circle(cR + 3.5, yR + 1.5, 0.7, 'F')
      doc.setFontSize(T.s)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...TEXT)
      doc.text(ll, cR + 6, yR + 2.5)
      yR += lh
    }

    yR += 2
  }

  doc.setFontSize(T.s)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(`Código: ${codigoVerificacion}`, cL, H - 5)

  return doc.output('arraybuffer')
}
