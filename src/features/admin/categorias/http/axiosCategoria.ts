import axios from 'axios'

import type { AxiosStatic } from 'axios'

import { getBaseURL } from '@/utils/env'
import { AxiosInternalHttpClient } from '@/features/shared/http/httpClient'
import type { Categoria, CategoriaHijo } from '../entity/Categoria'
import type { CrearCategoriaDto, ActualizarCategoriaDto, CrearSubcategoriaDto } from '@/schemas/categoria.schema'

type Params = {
  axiosLib?: AxiosStatic
  baseURL?: string
  getAuthToken?: () => Promise<string | null> | string | null
}

export class AxiosCategoria extends AxiosInternalHttpClient {
  constructor(params: Params = {}) {
    const baseURL = getBaseURL()

    super({
      axiosLib: params.axiosLib ?? axios,
      baseURL: `${baseURL}/api/categorias`,
      getAuthToken: params.getAuthToken
    })
  }

  async searchAll(query?: Record<string, string | number | boolean | undefined | null>): Promise<{ categorias: Categoria[]; paginacion: any }> {
    try {
      // Limpiamos los parámetros para evitar campos vacíos o undefined
      const cleanQuery = query 
        ? Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''))
        : {}

      const queryString = Object.keys(cleanQuery).length > 0 
        ? '?' + new URLSearchParams(cleanQuery as any).toString() 
        : ''

      const payload = await this.iGet<{ categorias: Categoria[]; paginacion: any }>(queryString)

      return payload || { categorias: [], paginacion: {} }
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async getById(id: string): Promise<Categoria> {
    try {
      const payload = await this.iGet<Categoria>(`/${id}`)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async create(categoria: CrearCategoriaDto): Promise<{ categoria: Categoria }> {
    try {
      const payload = await this.iPost<{ categoria: Categoria }>('', categoria)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async update(id: string, categoria: ActualizarCategoriaDto): Promise<{ categoria: Categoria }> {
    try {
      const payload = await this.iPatch<{ categoria: Categoria }>(`/${id}`, categoria)

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

  async toggleStatus(id: string, esta_activo: boolean): Promise<{ categoria: Categoria }> {
    try {
      const payload = await this.iPatch<{ categoria: Categoria }>(`/${id}`, { esta_activo })

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async createChild(padreId: string, data: CrearSubcategoriaDto): Promise<{ categoria: CategoriaHijo }> {
    try {
      const payload = await this.iPost<{ categoria: CategoriaHijo }>(`/${padreId}/hijos`, data)

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }

  async reorder(padreId: string, items: { id: string; orden: number }[]): Promise<{ hijos: CategoriaHijo[] }> {
    try {
      const payload = await this.iPatch<{ hijos: CategoriaHijo[] }>(`/${padreId}/reordenar`, { items })

      return payload
    } catch (err: any) {
      throw err?.response?.data ?? err
    }
  }
}
