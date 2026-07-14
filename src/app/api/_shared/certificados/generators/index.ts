import type { GeneratorFn } from './types'
import { generarMinimalista } from './minimalista'
import { generarColegioIngenieros } from './colegio_ingenieros'

export const DISENOS_CERTIFICADO = {
  ipg: {
    id: 'ipg',
    nombre: 'IPG Ingenieros Perú',
    plantilla: 'minimalista',
  },
  colegio_ingenieros: {
    id: 'colegio_ingenieros',
    nombre: 'Colegio de Ingenieros',
    plantilla: 'colegio_ingenieros',
  },
} as const

export type DisenoCertificadoId = keyof typeof DISENOS_CERTIFICADO

export const PLANTILLAS = {
  minimalista: {
    id: 'minimalista',
    nombre: 'Minimalista',
    descripcion: 'Diseño limpio IPG con fondo blanco, gradiente y QR.',
    paginas: 2,
    thumbnail: '/images/plantillas-certificado/minimalista.png',
    diseño: 'ipg' as DisenoCertificadoId,
  },
  colegio_ingenieros: {
    id: 'colegio_ingenieros',
    nombre: 'Colegio de Ingenieros',
    descripcion: 'Alianza CIP + IPG con borde rojo, logos institucionales y temario detallado.',
    paginas: 2,
    thumbnail: '/images/plantillas-certificado/colegio_ingenieros.png',
    diseño: 'colegio_ingenieros' as DisenoCertificadoId,
  },
} as const

export type PlantillaId = keyof typeof PLANTILLAS

/**
 * Resuelve el diseño activo (IPG o Colegio de Ingenieros).
 */
export function resolveDisenoCertificado(configs: Record<string, string>): DisenoCertificadoId {
  const diseno = configs.CERTIFICADO_DISENO

  if (diseno && diseno in DISENOS_CERTIFICADO) return diseno as DisenoCertificadoId

  if (configs.CERTIFICADO_PLANTILLA === 'colegio_ingenieros') return 'colegio_ingenieros'

  return 'ipg'
}

/**
 * Resuelve la plantilla activa desde configuración (solo para UI de edición en admin).
 * No determina qué certificado descarga el estudiante; eso lo define la habilitación IPG/CID por inscripción.
 */
export function resolvePlantillaCertificado(configs: Record<string, string>): PlantillaId {
  const diseno = resolveDisenoCertificado(configs)
  const plantilla = DISENOS_CERTIFICADO[diseno].plantilla

  if (plantilla in PLANTILLAS) return plantilla as PlantillaId

  return 'minimalista'
}

/**
 * Resuelve qué plantilla PDF generar al descargar.
 * Prioridad: query param > habilitación por inscripción > IPG por defecto (cursos gratuitos).
 */
export function resolvePlantillaParaDescarga(opts: {
  plantillaParam?: string | null
  ipgHabilitado?: boolean
  cipHabilitado?: boolean
  certificadoHabilitadoLegacy?: boolean
  requierePago: boolean
}): PlantillaId {
  const { plantillaParam, ipgHabilitado, cipHabilitado, certificadoHabilitadoLegacy, requierePago } = opts

  if (plantillaParam === 'colegio_ingenieros' || plantillaParam === 'minimalista') {
    return plantillaParam
  }

  const ipgOk = !!(ipgHabilitado || certificadoHabilitadoLegacy)
  const cipOk = !!cipHabilitado

  if (requierePago) {
    if (cipOk && !ipgOk) return 'colegio_ingenieros'

    return 'minimalista'
  }

  return 'minimalista'
}

/**
 * Devuelve la función generadora correspondiente a la plantilla.
 */
export function getGenerator(plantilla: string): GeneratorFn {
  switch (plantilla) {
    case 'colegio_ingenieros':
      return generarColegioIngenieros
    case 'minimalista':
    default:
      return generarMinimalista
  }
}

export { generarMinimalista, generarColegioIngenieros }
