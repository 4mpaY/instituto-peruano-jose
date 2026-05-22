import axios from 'axios'

import type { AxiosStatic } from 'axios'

import { getBaseURL } from '@/utils/env'
import { AxiosInternalHttpClient } from '@/features/shared/http/httpClient'
import type { Usuario } from '../entity/Usuario'
import type { CrearUsuarioDto, ActualizarUsuarioDto } from '@/schemas/usuario.schema'

type Params = {
  axiosLib?: AxiosStatic
  baseURL?: string
  getAuthToken?: () => Promise<string | null> | string | null
}

export class AxiosUsuario extends AxiosInternalHttpClient {
  constructor(params: Params = {}) {
    const baseURL = getBaseURL()

    super({
      axiosLib: params.axiosLib ?? axios,
      baseURL: `${baseURL}/api/usuarios`,
      getAuthToken: params.getAuthToken
    })
  }

  async searchAll(query?: Record<string, string | number | undefined | null>): Promise<{ usuarios: Usuario[]; paginacion: any }> {
    try {
      // Limpiamos los parámetros para no enviar campos vacíos o undefined que invaliden el Zod del backend
      const cleanQuery = query 
        ? Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''))
        : {}

      const queryString = Object.keys(cleanQuery).length > 0 
        ? '?' + new URLSearchParams(cleanQuery as any).toString() 
        : ''

      const payload = await this.iGet<{ usuarios: Usuario[]; paginacion: any }>(queryString)

      return payload || { usuarios: [], paginacion: {} }
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async getById(id: string): Promise<Usuario> {
    try {
      const payload = await this.iGet<Usuario>(`/${id}`)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async create(usuario: CrearUsuarioDto): Promise<{ usuario: Usuario }> {
    try {
      const payload = await this.iPost<{ usuario: Usuario }>('', usuario)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async update(id: string, usuario: ActualizarUsuarioDto): Promise<{ usuario: Usuario }> {
    try {
      const payload = await this.iPatch<{ usuario: Usuario }>(`/${id}`, usuario)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    try {
      const payload = await this.iDelete<{ message: string }>(`/${id}`)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async toggleStatus(id: string, esta_activo: boolean): Promise<{ usuario: Usuario }> {
    try {
      const payload = await this.iPatch<{ usuario: Usuario }>(`/${id}`, { esta_activo })

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async bulkCreate(usuarios: any[]): Promise<{ exitosos: number; errores: { fila: number; correo: string; mensaje: string }[] }> {
    try {
      return await this.iPost<any>('/bulk', { usuarios })
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }
}
