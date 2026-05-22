import axios from 'axios'

import type { AxiosStatic } from 'axios'

import { getBaseURL } from '@/utils/env'
import { AxiosInternalHttpClient } from '@/features/shared/http/httpClient'
import type { Pedido } from '../entity/Pedido'
import type { CrearPedidoManualDto } from '@/schemas/pedido.schema'

type Params = {
  axiosLib?: AxiosStatic
  baseURL?: string
  getAuthToken?: () => Promise<string | null> | string | null
}

export class AxiosPedido extends AxiosInternalHttpClient {
  constructor(params: Params = {}) {
    const baseURL = getBaseURL()

    super({
      axiosLib: params.axiosLib ?? axios,
      baseURL: `${baseURL}/api/pedidos`,
      getAuthToken: params.getAuthToken
    })
  }

  async getAll(query?: Record<string, string | number | boolean | undefined | null>): Promise<{ pedidos: Pedido[]; paginacion: any }> {
    try {
      // Limpiamos los parámetros para evitar campos vacíos o undefined
      const cleanQuery = query 
        ? Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''))
        : {}

      const queryString = Object.keys(cleanQuery).length > 0 
        ? '?' + new URLSearchParams(cleanQuery as any).toString() 
        : ''

      const payload = await this.iGet<{ pedidos: Pedido[]; paginacion: any }>(queryString)

      return payload || { pedidos: [], paginacion: {} }
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async createManual(pedido: CrearPedidoManualDto): Promise<{ message: string; data: any }> {
    try {
      const payload = await this.iPost<{ message: string; data: any }>('/manual', pedido)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async getById(id: string): Promise<{ data: Pedido }> {
    try {
      const payload = await this.iGet<{ data: Pedido }>(`/${id}`)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async updatePedido(id: string, data: Partial<Pedido>): Promise<{ message: string; data: Pedido }> {
    try {
      const payload = await this.iPatch<{ message: string; data: Pedido }>(`/${id}`, data)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async drop(id: string): Promise<{ message: string }> {
    try {
      const payload = await this.iDelete<{ message: string }>(`/${id}`)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }
}
