import axios from 'axios'

import type { AxiosStatic } from 'axios'

import { getBaseURL } from '@/utils/env'
import { AxiosInternalHttpClient } from '@/features/shared/http/httpClient'
import type { MiCertificado, MisCertificadosResponse } from '../entity/Certificado'

type Params = {
  axiosLib?: AxiosStatic
  getAuthToken?: () => Promise<string | null> | string | null
}

export class AxiosMisCertificados extends AxiosInternalHttpClient {
  constructor(params: Params = {}) {
    const baseURL = getBaseURL()

    super({
      axiosLib: params.axiosLib ?? axios,
      baseURL: `${baseURL}/api/estudiante/certificados`,
      getAuthToken: params.getAuthToken
    })
  }

  async getAll(): Promise<MiCertificado[]> {
    try {
      const payload = await this.iGet<MisCertificadosResponse['result']>('')

      return payload?.certificados || []
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async getTramitables(): Promise<any[]> {
    try {
      const payload = await this.iGet<any>('/tramitables')

      return payload?.tramitables || []
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async downloadPdf(id: string): Promise<Blob> {
    try {
      const res = await this.client.get(`${getBaseURL()}/api/estudiante/certificado/${id}/pdf`, {
        responseType: 'blob'
      })

      return res.data
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }
}
