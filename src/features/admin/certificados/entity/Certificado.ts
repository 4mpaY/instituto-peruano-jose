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
}
