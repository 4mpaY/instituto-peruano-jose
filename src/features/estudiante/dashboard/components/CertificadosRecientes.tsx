'use client'

import { useState } from 'react'

import { useSession } from 'next-auth/react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { useSnackbar } from 'notistack'

import { AxiosMisCertificados } from '@/features/estudiante/certificados/http/axiosMisCertificados'
import type { DashboardCertificado } from '../entity/Dashboard'

const NIVEL_LABELS: Record<string, string> = {
  BASICO: 'Básico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
  TODOS: 'Todos los niveles'
}

interface Props {
  certificados: DashboardCertificado[]
  loading?: boolean
}

function CertCard({ cert }: { cert: DashboardCertificado }) {
  const { data: session } = useSession()
  const { enqueueSnackbar } = useSnackbar()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)

    try {
      const token = session?.user?.accessToken ?? null
      const client = new AxiosMisCertificados({ getAuthToken: () => token })
      const blob = await client.downloadPdf(cert.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `certificado-${cert.codigo_verificacion}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      enqueueSnackbar('Error al descargar el certificado', { variant: 'error' })
    } finally {
      setDownloading(false)
    }
  }

  const fecha = new Date(cert.emitido_en).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <Card
      sx={{
        borderRadius: '14px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        transition: 'all 0.25s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(0,0,0,0.09)',
          transform: 'translateY(-3px)'
        }
      }}
    >
      {cert.curso.miniatura ? (
        <CardMedia
          component='img'
          height={110}
          image={cert.curso.miniatura}
          alt={cert.curso.titulo}
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={{
            height: 110,
            background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-dark) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <i className='tabler-certificate' style={{ fontSize: 44, color: 'rgba(255,255,255,0.7)' }} />
          {cert.curso.nivel && (
            <Chip
              label={NIVEL_LABELS[cert.curso.nivel] ?? cert.curso.nivel}
              size='small'
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.45)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.65rem'
              }}
            />
          )}
        </Box>
      )}

      <CardContent sx={{ flex: 1, p: '14px 16px', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography
          variant='subtitle2'
          sx={{
            fontWeight: 800,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {cert.curso.titulo}
        </Typography>

        <Typography variant='caption' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <i className='tabler-calendar-check' style={{ fontSize: '0.85rem' }} />
          {fecha}
        </Typography>

        <Box
          sx={{
            mt: 'auto',
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1
          }}
        >
          <Button
            fullWidth
            variant='contained'
            size='small'
            onClick={handleDownload}
            disabled={downloading}
            startIcon={<i className='tabler-download' />}
            sx={{ borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'none' }}
          >
            {downloading ? 'Descargando...' : 'Descargar'}
          </Button>
          <Tooltip title='Verificar certificado'>
            <IconButton
              size='small'
              href={`/verificar-certificado/${cert.codigo_verificacion}`}
              target='_blank'
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', px: 1 }}
            >
              <i className='tabler-external-link' style={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  )
}

function CertSkeleton() {
  return (
    <Card sx={{ borderRadius: '14px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <Skeleton variant='rectangular' height={110} />
      <CardContent sx={{ p: '14px 16px' }}>
        <Skeleton variant='text' width='80%' height={20} />
        <Skeleton variant='text' width='50%' height={16} />
        <Skeleton variant='rectangular' height={32} sx={{ mt: 1.5, borderRadius: '8px' }} />
      </CardContent>
    </Card>
  )
}

export default function CertificadosRecientes({ certificados, loading }: Props) {
  if (!loading && certificados.length === 0) {
    return (
      <Stack alignItems='center' spacing={1.5} sx={{ py: 4 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i className='tabler-certificate' style={{ fontSize: 28, color: 'var(--mui-palette-text-disabled)' }} />
        </Box>
        <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 600, textAlign: 'center' }}>
          Aún no tienes certificados. ¡Completa un curso para obtener el tuyo!
        </Typography>
      </Stack>
    )
  }

  return (
    <Grid container spacing={2.5}>
      {loading
        ? [1, 2, 3].map(i => (
            <Grid item xs={12} sm={4} key={i}>
              <CertSkeleton />
            </Grid>
          ))
        : certificados.map(cert => (
            <Grid item xs={12} sm={4} key={cert.id}>
              <CertCard cert={cert} />
            </Grid>
          ))}
    </Grid>
  )
}
