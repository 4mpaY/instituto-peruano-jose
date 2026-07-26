import type { Rol, TipoDocumento } from '@prisma/client'

export interface Usuario {
  id: string
  correo: string
  nombre: string
  apellido: string
  tipo_documento: TipoDocumento | null
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
    certificado_ipg_habilitado: boolean
    certificado_cip_habilitado: boolean
    certificado_ipg_id: string | null
    certificado_cip_id: string | null
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
