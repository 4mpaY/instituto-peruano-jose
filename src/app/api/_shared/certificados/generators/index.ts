import type { GeneratorFn } from './types'
import { generarClasico } from './clasico'
import { generarClasicoResumido } from './clasico_resumido'
import { generarCorporativo } from './corporativo'
import { generarModerno } from './moderno'
import { generarElegante } from './elegante'
import { generarInstitutoPeruano } from './instituto_peruano'
import { generarMinimalista } from './minimalista'

export const PLANTILLAS = {
  clasico: {
    id: 'clasico',
    nombre: 'Clásico',
    descripcion: 'Panel lateral con gradiente, diseño balanceado. Ideal para institutos y academias.',
    paginas: 2,
    thumbnail: '/images/plantillas-certificado/clasico.png',
  },
  clasico_resumido: {
    id: 'clasico_resumido',
    nombre: 'Clásico (Resumido)',
    descripcion: 'Versión del clásico con el temario resumido a dos columnas para ahorrar espacio.',
    paginas: 2,
    thumbnail: '/images/plantillas-certificado/clasico.png',
  },
  corporativo: {
    id: 'corporativo',
    nombre: 'Corporativo',
    descripcion: 'Diseño formal con borde y detalles dorados. Perfecto para empresas B2B.',
    paginas: 2,
    thumbnail: '/images/plantillas-certificado/corporativo.png',
  },
  moderno: {
    id: 'moderno',
    nombre: 'Moderno',
    descripcion: 'Fondo oscuro con acentos de color. Ideal para academias tech y startups.',
    paginas: 2,
    thumbnail: '/images/plantillas-certificado/moderno.png',
  },
  elegante: {
    id: 'elegante',
    nombre: 'Elegante',
    descripcion: 'Fondo crema con bordes ornamentales y estilo clásico universitario.',
    paginas: 2,
    thumbnail: '/images/plantillas-certificado/elegante.png',
  },
  instituto_peruano: {
    id: 'instituto_peruano',
    nombre: 'Instituto Peruano',
    descripcion: 'Diseño oficial del Instituto Peruano de Gestión Ambiental, Seguridad y Calidad. Barras verdes, temario por lección y logos institucionales.',
    paginas: 2,
    thumbnail: '/images/plantillas-certificado/instituto_peruano.png',
  },
  minimalista: {
    id: 'minimalista',
    nombre: 'Minimalista',
    descripcion: 'Diseño limpio y moderno con fondo blanco. Panel derecho con gradiente y QR.',
    paginas: 2,
    thumbnail: '/images/plantillas-certificado/minimalista.png',
  },
} as const

export type PlantillaId = keyof typeof PLANTILLAS

/**
 * Resuelve la plantilla activa desde configuración.
 * Por defecto usa Instituto Peruano (plantilla oficial de este tenant).
 */
export function resolvePlantillaCertificado(configs: Record<string, string>): PlantillaId {
  const id = configs.CERTIFICADO_PLANTILLA

  if (id && id in PLANTILLAS) return id as PlantillaId

  return 'instituto_peruano'
}

/**
 * Devuelve la función generadora correspondiente a la plantilla.
 * Si el slug no existe, devuelve Instituto Peruano como fallback seguro.
 */
export function getGenerator(plantilla: string): GeneratorFn {
  switch (plantilla) {
    case 'clasico':           return generarClasico
    case 'clasico_resumido':  return generarClasicoResumido
    case 'corporativo':       return generarCorporativo
    case 'moderno':           return generarModerno
    case 'elegante':          return generarElegante
    case 'instituto_peruano': return generarInstitutoPeruano
    case 'minimalista':       return generarMinimalista
    default:                  return generarInstitutoPeruano
  }
}

export { generarClasico, generarClasicoResumido, generarCorporativo, generarModerno, generarElegante, generarInstitutoPeruano, generarMinimalista }
