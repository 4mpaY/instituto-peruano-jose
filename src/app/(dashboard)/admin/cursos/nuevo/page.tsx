import { redirect } from 'next/navigation'

import type { Metadata } from 'next'

import { CourseCreatePage } from '@/features/admin/cursos/pages/CourseCreatePage'
import { getAuthSession } from '@/utils/libs/auth-helpers'
import { AxiosUsuario } from '@/features/admin/usuarios/http/axiosUsuario'

export const metadata: Metadata = {
  title: 'Crear Nuevo Curso',
  description: 'Configura un nuevo curso para el aula virtual'
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

  let profesores: { id: string; nombre: string; apellido: string }[] = []

  try {
    // La API actual filtra por un rol a la vez, pedimos PROFESOR y ADMIN por separado
    const [profesoresRes, adminsRes] = await Promise.all([
      axiosUsuario.searchAll({ rol: 'PROFESOR', esta_activo: 'true' }),
      axiosUsuario.searchAll({ rol: 'ADMIN', esta_activo: 'true' })
    ])

    profesores = [...profesoresRes.usuarios, ...adminsRes.usuarios].map(p => ({
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido
    }))
  } catch (error) {
    console.error('Error fetching profesores from DB:', error)
  }

  return <CourseCreatePage profesores={profesores} />
}
