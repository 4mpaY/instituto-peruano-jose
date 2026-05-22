// Next Imports
import React from 'react'

import { Box } from '@mui/material'

// Component Imports
import CourseCatalog from '@/features/web/home/components/CourseCatalog'

// Http Client
import { AxiosWebCursos } from '@/features/web/cursos/http/axiosWebCursos'
import { getAuthSession } from '@/utils/libs/auth-helpers'

// Server Action / Data Fetching
async function getData(token: string | null) {
  try {
    const axiosWebCursos = new AxiosWebCursos({
      getAuthToken: () => token
    })

    const data = await axiosWebCursos.getCatalog()

    // Serialización manual de Decimal a Number para evitar errores en Client Components
    if (data.courses) {
      data.courses = data.courses.map((c: any) => ({
        ...c,
        precio: c.precio ? Number(c.precio) : 0,
        precio_oferta: c.precio_oferta ? Number(c.precio_oferta) : null
      }))
    }

    return data
  } catch (error) {
    console.error('Error fetching data in CursosPage via API:', error)

    return { courses: [], categories: [] }
  }
}

export const metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME} | Cursos`,
  description: 'Explora nuestra amplia variedad de cursos y comienza a aprender hoy mismo.'
}

export default async function CursosPage() {
  const session = await getAuthSession()
  const token = session?.user?.accessToken ?? null

  const { courses, categories } = await getData(token)

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
      {/* Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, var(--web-dark-deep, #012d22) 0%, var(--web-dark, #025E44) 100%)',
          py: { xs: 5, md: 7 },
          px: { xs: 3, md: 6 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(var(--web-light-rgb, 189, 217, 98),0.06)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -60, right: 80, width: 300, height: 300, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <Box sx={{ maxWidth: 1280, mx: 'auto', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              component="a"
              href="/"
              sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', '&:hover': { color: 'var(--web-light, #BDD962)' }, transition: 'color 0.2s' }}
            >
              Inicio
            </Box>
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>/</Box>
            <Box component="span" sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.8125rem', color: 'var(--web-light, #BDD962)', fontWeight: 600 }}>
              Cursos
            </Box>
          </Box>

          <Box
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              mb: 1,
              lineHeight: 1.2,
            }}
            component="h1"
          >
            Catálogo de Cursos
          </Box>
          <Box
            sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', color: 'rgba(255,255,255,0.7)', maxWidth: 520, lineHeight: 1.6 }}
            component="p"
          >
            Explora nuestra selección de cursos y comienza a aprender hoy.
          </Box>

          {/* Stats chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
            {[
              { label: `${courses.length} cursos disponibles`, icon: '📚' },
              { label: `${categories.length} categorías`, icon: '🗂️' },
            ].map(chip => (
              <Box
                key={chip.label}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 2,
                  py: 0.75,
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.8125rem',
                  color: '#ffffff',
                  fontWeight: 500,
                }}
              >
                <span>{chip.icon}</span>
                {chip.label}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <CourseCatalog courses={courses} categories={categories} />
    </Box>
  )
}
