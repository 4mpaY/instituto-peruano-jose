import axios from 'axios'
import type { AxiosStatic } from 'axios'

import { getBaseURL } from '@/utils/env'
import { AxiosInternalHttpClient } from '@/features/shared/http/httpClient'
import type { CursoListaItem } from '../entity/Curso'

type Params = {
  axiosLib?: AxiosStatic
  getAuthToken?: () => Promise<string | null> | string | null
}

export class AxiosCursoAdmin extends AxiosInternalHttpClient {
  constructor(params: Params = {}) {
    const baseURL = getBaseURL()

    super({
      axiosLib: params.axiosLib ?? axios,
      baseURL: `${baseURL}/api/admin/cursos`,
      getAuthToken: params.getAuthToken
    })
  }

  async getLista(): Promise<CursoListaItem[]> {
    try {
      const res = await this.iGet<{ cursos: CursoListaItem[] }>('/lista')

      return res?.cursos || []
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async getAlumnos(
    cursoId: string,
    search?: string
  ): Promise<{ alumnos: any[]; total: number; totalExamenes?: number; precio_certificado?: number | null }> {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : ''

      const payload = await this.iGet<{
        alumnos: any[]
        total: number
        totalExamenes?: number
        precio_certificado?: number | null
      }>(`/${cursoId}/alumnos${query}`)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }
}
