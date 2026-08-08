import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosStatic } from 'axios'
import axios from 'axios'

import { handleSessionExpired } from './sessionExpired'

type Params = {
  axiosLib?: AxiosStatic
  baseURL: string
  getAuthToken?: () => Promise<string | null> | string | null
}

export class AxiosInternalHttpClient {
  protected client: AxiosInstance
  protected getAuthToken?: () => Promise<string | null> | string | null

  constructor({ axiosLib = axios, baseURL, getAuthToken }: Params) {
    this.client = axiosLib.create({ baseURL })
    this.getAuthToken = getAuthToken

    this.client.interceptors.request.use(async config => {
      try {
        const token = typeof this.getAuthToken === 'function' ? await this.getAuthToken() : this.getAuthToken

        if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
      } catch (e) {
        // ignore token error
      }

      return config
    })

    this.client.interceptors.response.use(
      res => res,
      error => {
        if (error?.response?.status === 401 && typeof window !== 'undefined') {
          handleSessionExpired()
        }

        return Promise.reject(error)
      }
    )
  }

  protected parseResponse<T = any>(res: AxiosResponse): T {
    // Extraer `result` de la respuesta estandarizada, con fallback a res.data
    const data = res.data

    return data?.result !== undefined ? data.result : data
  }

  protected async iGet<T = any>(url = '', config?: AxiosRequestConfig) {
    const res = await this.client.get(url, config)

    return this.parseResponse<T>(res)
  }

  protected async iPost<T = any, B = any>(url = '', data?: B, config?: AxiosRequestConfig) {
    const res = await this.client.post(url, data, config)

    return this.parseResponse<T>(res)
  }

  protected async iPatch<T = any, B = any>(url = '', data?: B, config?: AxiosRequestConfig) {
    const res = await this.client.patch(url, data, config)

    return this.parseResponse<T>(res)
  }

  protected async iPut<T = any, B = any>(url = '', data?: B, config?: AxiosRequestConfig) {
    const res = await this.client.put(url, data, config)

    return this.parseResponse<T>(res)
  }

  protected async iDelete<T = any>(url = '', config?: AxiosRequestConfig) {
    const res = await this.client.delete(url, config)

    return this.parseResponse<T>(res)
  }
}
