import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSession } from 'next-auth/react'

import { AxiosCertificado } from '../http/axiosCertificado'
import type { CertificadosResponse, CreateCertificadoPayload } from '../entity/Certificado'

const axiosCertificadoFactory = () => {
  const getAuthToken = async () => {
    const s = await getSession()

    return s?.user?.accessToken ?? null
  }

  return new AxiosCertificado({ getAuthToken })
}

export const useCertificados = (
  params: { page: number; limit: number; buscar?: string; codigo?: string; nombre?: string },
  initialData?: CertificadosResponse['result']
) => {
  const isDefault =
    params.page === 1 && params.limit === 10 && !params.buscar && !params.codigo && !params.nombre

  return useQuery({
    queryKey: ['admin-certificados', params],
    queryFn: async () => {
      const axiosCertificado = axiosCertificadoFactory()

      return await axiosCertificado.getAll(params)
    },
    initialData: isDefault ? initialData : undefined
  })
}

export const useCreateCertificado = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCertificadoPayload) => {
      const axiosCertificado = axiosCertificadoFactory()

      return await axiosCertificado.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certificados'] })
    }
  })
}
