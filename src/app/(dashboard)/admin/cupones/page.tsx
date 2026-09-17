import { redirect } from 'next/navigation'

import { getAuthSession } from '@/utils/libs/auth-helpers'


import { CuponesPage } from '@/features/admin/cupones/pages/CuponesPage'
import { AxiosCupon } from '@/features/admin/cupones/http/axiosCupon'
import { AxiosCursoAdmin } from '@/features/admin/cursos/http/axiosCursoAdmin'


export const metadata = {
  title: 'Gestión de Cupones | Aula Virtual'
}

export default async function Page() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/')
  }

  const token = session.user?.accessToken ?? null

  const axiosCupon = new AxiosCupon({ getAuthToken: () => token })
  const axiosCursoAdmin = new AxiosCursoAdmin({ getAuthToken: () => token })

  let initialData: Awaited<ReturnType<typeof axiosCupon.getAll>> = []
  let cursosDisponibles: Awaited<ReturnType<typeof axiosCursoAdmin.getLista>> = []

  const [cuponesResult, cursosResult] = await Promise.allSettled([
    axiosCupon.getAll(),
    axiosCursoAdmin.getLista()
  ])

  if (cuponesResult.status === 'fulfilled') {
    initialData = cuponesResult.value
  } else {
    console.error('Error fetching cupones:', cuponesResult.reason)
  }

  if (cursosResult.status === 'fulfilled') {
    cursosDisponibles = cursosResult.value
  } else {
    console.error('Error fetching cursos lista:', cursosResult.reason)
  }

  return <CuponesPage initialData={initialData} cursosInitialData={cursosDisponibles} />
}
