'use client'

import { useRouter } from 'next/navigation'

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'

import CourseThumbnail from '@/utils/components/CourseThumbnail'
import UserAvatar from '@/utils/components/UserAvatar'
import type { DashboardCurso } from '../entity/Dashboard'

interface Props {
  cursos: DashboardCurso[]
  loading?: boolean
}

function CursoCard({ curso }: { curso: DashboardCurso }) {
  const router = useRouter()

  return (
    <Card
      onClick={() => router.push(`/estudiante/aprender/${curso.slug}`)}
      sx={{
        display: 'flex',
        borderRadius: '14px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(0,0,0,0.09)',
          transform: 'translateY(-3px)'
        }
      }}
    >
      {/* Thumbnail */}
      <Box sx={{ width: 120, flexShrink: 0, position: 'relative' }}>
        <CourseThumbnail
          src={curso.miniatura}
          title={curso.titulo}
          sx={{ height: '100%', minHeight: 100 }}
        />
        {curso.categoria && (
          <Chip
            label={curso.categoria}
            size='small'
            sx={{
              position: 'absolute',
              top: 6,
              left: 6,
              fontSize: '0.58rem',
              fontWeight: 800,
              height: 20,
              bgcolor: 'rgba(255,255,255,0.92)',
              color: 'primary.main',
              backdropFilter: 'blur(4px)'
            }}
          />
        )}
      </Box>

      {/* Content */}
      <CardContent sx={{ flex: 1, p: '14px 16px !important', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography
          variant='subtitle2'
          sx={{
            fontWeight: 800,
            lineHeight: 1.3,
            color: 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {curso.titulo}
        </Typography>

        <Stack direction='row' spacing={0.75} alignItems='center'>
          <UserAvatar
            src={undefined}
            name={curso.profesor.nombre}
            apellido={curso.profesor.apellido}
            size={18}
          />
          <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
            {curso.profesor.nombre} {curso.profesor.apellido}
          </Typography>
        </Stack>

        <Box sx={{ mt: 'auto' }}>
          <Stack direction='row' justifyContent='space-between' sx={{ mb: 0.5 }}>
            <Typography variant='caption' sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem' }}>
              Progreso
            </Typography>
            <Typography variant='caption' sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.68rem' }}>
              {Math.round(curso.progreso)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant='determinate'
            value={curso.progreso}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}

function CursoCardSkeleton() {
  return (
    <Card sx={{ display: 'flex', borderRadius: '14px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <Skeleton variant='rectangular' width={120} height={110} />
      <CardContent sx={{ flex: 1, p: '14px 16px !important' }}>
        <Skeleton variant='text' width='85%' height={20} />
        <Skeleton variant='text' width='55%' height={16} sx={{ mt: 0.5 }} />
        <Skeleton variant='rectangular' height={6} sx={{ mt: 2, borderRadius: 3 }} />
      </CardContent>
    </Card>
  )
}

export default function CursosEnProgreso({ cursos, loading }: Props) {
  if (!loading && cursos.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 6,
          px: 3,
          borderRadius: '16px',
          border: '2px dashed',
          borderColor: 'divider'
        }}
      >
        <i className='tabler-books' style={{ fontSize: 48, color: 'var(--mui-palette-text-disabled)' }} />
        <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 700, mt: 1.5 }}>
          Aún no tienes cursos en progreso
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, mb: 2.5 }}>
          Explora el catálogo y empieza tu primer curso hoy.
        </Typography>
        <Button
          variant='contained'
          href='/cursos'
          size='small'
          startIcon={<i className='tabler-search' />}
          sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}
        >
          Explorar cursos
        </Button>
      </Box>
    )
  }

  return (
    <Grid container spacing={2.5}>
      {loading
        ? [1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} key={i}>
              <CursoCardSkeleton />
            </Grid>
          ))
        : cursos.map(curso => (
            <Grid item xs={12} sm={6} key={curso.id}>
              <CursoCard curso={curso} />
            </Grid>
          ))}
    </Grid>
  )
}
