import { redirect } from 'next/navigation'

import { getAuthSession } from '@/utils/libs/auth-helpers'

import { MiPedidoDetallePage } from '@/features/estudiante/mis-pedidos/pages/MiPedidoDetallePage'

export const metadata = {
  title: 'Detalle de Pedido | Aula Virtual'
}

export default async function Page() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/')
  }

  return <MiPedidoDetallePage />
}
