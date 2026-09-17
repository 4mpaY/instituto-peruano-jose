import { redirect } from 'next/navigation'

import { getAuthSession } from '@/utils/libs/auth-helpers'


import { CertificadosTable } from '@/features/admin/certificados/components/CertificadosTable'
import { AxiosCertificado } from '@/features/admin/certificados/http/axiosCertificado'

import type { CertificadosResponse } from '@/features/admin/certificados/entity/Certificado'

export const metadata = {
  title: 'Gestión de Certificados | Aula Virtual'
}

export default async function Page() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/')
  }

  const token = session.user?.accessToken ?? null

  const axiosCertificado = new AxiosCertificado({
    getAuthToken: () => token
  })

  let initialData: CertificadosResponse['result'] | null = null

  try {
    initialData = await axiosCertificado.getAll({ page: 1, limit: 10 })
  } catch (error) {
    console.error('Error fetching certificados:', error)
  }

  return <CertificadosTable initialData={initialData} />
}
