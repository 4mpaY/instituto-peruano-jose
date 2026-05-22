import { redirect } from 'next/navigation'

import type { Metadata } from 'next'

import { UsuariosPage } from '@/features/admin/usuarios/pages/UsuariosPage'
import type { Usuario } from '@/features/admin/usuarios/entity/Usuario'
import { getAuthSession } from '@/utils/libs/auth-helpers'
import { AxiosUsuario } from '@/features/admin/usuarios/http/axiosUsuario'

export const metadata: Metadata = {
  title: 'Gestión de Usuarios',
  description: 'Administra los usuarios del sistema'
}

export default async function Page() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/login')
  }

  const token = session.user?.accessToken ?? null

  const axiosUsuario = new AxiosUsuario({
    getAuthToken: () => token
  })

  let initialData: Usuario[] = []
  let total = 0

  try {
    const response = await axiosUsuario.searchAll()

    initialData = response.usuarios
    total = response.paginacion.total
  } catch (error) {
    console.error('Error fetching usuarios:', error)
  }

  return <UsuariosPage initialDataUsuarios={initialData} initialTotal={total} />
}
