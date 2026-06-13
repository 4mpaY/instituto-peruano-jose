'use client'

import { useRouter } from 'next/navigation'

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material'

import { styled } from '@mui/material/styles'

import CourseThumbnail from '@/utils/components/CourseThumbnail'
import UserAvatar from '@/utils/components/UserAvatar'

const StyledCard = styled(Card)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '16px',
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
  position: 'relative',
  border: 'none',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)'
  }
}))

interface MyCourseCardProps {
  titulo: string
  slug: string
  miniatura?: string
  profesor: {
    nombre: string
    apellido: string
    avatar?: string
  }
  progreso: number
  categoria?: string
  tieneAcceso: boolean
}

const MyCourseCard = ({
  titulo,
  slug,
  miniatura,
  profesor,
  progreso,
  categoria,
  tieneAcceso
}: MyCourseCardProps) => {
  const router = useRouter()

  const handleClick = () => {
    if (!tieneAcceso) return
    router.push(`/estudiante/aprender/${slug}`)
  }

  return (
    <StyledCard
      onClick={handleClick}
      sx={!tieneAcceso ? { cursor: 'not-allowed', '&:hover': { transform: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' } } : {}}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CourseThumbnail
          src={miniatura}
          title={titulo}
          aspectRatio="16/9"
          sx={{ display: 'block' }}
        />

        {!tieneAcceso && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <Chip
              label="Acceso vencido"
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.75rem',
                px: 1
              }}
            />
          </Box>
        )}

        {categoria && (
          <Chip
            label={categoria}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: 'primary.main',
              fontWeight: 800,
              borderRadius: '8px',
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: 1
            }}
          />
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              lineHeight: 1.2,
              mb: 1.5,
              color: '#1e293b',
              fontSize: '1.1rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '44px'
            }}
          >
            {titulo}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
            <UserAvatar
              src={profesor.avatar}
              name={profesor.nombre}
              apellido={profesor.apellido}
              size={24}
              sx={{ border: '1px solid #e2e8f0' }}
            />
            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
              Por {profesor.nombre} {profesor.apellido}
            </Typography>
          </Stack>

          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tu Progreso
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {Math.round(progreso)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progreso}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                }
              }}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Button
            fullWidth
            variant="contained"
            disabled={!tieneAcceso}
            onClick={e => { e.stopPropagation(); handleClick() }}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
              ...(!tieneAcceso ? {
                bgcolor: '#94a3b8 !important',
                color: 'white !important',
                boxShadow: 'none'
              } : {
                bgcolor: 'primary.main',
                boxShadow: '0 4px 12px rgba(var(--mui-palette-primary-mainChannel) / 0.2)',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: '0 6px 16px rgba(var(--mui-palette-primary-mainChannel) / 0.3)'
                }
              })
            }}
          >
            {tieneAcceso ? 'Continuar aprendiendo' : 'Acceso vencido'}
          </Button>
        </Box>
      </CardContent>
    </StyledCard>
  )
}

export default MyCourseCard
