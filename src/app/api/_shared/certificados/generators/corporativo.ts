import type { GeneratorFn } from './types'
import { fetchImageBuffer, formatDateLong, resolveLogoDimensions } from './utils'

/**
 * Plantilla CORPORATIVA — Diseño formal para empresas B2B.
 * Fondo blanco con borde superior grueso de color primario,
 * franja dorada de acento, tipografía seria. 2 páginas.
 */
export const generarCorporativo: GeneratorFn = async data => {
  const {
    pr,
    pg,
    pb,
    logoBuffer,
    logoUrl,
    base64Logo,
    nombreInstitucion,
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
  const W = doc.internal.pageSize.getWidth() // 297mm
  const H = doc.internal.pageSize.getHeight() // 210mm
  const cx = W / 2
  const margin = 20

  // Dorado corporativo
  const gold = [180, 145, 60] as [number, number, number]

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

          doc.addImage(buf, ext.toUpperCase(), x - 17, lineY - 30, 34, 30)
        }
      } catch {
        /* skip */
      }
    }

    doc.setDrawColor(...gold)
    doc.setLineWidth(0.6)
    doc.line(x - 40, lineY, x + 40, lineY)
    const name = `${user.nombre || ''} ${user.apellido || ''}`.trim()

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 20, 20)
    doc.text(name, x, lineY + 6, { align: 'center' })

    if (user.cargo) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(user.cargo, x, lineY + 11, { align: 'center' })
    }
  }

  // ── PÁGINA 1 ─────────────────────────────────────────────────────────

  // Fondo blanco
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, W, H, 'F')

  // Borde superior color primario (14mm)
  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, W, 14, 'F')

  // Línea dorada bajo el borde
  doc.setFillColor(...gold)
  doc.rect(0, 14, W, 2.5, 'F')

  // Borde inferior
  doc.setFillColor(pr, pg, pb)
  doc.rect(0, H - 10, W, 10, 'F')
  doc.setFillColor(...gold)
  doc.rect(0, H - 10, W, 1.5, 'F')

  // Bordes laterales delgados
  doc.setFillColor(...gold)
  doc.rect(0, 14, 2, H - 24, 'F')
  doc.rect(W - 2, 14, 2, H - 24, 'F')

  // Logo en banda superior (alineado a la izquierda)
  const { w: lw, h: lh } = await resolveLogoDimensions(logoBuffer, 40, 10)

  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext, 8, (14 - lh) / 2, lw, lh)
    } catch {
      /* skip */
    }
  }

  // Nombre institución en banda
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(nombreInstitucion.toUpperCase(), W - margin, 9, { align: 'right' })

  // Área de contenido
  let y = 24

  // Ornamento superior central (líneas doradas simétricas)
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.5)
  doc.line(cx - 60, y, cx - 6, y)
  doc.line(cx + 6, y, cx + 60, y)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gold)
  doc.text('✦', cx, y + 1, { align: 'center' })
  y += 6

  // "CERTIFICADO DE FINALIZACIÓN"
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('CERTIFICADO DE FINALIZACIÓN', cx, y, { align: 'center' })
  y += 8

  // Nombre del alumno — grande y prominente
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(nombreCompleto, cx, y, { align: 'center' })
  y += 4

  // Línea dorada bajo el nombre
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.8)
  const nameW = doc.getTextWidth(nombreCompleto)

  doc.line(cx - Math.min(nameW / 2, 80), y, cx + Math.min(nameW / 2, 80), y)
  y += 8

  // Texto "Ha culminado satisfactoriamente..."
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('Ha culminado satisfactoriamente el programa de formación especializada:', cx, y, { align: 'center' })
  y += 8

  // Título del curso
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  const cursoLines = doc.splitTextToSize(cursoTitulo, W - 80)

  doc.text(cursoLines, cx, y, { align: 'center' })
  y += cursoLines.length * 7 + 5

  // Descripción breve
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const desc = `Con una duración de ${cursoDuracion || '---'}, realizado desde el ${formatDateLong(fechaInicioVal)} hasta el ${formatDateLong(fechaFinVal)}.`
  const descLines = doc.splitTextToSize(`Emitido por ${nombreInstitucion}. ${desc}`, W - 80)

  doc.text(descLines, cx, y, { align: 'center' })
  y += descLines.length * 5 + 5

  // "APROBADO" con ornamentos
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...gold)
  doc.text('APROBADO', cx, y, { align: 'center' })
  y += 5

  // Ornamento inferior
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.5)
  doc.line(cx - 60, y, cx - 6, y)
  doc.line(cx + 6, y, cx + 60, y)
  y += 4

  // "Lima, a..."
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Lima, a ${fechaFirmadaTxt}.`, cx, y, { align: 'center' })
  y += 14

  // Firmas
  const hasGerente = gerenteGeneral !== null

  if (hasGerente && mostrarFirmaDocente) {
    await addSignatureBlock(cx - 60, y + 24, gerenteGeneral)
    await addSignatureBlock(cx + 60, y + 24, profesorSnapshot)
  } else if (hasGerente) {
    await addSignatureBlock(cx, y + 24, gerenteGeneral)
  } else if (mostrarFirmaDocente) {
    await addSignatureBlock(cx, y + 24, profesorSnapshot)
  }

  // QR esquina inferior derecha (sobre la banda inferior)
  const qrSz = 22

  doc.setFillColor(255, 255, 255)
  doc.roundedRect(W - qrSz - 12, H - qrSz - 14, qrSz + 4, qrSz + 4, 1, 1, 'F')
  doc.addImage(qrDataUrl, 'PNG', W - qrSz - 10, H - qrSz - 12, qrSz, qrSz)

  // Footer sobre banda inferior
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 200)
  doc.text(`Código: ${codigoVerificacion}`, margin, H - 4)
  doc.text(`Emitido: ${fechaFirmadaTxt}`, W / 2, H - 4, { align: 'center' })

  // Vigencia a la derecha, misma altura que el código
  doc.text(
    `Vigencia de acceso: ${vigenciaHastaVal ? formatDateLong(vigenciaHastaVal) : 'sin caducidad'}`,
    W - margin,
    H - 4,
    { align: 'right' }
  )
  if (institutionUrl) doc.text(institutionUrl, W - margin - qrSz - 14, H - 4, { align: 'right' })

  // ── PÁGINA 2 ─────────────────────────────────────────────────────────
  doc.addPage()
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, W, H, 'F')
  doc.setFillColor(pr, pg, pb)
  doc.rect(0, 0, W, 12, 'F')
  doc.setFillColor(...gold)
  doc.rect(0, 12, W, 2, 'F')
  doc.setFillColor(pr, pg, pb)
  doc.rect(0, H - 8, W, 8, 'F')
  doc.setFillColor(...gold)
  doc.rect(0, H - 8, W, 1.2, 'F')

  // Header banda
  if (base64Logo) {
    try {
      const ext = logoUrl.split('.').pop()?.split('?')[0]?.toUpperCase() ?? 'PNG'

      doc.addImage(base64Logo, ext, 8, (12 - lh) / 2, lw, lh)
    } catch {
      /* skip */
    }
  }

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(nombreInstitucion.toUpperCase(), W - 12, 7, { align: 'right' })

  const p2margin = 12
  const p2Y = 20
  const colW2 = (W - p2margin * 2 - 8) / 2
  const colL = p2margin
  const colR = p2margin + colW2 + 8

  const T = { hdr: 9, body: 8, small: 7, score: 20 }

  // Col izq: Rendimiento
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(colL, p2Y, colW2, 7, 1, 1, 'F')
  doc.setFontSize(T.hdr)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('RENDIMIENTO ACADÉMICO', colL + colW2 / 2, p2Y + 5, { align: 'center' })

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

  doc.setFontSize(T.score)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(nd, colL + colW2 / 2, yL + 8, { align: 'center' })
  doc.setFontSize(T.small)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text('/ 20.00', colL + colW2 / 2 + 8, yL + 8)
  doc.setFontSize(T.body)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Promedio Ponderado', colL + colW2 / 2, yL + 14, { align: 'center' })
  yL += 20

  // Barra
  const bw = colW2 - 14

  doc.setFillColor(230, 230, 230)
  doc.roundedRect(colL + 7, yL, bw, 3.5, 1.5, 1.5, 'F')
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(colL + 7, yL, bw * pct, 3.5, 1.5, 1.5, 'F')
  doc.setFontSize(T.small)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(pr, pg, pb)
  doc.text(`${Math.round(pct * 100)}%`, colL + 7 + bw + 2, yL + 3)
  yL += 9

  const modsConNota = modulos.filter(m => notasPorModulo[m.id])

  if (modsConNota.length > 0) {
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.line(colL + 3, yL, colL + colW2 - 3, yL)
    yL += 4
    doc.setFontSize(T.body)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(70, 70, 70)
    doc.text('Calificaciones por Módulo', colL + 3, yL)
    yL += 5

    for (const mod of modsConNota) {
      if (yL > H - 20) break
      const entry = notasPorModulo[mod.id]
      const rm = entry.puntaje / entry.count
      const pm = (rm > 20 ? rm / 5 : rm).toFixed(1)
      const tl = doc.splitTextToSize(mod.titulo, colW2 - 20)

      doc.setFontSize(T.small)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(tl, colL + 3, yL)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...gold)
      doc.text(pm, colL + colW2 - 3, yL, { align: 'right' })
      yL += tl.length * 4 + 1.5
    }
  }

  // Col der: Contenido del programa
  doc.setFillColor(pr, pg, pb)
  doc.roundedRect(colR, p2Y, colW2, 7, 1, 1, 'F')
  doc.setFontSize(T.hdr)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('CONTENIDO DEL PROGRAMA', colR + colW2 / 2, p2Y + 5, { align: 'center' })

  let yR = p2Y + 11
  const btmLimit = H - 16

  for (const mod of modulos) {
    const mt = `${mod.orden + 1}. ${mod.titulo}`.toUpperCase()
    const ml = doc.splitTextToSize(mt, colW2 - 8)
    const mh = ml.length * 4 + 3

    if (yR + mh > btmLimit) break

    doc.setFillColor(
      Math.round(pr * 0.1 + 255 * 0.9),
      Math.round(pg * 0.1 + 255 * 0.9),
      Math.round(pb * 0.1 + 255 * 0.9)
    )
    doc.roundedRect(colR, yR, colW2, mh, 1, 1, 'F')
    doc.setFontSize(T.hdr)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(pr, pg, pb)
    doc.text(ml, colR + 3, yR + 3.5)
    yR += mh + 1.5

    for (const lec of mod.lecciones) {
      const lt = `${mod.orden + 1}.${lec.orden + 1}  ${lec.titulo}`
      const ll = doc.splitTextToSize(lt, colW2 - 12)
      const lh = ll.length * 3.5 + 1

      if (yR + lh > btmLimit) break
      doc.setFillColor(...gold)
      doc.circle(colR + 3.5, yR + 1.5, 0.7, 'F')
      doc.setFontSize(T.small)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(ll, colR + 6.5, yR + 2.5)
      yR += lh
    }

    yR += 2
  }

  // Pie p2
  doc.setFontSize(T.small)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 200)
  doc.text(`Código: ${codigoVerificacion}`, p2margin, H - 3)
  if (disclaimer) doc.text(disclaimer.substring(0, 80), W / 2, H - 3, { align: 'center' })

  return doc.output('arraybuffer')
}
