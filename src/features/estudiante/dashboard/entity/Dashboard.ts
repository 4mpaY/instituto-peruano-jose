export interface DashboardKpis {
  totalInscritos: number
  cursosEnProgreso: number
  cursosCompletados: number
  totalCertificados: number
}

export interface DashboardCurso {
  id: string
  titulo: string
  slug: string
  miniatura?: string
  profesor: {
    nombre: string
    apellido: string
  }
  categoria?: string
  progreso: number
}

export interface DashboardCertificado {
  id: string
  codigo_verificacion: string
  emitido_en: string
  curso: {
    id: string
    titulo: string
    slug: string
    miniatura: string | null
    nivel: string | null
    profesor: {
      nombre: string
      apellido: string
    }
  }
}

export interface DashboardData {
  kpis: DashboardKpis
  cursosRecientes: DashboardCurso[]
  certificadosRecientes: DashboardCertificado[]
}

export interface DashboardResponse {
  status: boolean
  result: DashboardData
}
