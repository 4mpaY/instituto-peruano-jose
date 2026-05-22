import type { Rol } from '@prisma/client'

export interface Usuario {
  id: string
  correo: string
  nombre: string
  apellido: string
  numero_documento: string
  avatar: string | null
  biografia: string | null
  celular: string | null
  cargo: string | null
  firma: string | null
  rol: Rol
  esta_activo: boolean
  creado_en: string
  actualizado_en: string
  inscripciones?: {
    id: string
    inscrito_en: string
    estado: string
    certificado_habilitado: boolean
    curso: {
      id: string
      titulo: string
      slug: string
      precio_certificado: number | null
      moneda: string
    }
  }[]
  cursos_dictados?: {
    id: string
    titulo: string
    slug: string
    estado: string
    creado_en: string
  }[]
}

export interface UsuarioListItem {
  id: string
  correo: string
  nombre: string
  apellido: string
  nombre_completo: string
  numero_documento: string
  avatar: string | null
  rol: Rol
  esta_activo: boolean
  creado_en: string
}
