import { redirect } from 'next/navigation'

import { getAuthSession } from '@/utils/libs/auth-helpers'


import { CourseCreatePage } from '@/features/admin/cursos/pages/CourseCreatePage'


export const metadata = {
  title: 'Crear Nuevo Curso',
  description: 'Configura un nuevo curso para el aula virtual'
}

export default async function Page() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/')
  }

  // Un profesor solo puede asignarse a sí mismo
  const profesores = [{
    id: session.user.id,
    nombre: session.user.name || 'Yo',
    apellido: ''
  }]

  return <CourseCreatePage profesores={profesores} />
}
