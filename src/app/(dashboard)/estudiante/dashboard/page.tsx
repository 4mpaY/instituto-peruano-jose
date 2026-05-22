import { redirect } from 'next/navigation'

import { getAuthSession } from '@/utils/libs/auth-helpers'
import EstudianteDashboardPage from '@/features/estudiante/dashboard/components/EstudianteDashboardPage'
import { AxiosDashboard } from '@/features/estudiante/dashboard/http/axiosDashboard'
import type { DashboardData } from '@/features/estudiante/dashboard/entity/Dashboard'

export const metadata = {
  title: 'Mi Dashboard | Aula Virtual',
  description: 'Resumen de tu actividad académica: cursos, progreso y certificados.'
}

export default async function EstudianteDashboardRoute() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/login')
  }

  const token = session.user?.accessToken ?? null
  const client = new AxiosDashboard({ getAuthToken: () => token })

  let initialData: DashboardData | undefined

  try {
    initialData = await client.getDashboard()
  } catch (error) {
    console.error('[Dashboard] Error fetching initial data:', error)
  }

  const nombre = session.user?.name ?? undefined

  return <EstudianteDashboardPage initialData={initialData} nombreUsuario={nombre} />
}
