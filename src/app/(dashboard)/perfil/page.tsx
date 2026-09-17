import { redirect } from 'next/navigation'

import { Typography, Container, Box } from '@mui/material'

import { getAuthSession } from '@/utils/libs/auth-helpers'


import { AxiosPerfil } from '@/features/perfil/http/axiosPerfil'
import UserProfileForm from '@/features/perfil/components/UserProfileForm'

export const metadata = {
  title: 'Mi Perfil | Aula Virtual',
  description: 'Gestiona tu perfil personal'
}

export default async function PerfilPage() {
  const session = await getAuthSession()

  if (!session?.user?.email) {
    redirect('/')
  }

  const token = session.user?.accessToken ?? null

  const axiosPerfil = new AxiosPerfil({
    getAuthToken: () => token
  })

  let user = null

  try {
    user = await axiosPerfil.get(token)
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }

  if (!user) {
    redirect('/')
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
          Mi Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona tu información personal y detalles de tu cuenta.
        </Typography>
      </Box>

      {/* Aquí insertamos el componente cliente que maneja el formulario */}
      <UserProfileForm user={{ ...user, numero_documento: user.numero_documento || '' }} />
    </Container>
  )
}
