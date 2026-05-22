export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { Box } from '@mui/material'

import { ConfiguracionView } from '@/features/admin/configuracion/components/ConfiguracionView'
import { getAuthSession } from '@/utils/libs/auth-helpers'
import prisma from '@/utils/libs/prisma'

export const metadata = {
  title: 'Configuración del Sistema | Aula Virtual'
}

export default async function Page() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/login')
  }

  let initialData: any[] = []

  try {
    initialData = await prisma.configuracion.findMany({ orderBy: { clave: 'asc' } })
  } catch (error) {
    console.error('Error fetching system config:', error)
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ConfiguracionView initialData={initialData} />
      </Box>
    </Box>
  )
}
