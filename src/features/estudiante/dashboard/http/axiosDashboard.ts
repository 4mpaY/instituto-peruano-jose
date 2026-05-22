import axios from 'axios'

import type { AxiosStatic } from 'axios'

import { getBaseURL } from '@/utils/env'
import { AxiosInternalHttpClient } from '@/features/shared/http/httpClient'
import type { DashboardData, DashboardResponse } from '../entity/Dashboard'

type Params = {
  axiosLib?: AxiosStatic
  getAuthToken?: () => Promise<string | null> | string | null
}

export class AxiosDashboard extends AxiosInternalHttpClient {
  constructor(params: Params = {}) {
    const baseURL = getBaseURL()

    super({
      axiosLib: params.axiosLib ?? axios,
      baseURL: `${baseURL}/api/estudiante/dashboard`,
      getAuthToken: params.getAuthToken
    })
  }

  async getDashboard(): Promise<DashboardData> {
    try {
      const payload = await this.iGet<DashboardResponse['result']>('')

      return payload!
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }
}
