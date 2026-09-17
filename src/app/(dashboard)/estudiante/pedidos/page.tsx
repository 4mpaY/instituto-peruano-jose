import { redirect } from 'next/navigation'

import { getAuthSession } from '@/utils/libs/auth-helpers'

import { MisPedidosPage } from '@/features/estudiante/mis-pedidos/pages/MisPedidosPage'
import { AxiosPedidoEstudiante } from '@/features/estudiante/mis-pedidos/http/axiosPedidoEstudiante'

import type { PedidoEstudiante } from '@/features/estudiante/mis-pedidos/entity/PedidoEstudiante'

export const metadata = {
  title: 'Mis Pedidos | Aula Virtual'
}

export default async function Page() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/')
  }

  const token = session.user?.accessToken ?? null

  const axiosPedido = new AxiosPedidoEstudiante({
    getAuthToken: () => token
  })

  let initialData: PedidoEstudiante[] = []

  try {
    const result = await axiosPedido.getAll({ estado: 'TODOS' })

    initialData = result.pedidos ?? []
  } catch (error) {
    console.error('Error fetching mis-pedidos:', error)
  }

  return <MisPedidosPage initialData={initialData} />
}
