export interface CursoListaItem {
  id: string
  titulo: string
  estado: string
}

export interface CursoProfesor {
  id: string
  nombre: string
  apellido: string
  avatar: string | null
}

export interface CursoCategoria {
  id: string
  nombre: string
}

export interface CursoLeccionResumen {
  id: string
  titulo: string
  orden: number
  duracion: number | null
  video_url: string | null
  enlace_reunion: string | null
  es_en_vivo: boolean
  fecha_programada: string | Date | null
  recursos: any[]
  estado: 'BORRADOR' | 'PUBLICADO'
  es_vista_previa: boolean
  contenido: string | null
}

export interface CursoExamenResumen {
  id: string
  titulo: string
  tipo: 'FINAL' | 'INTERMEDIO'
  peso: number
  progreso_minimo: number
  orden: number | null
  puntaje_aprobacion: number
  intentos_maximos: number
  esta_publicado: boolean
  limite_tiempo: number | null
  modulo_id: string | null
  modulo?: { id: string; titulo: string; orden: number } | null
  _count?: { preguntas: number }
}

export interface CursoModulo {
  id: string
  titulo: string
  descripcion: string | null
  orden: number
  creado_en: string
  actualizado_en: string
  lecciones: CursoLeccionResumen[]
  examenes: CursoExamenResumen[]
}

export interface Curso {
  id: string
  titulo: string
  slug: string
  codigo: string | null
  descripcion: string | null
  miniatura: string | null
  video_presentacion: string | null
  fecha_inicio: string | Date | null
  fecha_fin: string | Date | null
  duracion: string | null
  tipo_emision: 'SINCRONO' | 'ASINCRONO' | 'MIXTO'
  nivel: 'BASICO' | 'INTERMEDIO' | 'AVANZADO'
  estado: 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO'
  es_gratis: boolean
  es_privado: boolean
  completar_automatico: boolean
  precio_certificado: number | null
  precio: number
  precio_falso: number
  moneda: string
  creado_en: string
  actualizado_en: string
  profesor_id: string
  profesor: CursoProfesor
  categoria_id: string | null
  categoria: CursoCategoria | null
  modulos: CursoModulo[]
  brochure: string | null
  objetivos: string[]
  metodologia: any[]
  beneficios: any[]
  incluye: any[]
  _count: {
    modulos: number
    lecciones: number
    inscripciones: number
    valoraciones: number
  }
  promedio_valoracion: number
  vigencia_meses?: number | null
}
