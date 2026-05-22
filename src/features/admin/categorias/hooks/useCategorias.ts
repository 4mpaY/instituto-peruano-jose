'use client'

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getSession } from 'next-auth/react'

import type { Categoria, CategoriaHijo } from '../entity/Categoria'
import type { CrearCategoriaDto, ActualizarCategoriaDto, CrearSubcategoriaDto } from '@/schemas/categoria.schema'
import { AxiosCategoria } from '../http/axiosCategoria'

const QUERY_KEY = { CATEGORIAS: ['categorias'] }

const axiosCategoriaFactory = () => {
  const getAuthToken = async () => {
    const s = await getSession()

    return s?.user?.accessToken ?? null
  }

  return new AxiosCategoria({ getAuthToken })
}

/**
 * Hook para obtener todas las categorías (solo padres con hijos incluidos)
 */
export function useCategorias(query?: Record<string, any>, initialData?: Categoria[], initialTotal?: number) {
  const axiosCategoria = axiosCategoriaFactory()

  const isInitialQuery = !query || (
    (query.page === '1' || !query.page) &&
    (query.limit === '10' || !query.limit) &&
    (!query.buscar || query.buscar === '') &&
    (query.esta_activo === undefined)
  )

  return useQuery<{ categorias: Categoria[]; paginacion: any }, any>({
    queryKey: [...QUERY_KEY.CATEGORIAS, query],
    queryFn: async () => await axiosCategoria.searchAll(query),
    initialData: (isInitialQuery && initialData) ? {
      categorias: initialData,
      paginacion: { total: initialTotal || initialData.length, page: 1, limit: 10 }
    } : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1
  })
}

/**
 * Hook para obtener una categoría por ID
 */
export function useCategoria(id: string) {
  const axiosCategoria = axiosCategoriaFactory()

  return useQuery<Categoria, any>({
    queryKey: [...QUERY_KEY.CATEGORIAS, id],
    queryFn: async () => await axiosCategoria.getById(id),
    enabled: !!id,
    staleTime: 60_000,
    retry: 1
  })
}

/**
 * Hook para crear una categoría padre
 */
export function useCreateCategoria() {
  const qc = useQueryClient()
  const axiosCategoria = axiosCategoriaFactory()

  return useMutation<{ categoria: Categoria }, any, CrearCategoriaDto>({
    mutationFn: async (payload: CrearCategoriaDto) => await axiosCategoria.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CATEGORIAS })
  })
}

/**
 * Hook para editar una categoría
 */
export function useEditCategoria() {
  const qc = useQueryClient()
  const axiosCategoria = axiosCategoriaFactory()

  return useMutation<{ categoria: Categoria }, any, { id: string; data: ActualizarCategoriaDto }>({
    mutationFn: async ({ id, data }) => await axiosCategoria.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CATEGORIAS })
  })
}

/**
 * Hook para eliminar una categoría
 */
export function useDeleteCategoria() {
  const qc = useQueryClient()
  const axiosCategoria = axiosCategoriaFactory()

  return useMutation<{ message: string }, any, string>({
    mutationFn: async (id: string) => await axiosCategoria.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CATEGORIAS })
  })
}

/**
 * Hook para activar/desactivar una categoría
 */
export function useToggleCategoriaStatus() {
  const qc = useQueryClient()
  const axiosCategoria = axiosCategoriaFactory()

  return useMutation<{ categoria: Categoria }, any, { id: string; esta_activo: boolean }>({
    mutationFn: async ({ id, esta_activo }) => await axiosCategoria.toggleStatus(id, esta_activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CATEGORIAS })
  })
}

/**
 * Hook para crear una subcategoría (hijo)
 */
export function useCreateSubcategoria() {
  const qc = useQueryClient()
  const axiosCategoria = axiosCategoriaFactory()

  return useMutation<{ categoria: CategoriaHijo }, any, { padreId: string; data: CrearSubcategoriaDto }>({
    mutationFn: async ({ padreId, data }) => await axiosCategoria.createChild(padreId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CATEGORIAS })
  })
}

/**
 * Hook para reordenar subcategorías
 */
export function useReordenarCategorias() {
  const qc = useQueryClient()
  const axiosCategoria = axiosCategoriaFactory()

  return useMutation<{ hijos: CategoriaHijo[] }, any, { padreId: string; items: { id: string; orden: number }[] }>({
    mutationFn: async ({ padreId, items }) => await axiosCategoria.reorder(padreId, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CATEGORIAS })
  })
}
