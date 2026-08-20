export interface CertificadoUsuario {
  id: string
  nombre: string
  apellido: string
  correo: string
  avatar: string | null
}

export interface CertificadoCurso {
  id: string
  titulo: string
}

export interface Certificado {
  id: string
  codigo_verificacion: string
  emitido_en: string
  usuario: CertificadoUsuario
  curso: CertificadoCurso
  tipo: 'IPG' | 'CIP'
}

export interface CertificadosResponse {
  status: boolean
  result: {
    certificados: Certificado[]
    paginacion: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

export interface CreateCertificadoPayload {
  usuario_id: string
  curso_id: string
  fecha_emision?: string
  fecha_inicio_curso?: string
  fecha_culminacion?: string
  nota_final?: number | ''
  duracion_override?: string
  docente_nombre_override?: string
  docente_cargo_override?: string
  reemplazar?: boolean
  certificado_tipo: 'ipg' | 'cip'
}

export interface UsuarioBusqueda {
  id: string
  nombre: string
  apellido: string
  correo: string
  avatar: string | null
}

export interface CursoBusqueda {
  id: string
  titulo: string
  estado: string
  fecha_inicio: string | null
  fecha_fin: string | null
  duracion: string | null
  certificado_cip_entregas: any | null
  certificado_ipg_espera_valor: number | null
  certificado_ipg_espera_unidad: string | null
}
