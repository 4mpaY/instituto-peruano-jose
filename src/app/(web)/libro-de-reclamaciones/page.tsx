import React from 'react'

import { Box, Container } from '@mui/material'

import LibroReclamacionesForm from '@/features/web/legal/components/LibroReclamacionesForm'

export const metadata = {
  title: 'Libro de Reclamaciones | IPG Ingenieros',
  description: 'Libro de reclamaciones virtual de IPG Ingenieros. Registre quejas y reclamos conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571) y INDECOPI.',
  alternates: { canonical: 'https://ipgingenierosperu.com/libro-de-reclamaciones' },
  robots: { index: true, follow: false },
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
