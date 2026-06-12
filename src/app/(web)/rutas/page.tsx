import { notFound } from 'next/navigation'

import { Container, Box } from '@mui/material'

import prisma from '@/utils/libs/prisma'
import { getConfig } from '@/utils/libs/config'
import RutasCatalog from '@/features/web/rutas/components/RutasCatalog'

async function getRutas() {
  try {
    const rutas = await prisma.rutaAprendizaje.findMany({
      where: { esta_activo: true },
      include: {
        cursos: {
          orderBy: { orden: 'asc' },
          include: {
            curso: {
              select: {
                id: true,
                titulo: true,
                miniatura: true,
                slug: true,
                precio: true,
                moneda: true,
                es_gratis: true
              }
            }
          }
        },
        _count: {
          select: { cursos: true }
        }
      },
      orderBy: { creado_en: 'desc' }
    })

    return rutas.map(ruta => ({
      ...ruta,
      total_cursos: ruta._count.cursos,
      cursos: ruta.cursos.map(rc => rc.curso)
    })) as any[]
  } catch (err) {
    console.error('Error fetching routes:', err)

    return []
  }
}

export const metadata = {
  title: 'Rutas de Aprendizaje | IPG Ingenieros',
  description: 'Rutas de aprendizaje estructuradas en Gestión Ambiental, Seguridad Industrial y Calidad. Progresa de principiante a experto con certificados verificables.',
  alternates: { canonical: 'https://ipgingenierosperu.com/rutas' },
  openGraph: {
    title: 'Rutas de Aprendizaje — IPG Ingenieros',
    description: 'Colecciones curadas de cursos para llevarte de principiante a experto en Gestión Ambiental, Seguridad y Calidad.',
    url: 'https://ipgingenierosperu.com/rutas',
    type: 'website',
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'Rutas de Aprendizaje IPG Ingenieros' }],
  },
}

export default async function RutasIndexPage() {
  const habilitado = await getConfig('WEB_RUTAS_HABILITADO', 'true')

  if (habilitado !== 'true') notFound()

  const rutas = await getRutas()

  return (
    <>
      {/* ── 1. HERO RUTAS ─────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--web-dark-deep, #012d22) 0%, var(--web-dark, #025E44) 45%, var(--web-dark-mid, #0f4438) 100%)',
          padding: '6rem 1.5rem 5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow */}
        <div aria-hidden style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--web-primary-rgb, 37, 146, 127),0.22) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1.5rem',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(var(--web-light-rgb, 189, 217, 98),0.12)',
                border: '1px solid rgba(var(--web-light-rgb, 189, 217, 98),0.25)',
                borderRadius: '999px',
                padding: '0.375rem 1rem',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--web-light, #BDD962)', boxShadow: '0 0 6px var(--web-light, #BDD962)' }} />
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: 'var(--web-light, #BDD962)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Catálogo Completo
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
              }}
            >
              Nuestras <span style={{ color: 'var(--web-light, #BDD962)' }}>Rutas</span> de Aprendizaje
            </h1>

            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.125rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.75,
                marginBottom: '1rem',
              }}
            >
              Explora nuestros caminos de aprendizaje especializados, diseñados para llevarte paso a paso hacia el dominio de nuevas habilidades y tecnologías emergentes.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. CONTENIDO / CATÁLOGO ─────────────────────── */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#f8fafc', flexGrow: 1, minHeight: '60vh' }}>
        <Container maxWidth="lg">
          <RutasCatalog initialRutas={rutas} />
        </Container>
      </Box>
    </>
  )
}
