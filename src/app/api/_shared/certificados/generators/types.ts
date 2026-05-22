/**
 * Datos del firmante (gerente general o docente)
 */
export interface SignatarioData {
  nombre: string
  apellido?: string
  cargo?: string | null
  firma?: string | null
}

/**
 * Datos de una lección dentro de un módulo
 */
export interface LeccionData {
  id: string
  titulo: string
  orden: number
  duracion?: number | null
}

/**
 * Datos de un módulo del curso
 */
export interface ModuloData {
  id: string
  titulo: string
  orden: number
  lecciones: LeccionData[]
}

/**
 * Objeto completo que recibe cualquier generador de certificado.
 * Las rutas de descarga (admin y estudiante) construyen este objeto
 * y lo pasan al generador seleccionado por la configuración CERTIFICADO_PLANTILLA.
 */
export interface CertificadoData {

  // ── Branding ──
  colorPrimario: string          // hex, ej: '#131FF2'
  pr: number                     // R del color primario (0-255)
  pg: number                     // G del color primario (0-255)
  pb: number                     // B del color primario (0-255)
  logoBuffer: Buffer | null
  logoUrl: string
  base64Logo: string | null
  nombreInstitucion: string
  slogan: string
  disclaimer: string
  institutionUrl: string

  // ── Alumno ──
  nombreCompleto: string
  avatarBuffer: Buffer | null

  // ── Curso ──
  cursoTitulo: string
  cursoDuracion: string | null
  cursoModalidad: string
  modulos: ModuloData[]

  // ── Fechas (ya formateadas para render) ──
  fechaEmisionVal: Date | string
  fechaInicioVal: Date | string | null
  fechaFinVal: Date | string | null

  // ── Firmas ──
  gerenteGeneral: SignatarioData | null
  profesorSnapshot: SignatarioData | null
  mostrarFirmaDocente: boolean

  // ── Verificación ──
  codigoVerificacion: string
  qrDataUrl: string

  // ── Rendimiento ──
  notaFinal: number | null
  notasPorModulo: Record<string, { puntaje: number; count: number }>
  intentosExamen: Array<{
    puntaje: number | null
    examen: { modulo_id: string | null; peso: number }
  }>
  notaInscripcion: number | null

  // ── Flags ──
  previewFlag: boolean
}

/**
 * Tipo de función que genera el PDF y devuelve el ArrayBuffer.
 */
export type GeneratorFn = (data: CertificadoData) => Promise<ArrayBuffer>
