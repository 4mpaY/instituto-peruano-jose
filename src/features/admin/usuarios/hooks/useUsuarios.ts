'use client'

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getSession } from 'next-auth/react'

import type { Usuario } from '../entity/Usuario'
import type { CrearUsuarioDto, ActualizarUsuarioDto } from '@/schemas/usuario.schema'
import { AxiosUsuario } from '../http/axiosUsuario'

const QUERY_KEY = { USUARIOS: ['usuarios'] }

// Factory para crear instancia con autenticación
const axiosUsuarioFactory = () => {
  const getAuthToken = async () => {
    const s = await getSession()

    return s?.user?.accessToken ?? null
  }

  return new AxiosUsuario({ getAuthToken })
}

/**
 * Hook para obtener todos los usuarios
 */
export function useUsuarios(query?: Record<string, string>, initialData?: Usuario[], initialTotal?: number) {
  const axiosUsuario = axiosUsuarioFactory()

  const isInitialQuery = !query || (
    (query.page === '1' || !query.page) &&
    (query.limit === '10' || !query.limit) &&
    (!query.buscar || query.buscar === '') &&
    (!query.rol || query.rol === '')
  )

  return useQuery<{ usuarios: Usuario[]; paginacion: any }, any>({
    queryKey: [...QUERY_KEY.USUARIOS, query],
    queryFn: async () => await axiosUsuario.searchAll(query),
    initialData: (isInitialQuery && initialData) ? {
      usuarios: initialData,
      paginacion: { total: initialTotal || initialData.length, page: 1, limit: 10 }
    } : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1
  })
}

/**
 * Hook para obtener un usuario por ID
 */
export function useUsuario(id: string) {
  const axiosUsuario = axiosUsuarioFactory()

  return useQuery<Usuario, any>({
    queryKey: [...QUERY_KEY.USUARIOS, id],
    queryFn: async () => await axiosUsuario.getById(id),
    enabled: !!id,
    staleTime: 60_000,
    retry: 1
  })
}

/**
 * Hook para crear un usuario
 */
export function useCreateUsuario() {
  const qc = useQueryClient()
  const axiosUsuario = axiosUsuarioFactory()

  return useMutation<{ usuario: Usuario }, any, CrearUsuarioDto>({
    mutationFn: async (payload: CrearUsuarioDto) => await axiosUsuario.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.USUARIOS })
  })
}

/**
 * Hook para editar un usuario
 */
export function useEditUsuario() {
  const qc = useQueryClient()
  const axiosUsuario = axiosUsuarioFactory()

  return useMutation<{ usuario: Usuario }, any, { id: string; data: ActualizarUsuarioDto }>({
    mutationFn: async ({ id, data }) => await axiosUsuario.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.USUARIOS })
  })
}

/**
 * Hook para eliminar un usuario
 */
export function useDeleteUsuario() {
  const qc = useQueryClient()
  const axiosUsuario = axiosUsuarioFactory()

  return useMutation<{ message: string }, any, string>({
    mutationFn: async (id: string) => await axiosUsuario.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.USUARIOS })
  })
}

/**
 * Hook para importar usuarios masivamente desde Excel
 */
export function useImportarUsuarios() {
  const qc = useQueryClient()
  const axiosUsuario = axiosUsuarioFactory()

  return useMutation<{ exitosos: number; errores: any[] }, any, any[]>({
    mutationFn: async (usuarios: any[]) => await axiosUsuario.bulkCreate(usuarios),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.USUARIOS })
  })
}

/**
 * Hook para activar/desactivar un usuario
 */
export function useToggleUsuarioStatus() {
  const qc = useQueryClient()
  const axiosUsuario = axiosUsuarioFactory()

  return useMutation<{ usuario: Usuario }, any, { id: string; esta_activo: boolean }>({
    mutationFn: async ({ id, esta_activo }) => await axiosUsuario.toggleStatus(id, esta_activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.USUARIOS })
  })
}
