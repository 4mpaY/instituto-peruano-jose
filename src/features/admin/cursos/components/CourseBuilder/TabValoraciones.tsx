'use client'

import { useEffect, useState } from 'react'

import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Rating,
  Divider,
  Stack,
  Card,
  Grid
} from '@mui/material'
import { useSession } from 'next-auth/react'

import { AxiosCurso } from '../../http/axiosCurso'

interface TabValoracionesProps {
  cursoId: string
}

export function TabValoraciones({ cursoId }: TabValoracionesProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ promedio: number; total: number; valoraciones: any[] } | null>(null)

  useEffect(() => {
    const fetchValoraciones = async () => {
      try {
        setLoading(true)

        const axiosCurso = new AxiosCurso({
          getAuthToken: () => session?.user?.accessToken ?? null
        })

        const res = await axiosCurso.getValoraciones(cursoId)

        setData(res)
      } catch (error) {
        console.error('Error fetching valoraciones:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.accessToken) {
      fetchValoraciones()
    }
  }, [cursoId, session])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data || data.total === 0) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <i className='tabler-star text-[48px] text-textDisabled mb-2' />
        <Typography variant='h6' color='text.secondary'>
          No hay valoraciones para este curso aún
        </Typography>
        <Typography variant='body2' color='text.disabled'>
          Las calificaciones de los alumnos aparecerán aquí una vez que califiquen el curso.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={6} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 5, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant='h2' color='primary' fontWeight={700}>
              {data.promedio.toFixed(1)}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
              <Rating value={data.promedio} precision={0.1} readOnly size='large' />
            </Box>
            <Typography variant='body2' color='text.secondary'>
              Basado en {data.total} {data.total === 1 ? 'valoración' : 'valoraciones'}
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Typography variant='h6' sx={{ mb: 4 }}>Resumen de Calificaciones</Typography>
          <Stack spacing={3}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.valoraciones.filter(v => v.puntuacion === star).length
              const percentage = (count / data.total) * 100

              return (
                <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Typography variant='body2' sx={{ minWidth: 60 }}>{star} estrellas</Typography>
                  <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: 'warning.main' }} />
                  </Box>
                  <Typography variant='body2' sx={{ minWidth: 40, textAlign: 'right' }}>{count}</Typography>
                </Box>
              )
            })}
          </Stack>
        </Grid>
      </Grid>

      <Divider sx={{ my: 6 }} />

      <Typography variant='h6' sx={{ mb: 4 }}>Reseñas de los Alumnos</Typography>
      
      <Stack spacing={4}>
        {data.valoraciones.map((val) => (
          <Box key={val.id} sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar src={val.usuario.avatar} alt={val.usuario.nombre}>
                  {val.usuario.nombre[0]}
                </Avatar>
                <Box>
                  <Typography variant='body1' fontWeight={600}>
                    {val.usuario.nombre} {val.usuario.apellido}
                  </Typography>
                  <Typography variant='caption' color='text.disabled'>
                    {new Date(val.creado_en).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              <Rating value={val.puntuacion} readOnly size='small' />
            </Box>
            
            {val.comentario ? (
              <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 2 }}>
                &quot;{val.comentario}&quot;
              </Typography>
            ) : (
              <Typography variant='caption' color='text.disabled' sx={{ fontStyle: 'italic' }}>
                Sin comentario
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
