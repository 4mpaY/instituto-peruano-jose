import { redirect } from 'next/navigation'

import type { Metadata } from 'next'

import { getAuthSession } from '@/utils/libs/auth-helpers'


import { CategoriasPage } from '@/features/admin/categorias/pages/CategoriasPage'
import type { Categoria } from '@/features/admin/categorias/entity/Categoria'
import { AxiosCategoria } from '@/features/admin/categorias/http/axiosCategoria'

export const metadata: Metadata = {
  title: 'Gestión de Categorías',
  description: 'Administra las categorías del aula virtual'
}

export default async function Page() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/login')
  }

  const token = session.user?.accessToken ?? null

  const axiosCategoria = new AxiosCategoria({
    getAuthToken: () => token
  })

  let initialData: Categoria[] = []
  let total = 0

  try {
    const response = await axiosCategoria.searchAll()

    initialData = response.categorias
    total = response.paginacion.total
  } catch (error) {
    console.error('Error fetching categorias:', error)
  }

  return <CategoriasPage initialDataCategorias={initialData} initialTotal={total} />
}
