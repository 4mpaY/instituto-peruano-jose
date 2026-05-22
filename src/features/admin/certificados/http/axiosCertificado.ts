import axios from 'axios'

import type { AxiosStatic } from 'axios'

import { getBaseURL } from '@/utils/env'
import { AxiosInternalHttpClient } from '@/features/shared/http/httpClient'
import type { CertificadosResponse, CreateCertificadoPayload, UsuarioBusqueda, CursoBusqueda } from '../entity/Certificado'

type Params = {
  axiosLib?: AxiosStatic
  baseURL?: string
  getAuthToken?: () => Promise<string | null> | string | null
}

export class AxiosCertificado extends AxiosInternalHttpClient {
  constructor(params: Params = {}) {
    const baseURL = getBaseURL()

    super({
      axiosLib: params.axiosLib ?? axios,
      baseURL: `${baseURL}/api/admin/certificados`,
      getAuthToken: params.getAuthToken
    })
  }

  async getAll(params: {
    page: number
    limit: number
    buscar?: string
    codigo?: string
    nombre?: string
  }): Promise<CertificadosResponse['result']> {
    try {
      return await this.iGet<CertificadosResponse['result']>('', { params })
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async downloadPdf(id: string, preview = false): Promise<Blob> {
    try {
      const res = await this.client.get(`/${id}/download`, {
        params: { preview },
        responseType: 'blob'
      })

      return res.data
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async create(payload: CreateCertificadoPayload): Promise<any> {
    try {
      return await this.iPost<any>('', payload)
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async buscarUsuarios(q: string): Promise<UsuarioBusqueda[]> {
    try {
      const res = await this.iGet<{ usuarios: UsuarioBusqueda[] }>('/buscar-usuarios', { params: { q } })

      return res.usuarios
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async buscarCursos(buscar: string): Promise<CursoBusqueda[]> {
    try {
      const res = await this.iGet<{ cursos: CursoBusqueda[] }>('/buscar-cursos', { params: { buscar } })

      return res.cursos
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }
}
