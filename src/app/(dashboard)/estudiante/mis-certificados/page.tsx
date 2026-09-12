import { redirect } from 'next/navigation'

import { getAuthSession } from '@/utils/libs/auth-helpers'
import MisCertificadosPage from '@/features/estudiante/certificados/components/MisCertificadosPage'
import { AxiosMisCertificados } from '@/features/estudiante/certificados/http/axiosMisCertificados'

export default async function MisCertificadosPageRoute() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/login')
  }

  const token = session.user?.accessToken ?? null
  const client = new AxiosMisCertificados({ getAuthToken: () => token })

  let certificados: any[] = []
  let tramitables: any[] = []

  try {
    const [certsRes, tramitablesRes] = await Promise.all([
      client.getAll(),
      client.getTramitables()
    ])

    certificados = certsRes
    tramitables = tramitablesRes
  } catch (error) {
    console.error('Error fetching certificates/tramitables:', error)
  }

  return <MisCertificadosPage initialCertificados={certificados} initialTramitables={tramitables} />
}
