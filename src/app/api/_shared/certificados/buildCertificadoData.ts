import * as QRCode from 'qrcode'

import { calcularFechaCaducidadCurso } from '@/utils/functions/calcularFechaCaducidadCurso'
import { hexToRgb, fetchImageBuffer, compressImageForPdf } from './generators/utils'
import type { CertificadoData } from './generators/types'

type CertificadoConRelaciones = {
  id: string
  codigo_verificacion: string
  emitido_en: Date
  usuario_id: string
  curso_id: string
  datos: unknown
  curso: {
    titulo: string
    duracion: string | null
    tipo_emision: string
    fecha_inicio: Date | null
    vigencia_meses?: number | null
    profesor: {
      nombre: string
      apellido: string
      cargo: string | null
      firma: string | null
    }
    modulos: Array<{
      id: string
      titulo: string
      orden: number
      lecciones: Array<{ id: string; titulo: string; orden: number; duracion: number | null }>
    }>
  }
  usuario: { nombre: string; apellido: string }
}

type IntentoData = {
  puntaje: number | null
  examen: { modulo_id: string | null; peso: number }
}

type BuildCertificadoDataOptions = {
  certificado: CertificadoConRelaciones
  configs: Record<string, string>
  inscripcion: {
    completado_en: Date | null
    inscrito_en: Date
    nota_final: number | null
    acceso_hasta?: Date | null
  } | null
  usuarioAvatar: string | null | undefined
  intentosExamen: IntentoData[]
  cursoFechaFin: Date | null
  reqUrl: URL
  previewFlag: boolean
}

/**
 * Construye el objeto CertificadoData a partir de los datos de BD y configuración.
 * Usado por ambas rutas (admin y estudiante) para eliminar duplicación.
 */
export async function buildCertificadoData(opts: BuildCertificadoDataOptions): Promise<CertificadoData> {
  const { certificado, configs, inscripcion, usuarioAvatar, intentosExamen, cursoFechaFin, reqUrl, previewFlag } = opts

  const snapshot = certificado.datos as any

  // ── Branding ──
  const colorPrimario = configs.PRIMARY_COLOR_MAIN ?? '#131FF2'
  const [pr, pg, pb] = hexToRgb(colorPrimario)
  const logoUrl = configs.TEMPLATE_LOGO || '/images/logo.png'
  const nombreInstitucion = configs.CERTIFICADO_INSTITUTION_NAME || configs.TEMPLATE_NAME || 'Aula Virtual'
  const slogan = configs.CERTIFICADO_SLOGAN || configs.TEMPLATE_SLOGAN || 'Capacitación Especializada'
  const disclaimer = configs.CERTIFICADO_DISCLAIMER || ''
  const institutionUrl = configs.CERTIFICADO_INSTITUTION_URL || ''

  // ── Alumno ──
  const nombreCompleto =
    snapshot?.usuario?.nombre && snapshot?.usuario?.apellido
      ? `${snapshot.usuario.nombre} ${snapshot.usuario.apellido}`
      : `${certificado.usuario.nombre} ${certificado.usuario.apellido}`

  // ── Curso ──
  const cursoTitulo = snapshot?.curso?.titulo || certificado.curso.titulo
  const cursoDuracion = snapshot?.curso?.duracion || certificado.curso.duracion
  const cursoModalidad = snapshot?.curso?.tipo_emision || certificado.curso.tipo_emision
  const cursoVigenciaMeses = snapshot?.curso?.vigencia_meses ?? certificado.curso.vigencia_meses ?? null

  // ── Fechas ──
  const esSincrono = certificado.curso.tipo_emision === 'SINCRONO'
  const fechaEmisionVal = snapshot?.fechas?.emision || certificado.emitido_en

  const fechaInicioVal =
    snapshot?.fechas?.inicio_curso ||
    (esSincrono ? certificado.curso.fecha_inicio : inscripcion?.inscrito_en || certificado.emitido_en)

  const fechaFinVal =
    snapshot?.fechas?.culminacion ||
    (esSincrono ? cursoFechaFin || certificado.emitido_en : inscripcion?.completado_en || certificado.emitido_en)

  const vigenciaHastaVal =
    snapshot?.fechas?.vigencia_hasta ||
    inscripcion?.acceso_hasta ||
    (inscripcion?.inscrito_en ? calcularFechaCaducidadCurso(inscripcion.inscrito_en, cursoVigenciaMeses) : null)

  // ── Firmas ──
  const profesorSnapshot = snapshot?.profesor || certificado.curso.profesor
  const mostrarFirmaDocente = configs.CERTIFICADO_MOSTRAR_FIRMA_DOCENTE !== 'false'

  // ── QR ──
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${reqUrl.protocol}//${reqUrl.host}`
  const verifyUrl = `${appUrl}/verificar-certificado/${certificado.codigo_verificacion}`

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 120,
    margin: 1,
    color: { dark: colorPrimario, light: '#ffffff' }
  })

  // ── Imágenes (comprimidas para reducir peso del PDF) ──
  const logoBuffer = await fetchImageBuffer(logoUrl)
  let base64Logo: string | null = null

  if (logoBuffer) {
    try {
      const { default: sharp } = await import('sharp')
      const meta = await sharp(logoBuffer).metadata()
      const logoFormat: 'png' | 'jpeg' = meta.hasAlpha ? 'png' : 'jpeg'
      const { buffer: compressedLogo, mimeType } = await compressImageForPdf(logoBuffer, { maxWidth: 400, format: logoFormat, quality: 85 })

      base64Logo = `data:${mimeType};base64,${compressedLogo.toString('base64')}`
    } catch {
      /* skip */
    }
  }

  const rawAvatarBuffer = usuarioAvatar ? await fetchImageBuffer(usuarioAvatar) : null
  let avatarBuffer: Buffer | null = null

  if (rawAvatarBuffer) {
    try {
      const { buffer: compressedAvatar } = await compressImageForPdf(rawAvatarBuffer, { maxWidth: 150, format: 'jpeg', quality: 78 })

      avatarBuffer = compressedAvatar
    } catch {
      avatarBuffer = rawAvatarBuffer
    }
  }

  // ── Rendimiento: calcula notas por módulo ──
  const notasPorModulo: Record<string, { puntaje: number; count: number }> = {}

  for (const intento of intentosExamen) {
    const mid = intento.examen.modulo_id!

    if (!notasPorModulo[mid]) notasPorModulo[mid] = { puntaje: 0, count: 0 }
    notasPorModulo[mid].puntaje += intento.puntaje ?? 0
    notasPorModulo[mid].count += 1
  }

  return {
    colorPrimario,
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
    cursoModalidad,

    // se usa como respaldo para certificados antiguos o inscripciones previas a la migración
    modulos: certificado.curso.modulos,
    fechaEmisionVal,
    fechaInicioVal,
    fechaFinVal,
    vigenciaHastaVal,
    gerenteGeneral: null, // se inyecta por la ruta (requiere query adicional)
    profesorSnapshot,
    mostrarFirmaDocente,
    codigoVerificacion: certificado.codigo_verificacion,
    qrDataUrl,
    notaFinal: null, // calculado dentro de cada generador desde notasPorModulo
    notasPorModulo,
    intentosExamen,
    notaInscripcion: snapshot?.nota_final ?? inscripcion?.nota_final ?? null,
    previewFlag
  }
}
