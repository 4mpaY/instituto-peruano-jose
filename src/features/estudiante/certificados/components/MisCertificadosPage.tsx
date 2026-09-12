'use client'

import { useState } from 'react'

import { useSession } from 'next-auth/react'
import {
  Box, Grid, Typography, Card, CardContent, CardMedia,
  Chip, Button, Tooltip, IconButton, Skeleton, InputAdornment
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useQuery } from '@tanstack/react-query'

import CustomTextField from '@core/components/mui/TextField'
import { AxiosMisCertificados } from '../http/axiosMisCertificados'
import type { MiCertificado } from '../entity/Certificado'
import CertificateSection from '@/features/estudiante/player/components/CertificateSection'

const NIVEL_LABELS: Record<string, string> = {
  BASICO: 'Básico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
  TODOS: 'Todos los niveles'
}

function CertificadoCard({ cert }: { cert: MiCertificado }) {
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cert.codigo_verificacion)
    enqueueSnackbar('Código copiado al portapapeles', { variant: 'success' })
  }

  const emitidoEn = new Date(cert.emitido_en).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': {
        boxShadow: 6,
        transform: 'translateY(-2px)'
      }
    }}>
      {/* Miniatura / Banner */}
      <Box sx={{ position: 'relative' }}>
        {cert.curso.miniatura ? (
          <CardMedia
            component="img"
            height={140}
            image={cert.curso.miniatura}
            alt={cert.curso.titulo}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{
            height: 140,
            background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-dark) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="tabler-certificate" style={{ fontSize: 56, color: 'rgba(255,255,255,0.7)' }} />
          </Box>
        )}

        {/* Badge nivel */}
        {cert.curso.nivel && (
          <Chip
            label={NIVEL_LABELS[cert.curso.nivel] ?? cert.curso.nivel}
            size="small"
            sx={{
              position: 'absolute', top: 10, right: 10,
              bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
              fontWeight: 600, fontSize: '0.7rem'
            }}
          />
        )}
      </Box>

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, p: 2.5 }}>
        {/* Curso */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5 }}>
          {cert.curso.titulo}
        </Typography>

        {/* Profesor */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <i className="tabler-user" style={{ fontSize: '0.85rem' }} />
          {cert.curso.profesor.nombre} {cert.curso.profesor.apellido}
        </Typography>

        {/* Fecha de emisión */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <i className="tabler-calendar-check" style={{ fontSize: '0.85rem' }} />
          Emitido el {emitidoEn}
        </Typography>

        {/* Duración */}
        {cert.curso.duracion && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <i className="tabler-clock" style={{ fontSize: '0.85rem' }} />
            {cert.curso.duracion} horas
          </Typography>
        )}

        {/* Código de verificación */}
        <Box sx={{
          mt: 'auto', pt: 1.5,
          borderTop: '1px solid', borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flexShrink: 0 }}>
              Código:
            </Typography>
            <Typography variant="caption" sx={{
              fontFamily: 'monospace', fontWeight: 700,
              color: 'primary.main', fontSize: '0.75rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {cert.codigo_verificacion}
            </Typography>
            <Tooltip title="Copiar código">
              <IconButton size="small" onClick={handleCopyCode} sx={{ ml: 'auto', flexShrink: 0 }}>
                <i className="tabler-copy" style={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Acciones */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<i className="tabler-download" />}
              onClick={handleDownload}
              disabled={downloading}
              sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.78rem' }}
            >
              {downloading ? 'Descargando...' : 'Descargar PDF'}
            </Button>
            <Tooltip title="Verificar certificado">
              <Button
                variant="outlined"
                size="small"
                href={`/verificar-certificado/${cert.codigo_verificacion}`}
                target="_blank"
                sx={{ borderRadius: 2, minWidth: 'auto', px: 1.5 }}
              >
                <i className="tabler-external-link" style={{ fontSize: '0.95rem' }} />
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Skeleton variant="rectangular" height={140} />
      <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rectangular" height={36} sx={{ mt: 1, borderRadius: 1 }} />
      </CardContent>
    </Card>
  )
}

interface MisCertificadosPageProps {
  initialCertificados: MiCertificado[]
  initialTramitables?: any[]
}

export default function MisCertificadosPage({ initialCertificados, initialTramitables = [] }: MisCertificadosPageProps) {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')

  const { data: certificados = initialCertificados, isLoading } = useQuery<MiCertificado[]>({
    queryKey: ['mis-certificados'],
    queryFn: async () => {
      const token = session?.user?.accessToken ?? null
      const client = new AxiosMisCertificados({ getAuthToken: () => token })

      return client.getAll()
    },
    initialData: initialCertificados,
    staleTime: 60_000,
    refetchOnWindowFocus: false
  })

  const tramitables = initialTramitables

  const filtered = certificados.filter(c =>
    c.curso.titulo.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo_verificacion.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ px: { xs: 2, sm: 4, md: 8, lg: 12 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
              Mis <span style={{ color: 'var(--mui-palette-primary-main)' }}>Certificados</span>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Descarga y comparte tus logros académicos.
            </Typography>
          </Box>

          {certificados.length > 0 && (
            <Chip
              icon={<i className="tabler-certificate" style={{ fontSize: '1rem' }} />}
              label={`${certificados.length} certificado${certificados.length !== 1 ? 's' : ''}`}
              color="primary"
              sx={{ fontWeight: 700, fontSize: '0.85rem', px: 1 }}
            />
          )}
        </Box>

        {tramitables.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
              Cursos pendientes de certificación
            </Typography>
            <Grid container spacing={3}>
              {tramitables.map((t: any) => (
                <Grid item xs={12} md={6} key={t.cursoId}>
                  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'visible', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 4 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 0 }}>
                        {t.titulo}
                      </Typography>
                      <Box sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column',
                        '& > div': { 
                          flex: 1, 
                          display: 'flex', 
                          flexDirection: 'column',
                          mt: 2
                        },
                        '& > div > div:last-of-type': {
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }
                      }}>
                        <CertificateSection 
                          cursoId={t.cursoId} 
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {certificados.length > 0 && (
          <Box sx={{ mb: 4, maxWidth: { xs: '100%', sm: 400 } }}>
            <CustomTextField
              fullWidth
              placeholder="Buscar por curso o código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="tabler-search text-[22px]" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <i className="tabler-x text-[22px] cursor-pointer" onClick={() => setSearch('')} />
                  </InputAdornment>
                ) : null
              }}
            />
          </Box>
        )}

        {isLoading ? (
          <Grid container spacing={4}>
            {[1, 2, 3].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <SkeletonCard />
              </Grid>
            ))}
          </Grid>
        ) : certificados.length === 0 && tramitables.length === 0 ? (
          <Box sx={{
            textAlign: 'center', py: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
          }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className="tabler-certificate" style={{ fontSize: 40, color: 'var(--mui-palette-text-secondary)' }} />
            </Box>
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700 }}>
              Aún no tienes certificados
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Completa un curso y aprueba el examen final para obtener tu primer certificado.
            </Typography>
            <Button
              variant="contained"
              href="/estudiante/mis-cursos"
              startIcon={<i className="tabler-book" />}
              sx={{ mt: 1, borderRadius: 2, fontWeight: 600 }}
            >
              Ver mis cursos
            </Button>
          </Box>
        ) : filtered.length === 0 && certificados.length > 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
              No se encontraron resultados para &quot;{search}&quot;
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {filtered.map(cert => (
              <Grid item xs={12} sm={6} md={4} key={cert.id}>
                <CertificadoCard cert={cert} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  )
}
