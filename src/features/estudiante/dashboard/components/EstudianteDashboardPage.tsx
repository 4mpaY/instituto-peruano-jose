'use client'

import { useSession } from 'next-auth/react'
import { Box, Button, Grid, Skeleton, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'

import { AxiosDashboard } from '../http/axiosDashboard'
import type { DashboardData } from '../entity/Dashboard'
import KpiCard from './KpiCard'
import CursosEnProgreso from './CursosEnProgreso'
import CertificadosRecientes from './CertificadosRecientes'

const KPI_CONFIG = [
  {
    key: 'totalInscritos' as const,
    label: 'Cursos inscritos',
    icon: 'tabler-books',
    color: '#3b82f6',
    bgColor: '#eff6ff'
  },
  {
    key: 'cursosEnProgreso' as const,
    label: 'En progreso',
    icon: 'tabler-loader',
    color: '#f59e0b',
    bgColor: '#fffbeb'
  },
  {
    key: 'cursosCompletados' as const,
    label: 'Completados',
    icon: 'tabler-circle-check',
    color: '#10b981',
    bgColor: '#ecfdf5'
  },
  {
    key: 'totalCertificados' as const,
    label: 'Certificados',
    icon: 'tabler-certificate',
    color: '#8b5cf6',
    bgColor: '#f5f3ff'
  }
]

interface Props {
  initialData?: DashboardData
  nombreUsuario?: string
}

export default function EstudianteDashboardPage({ initialData, nombreUsuario }: Props) {
  const { data: session } = useSession()

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['estudiante-dashboard'],
    queryFn: async () => {
      const token = session?.user?.accessToken ?? null
      const client = new AxiosDashboard({ getAuthToken: () => token })

      return client.getDashboard()
    },
    initialData,
    staleTime: 60_000
  })

  const kpis = data?.kpis
  const cursosRecientes = data?.cursosRecientes ?? []
  const certificadosRecientes = data?.certificadosRecientes ?? []

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = nombreUsuario ?? session?.user?.name ?? 'Estudiante'

  return (
    <Box sx={{ py: { xs: 4, md: 5 }, px: { xs: 2, sm: 4, md: 6, lg: 8 } }}>
      {/* ── Header ── */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant='h4'
          sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.2 }}
        >
          {saludo},{' '}
          {isLoading ? (
            <Skeleton component='span' width={140} sx={{ display: 'inline-block' }} />
          ) : (
            <Box component='span' sx={{ color: 'primary.main' }}>
              {nombre} 👋
            </Box>
          )}
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mt: 0.75, fontWeight: 500 }}>
          Aquí tienes un resumen de tu actividad académica.
        </Typography>
      </Box>

      {/* ── KPIs ── */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {KPI_CONFIG.map(cfg => (
          <Grid item xs={12} sm={6} lg={3} key={cfg.key}>
            <KpiCard
              icon={cfg.icon}
              label={cfg.label}
              value={kpis?.[cfg.key] ?? 0}
              color={cfg.color}
              bgColor={cfg.bgColor}
              loading={isLoading}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Cursos en progreso ── */}
      <Box sx={{ mb: 5 }}>
        <Stack
          direction='row'
          alignItems='center'
          justifyContent='space-between'
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant='h5' sx={{ fontWeight: 900 }}>
              Continúa aprendiendo
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
              Tus cursos activos ordenados por avance.
            </Typography>
          </Box>
          <Button
            variant='outlined'
            size='small'
            href='/estudiante/mis-cursos'
            startIcon={<i className='tabler-books' />}
            sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', flexShrink: 0 }}
          >
            Ver todos
          </Button>
        </Stack>

        <CursosEnProgreso cursos={cursosRecientes} loading={isLoading} />
      </Box>

      {/* ── Certificados recientes ── */}
      <Box>
        <Stack
          direction='row'
          alignItems='center'
          justifyContent='space-between'
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant='h5' sx={{ fontWeight: 900 }}>
              Mis certificados
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
              Descarga y comparte tus logros.
            </Typography>
          </Box>
          {!isLoading && certificadosRecientes.length > 0 && (
            <Button
              variant='outlined'
              size='small'
              href='/estudiante/mis-certificados'
              startIcon={<i className='tabler-certificate' />}
              sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', flexShrink: 0 }}
            >
              Ver todos
            </Button>
          )}
        </Stack>

        <CertificadosRecientes certificados={certificadosRecientes} loading={isLoading} />
      </Box>
    </Box>
  )
}
