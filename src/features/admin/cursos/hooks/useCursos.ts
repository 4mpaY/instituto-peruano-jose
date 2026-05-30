'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession } from 'next-auth/react'

import type { Curso, CursoListaItem } from '../entity/Curso'
import type { CrearCursoDto, ActualizarCursoDto, CambiarEstadoCursoDto } from '@/schemas/curso.schema'
import { AxiosCurso } from '../http/axiosCurso'
import { AxiosCursoAdmin } from '../http/axiosCursoAdmin'

const QUERY_KEY = {
  CURSOS: ['cursos'],
  CURSOS_LISTA: ['cursos', 'lista']
}

const getAuthToken = async () => {
  const s = await getSession()

  return s?.user?.accessToken ?? null
}

// Singleton: instancia única reutilizada en todos los hooks (evita recrear en cada render)
const axiosCurso = new AxiosCurso({ getAuthToken })
const axiosCursoAdmin = new AxiosCursoAdmin({ getAuthToken })

/**
 * Hook para obtener la lista simplificada de cursos (selector de cupones, rutas, etc.)
 * Hidrata React Query con los datos prefetched desde el servidor.
 */
export function useCursosLista(initialData?: CursoListaItem[]) {
  return useQuery<CursoListaItem[], any>({
    queryKey: QUERY_KEY.CURSOS_LISTA,
    queryFn: async () => await axiosCursoAdmin.getLista(),
    
    // Solo hidratar con initialData si el servidor devolvió datos reales.
    // Si llega [] (fallo silencioso del server), dejamos que el cliente haga el fetch.
    initialData: initialData?.length ? initialData : undefined,
    staleTime: 60_000,
    retry: 1
  })
}

/**
 * Hook para listar cursos con filtros
 */
export function useCursos(query?: Record<string, string>) {


  return useQuery<{ cursos: Curso[]; paginacion: any }, any>({
    queryKey: [...QUERY_KEY.CURSOS, query],
    queryFn: async () => await axiosCurso.searchAll(query),
    staleTime: 60_000,
    retry: 1
  })
}

/**
 * Hook para obtener un curso por ID (con módulos y lecciones)
 */
export function useCurso(id: string) {


  return useQuery<Curso, any>({
    queryKey: [...QUERY_KEY.CURSOS, id],
    queryFn: async () => await axiosCurso.getById(id),
    enabled: !!id,
    staleTime: 60_000,
    retry: 1
  })
}

/**
 * Hook para crear un curso
 */
export function useCreateCurso() {
  const qc = useQueryClient()


  return useMutation<{ curso: Curso }, any, CrearCursoDto>({
    mutationFn: async payload => await axiosCurso.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

/**
 * Hook para editar un curso
 */
export function useEditCurso() {
  const qc = useQueryClient()


  return useMutation<{ curso: Curso }, any, { id: string; data: ActualizarCursoDto }>({
    mutationFn: async ({ id, data }) => await axiosCurso.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

/**
 * Hook para eliminar un curso
 */
export function useDeleteCurso() {
  const qc = useQueryClient()


  return useMutation<{ message: string }, any, string>({
    mutationFn: async id => await axiosCurso.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

/**
 * Hook para cambiar estado del curso
 */
export function useCambiarEstadoCurso() {
  const qc = useQueryClient()


  return useMutation<{ curso: Curso }, any, { id: string; data: CambiarEstadoCursoDto }>({
    mutationFn: async ({ id, data }) => await axiosCurso.cambiarEstado(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

// ===================== MÓDULOS =====================

export function useCreateModulo() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; data: { titulo: string; descripcion?: string | null } }>({
    mutationFn: async ({ cursoId, data }) => await axiosCurso.createModulo(cursoId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

export function useUpdateModulo() {
  const qc = useQueryClient()


  return useMutation<
    any,
    any,
    { cursoId: string; moduloId: string; data: { titulo?: string; descripcion?: string | null } }
  >({
    mutationFn: async ({ cursoId, moduloId, data }) => await axiosCurso.updateModulo(cursoId, moduloId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

export function useDeleteModulo() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; moduloId: string }>({
    mutationFn: async ({ cursoId, moduloId }) => await axiosCurso.deleteModulo(cursoId, moduloId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

export function useReorderModulos() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; items: { id: string; orden: number }[] }>({
    mutationFn: async ({ cursoId, items }) => await axiosCurso.reorderModulos(cursoId, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

// ===================== LECCIONES =====================

export function useCreateLeccion() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; moduloId: string; data: { titulo: string } }>({
    mutationFn: async ({ cursoId, moduloId, data }) => await axiosCurso.createLeccion(cursoId, moduloId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

export function useUpdateLeccion() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; moduloId: string; leccionId: string; data: any }>({
    mutationFn: async ({ cursoId, moduloId, leccionId, data }) =>
      await axiosCurso.updateLeccion(cursoId, moduloId, leccionId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

export function useDeleteLeccion() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; moduloId: string; leccionId: string }>({
    mutationFn: async ({ cursoId, moduloId, leccionId }) =>
      await axiosCurso.deleteLeccion(cursoId, moduloId, leccionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

export function useReorderLecciones() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; moduloId: string; items: { id: string; orden: number }[] }>({
    mutationFn: async ({ cursoId, moduloId, items }) => await axiosCurso.reorderLecciones(cursoId, moduloId, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

export function useReorderExamenesModulo() {
  const qc = useQueryClient()

  return useMutation<any, any, { cursoId: string; moduloId: string; items: { id: string; orden: number }[] }>({
    mutationFn: async ({ cursoId, moduloId, items }) =>
      await axiosCurso.reorderExamenesModulo(cursoId, moduloId, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY.CURSOS })
  })
}

/**
 * Hook para obtener todos los comentarios de un curso
 */
export function useComentariosCurso(cursoId: string, estado?: string) {
  return useQuery<{ comentarios: any[] }, any>({
    queryKey: [...QUERY_KEY.CURSOS, cursoId, 'comentarios', estado],
    queryFn: async () => await axiosCurso.getComentarios(cursoId, estado),
    enabled: !!cursoId,
    staleTime: 0
  })
}

// ===================== EXÁMENES (plural) =====================

export function useExamenesCurso(cursoId: string) {
  return useQuery<{ examenes: any[] }, any>({
    queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes'],
    queryFn: async () => await axiosCurso.getExamenes(cursoId),
    enabled: !!cursoId,
    staleTime: 30_000
  })
}

export function useExamenById(cursoId: string, examenId: string) {
  return useQuery<{ examen: any }, any>({
    queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes', examenId],
    queryFn: async () => await axiosCurso.getExamenById(cursoId, examenId),
    enabled: !!cursoId && !!examenId,
    staleTime: 30_000
  })
}

export function useCreateExamen() {
  const qc = useQueryClient()

  return useMutation<any, any, { cursoId: string; data: any }>({
    mutationFn: async ({ cursoId, data }) => await axiosCurso.createExamen(cursoId, data),
    onSuccess: (_, { cursoId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes'] })
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId] })
    }
  })
}

export function useUpdateExamen() {
  const qc = useQueryClient()

  return useMutation<any, any, { cursoId: string; examenId: string; data: any }>({
    mutationFn: async ({ cursoId, examenId, data }) => await axiosCurso.updateExamen(cursoId, examenId, data),
    onSuccess: (_, { cursoId, examenId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes'] })
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes', examenId] })
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId] })
    }
  })
}

export function useDeleteExamen() {
  const qc = useQueryClient()

  return useMutation<any, any, { cursoId: string; examenId: string }>({
    mutationFn: async ({ cursoId, examenId }) => await axiosCurso.deleteExamen(cursoId, examenId),
    onSuccess: (_, { cursoId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes'] })
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId] })
    }
  })
}

export function useCreatePreguntaExamen() {
  const qc = useQueryClient()

  return useMutation<any, any, { cursoId: string; examenId: string; data: any }>({
    mutationFn: async ({ cursoId, examenId, data }) => await axiosCurso.createPreguntaExamen(cursoId, examenId, data),
    onSuccess: (_, { cursoId, examenId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes', examenId] })
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes'] })
    }
  })
}

export function useUpdatePreguntaExamen() {
  const qc = useQueryClient()

  return useMutation<any, any, { cursoId: string; examenId: string; preguntaId: string; data: any }>({
    mutationFn: async ({ cursoId, examenId, preguntaId, data }) =>
      await axiosCurso.updatePreguntaExamen(cursoId, examenId, preguntaId, data),
    onSuccess: (_, { cursoId, examenId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes', examenId] })
    }
  })
}

export function useDeletePreguntaExamen() {
  const qc = useQueryClient()

  return useMutation<any, any, { cursoId: string; examenId: string; preguntaId: string }>({
    mutationFn: async ({ cursoId, examenId, preguntaId }) =>
      await axiosCurso.deletePreguntaExamen(cursoId, examenId, preguntaId),
    onSuccess: (_, { cursoId, examenId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examenes', examenId] })
    }
  })
}

// ===================== EXÁMENES (legacy) =====================

export function useExamenCurso(cursoId: string) {


  return useQuery<{ examen: any | null }, any>({
    queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examen'],
    queryFn: async () => await axiosCurso.getExamen(cursoId),
    enabled: !!cursoId,
    staleTime: 30_000
  })
}

export function useSaveExamen() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; data: any }>({
    mutationFn: async ({ cursoId, data }) => await axiosCurso.saveExamen(cursoId, data),
    onSuccess: (_, { cursoId }) => qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examen'] })
  })
}

export function useCreatePregunta() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; data: any }>({
    mutationFn: async ({ cursoId, data }) => await axiosCurso.createPregunta(cursoId, data),
    onSuccess: (_, { cursoId }) => qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examen'] })
  })
}

export function useUpdatePregunta() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; preguntaId: string; data: any }>({
    mutationFn: async ({ cursoId, preguntaId, data }) => await axiosCurso.updatePregunta(cursoId, preguntaId, data),
    onSuccess: (_, { cursoId }) => qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examen'] })
  })
}

export function useDeletePregunta() {
  const qc = useQueryClient()


  return useMutation<any, any, { cursoId: string; preguntaId: string }>({
    mutationFn: async ({ cursoId, preguntaId }) => await axiosCurso.deletePregunta(cursoId, preguntaId),
    onSuccess: (_, { cursoId }) => qc.invalidateQueries({ queryKey: [...QUERY_KEY.CURSOS, cursoId, 'examen'] })
  })
}
