import React from 'react'

import { Box, Container } from '@mui/material'

import LibroReclamacionesForm from '@/features/web/legal/components/LibroReclamacionesForm'

export const metadata = {
  title: 'Libro de Reclamaciones | ARM Asset Reliability Management',
  description: 'Libro de reclamaciones virtual para el registro de quejas y reclamos conforme a la ley peruana.',
}

export default function LibroReclamacionesPage() {
  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <LibroReclamacionesForm />
      </Container>
    </Box>
  )
}
