'use client'

import { useEffect, useState } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Typography,
  Rating,
  TextField,
  CircularProgress,
  Stack
} from '@mui/material'
import axios from 'axios'
import { toast } from 'react-toastify'

import AppModal from '@/utils/components/AppModal'
import { valoracionSchema, type ValoracionFormData } from '@/schemas/valoracion.schema'

interface RatingModalProps {
  open: boolean
  handleClose: () => void
  cursoSlug: string
  cursoTitulo: string
  onSuccess?: () => void
}

const RatingModal = ({ open, handleClose, cursoSlug, cursoTitulo, onSuccess }: RatingModalProps) => {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ValoracionFormData>({
    resolver: zodResolver(valoracionSchema),
    defaultValues: {
      puntuacion: 0,
      comentario: ''
    }
  })

  // Cargar valoración previa si existe
  useEffect(() => {
    if (open && cursoSlug) {
      const fetchValoracion = async () => {
        try {
          setFetching(true)
          const res = await axios.get(`/api/estudiante/cursos/${cursoSlug}/valoracion`)

          if (res.data.status && res.data.result.valoracion) {
            const { puntuacion, comentario } = res.data.result.valoracion

            setValue('puntuacion', puntuacion)
            setValue('comentario', comentario || '')
          } else {
            reset({ puntuacion: 0, comentario: '' })
          }
        } catch (error) {
          console.error('Error al cargar valoración:', error)
        } finally {
          setFetching(false)
        }
      }

      fetchValoracion()
    }
  }, [open, cursoSlug, setValue, reset])

  const onSubmit = async (data: ValoracionFormData) => {
    try {
      setLoading(true)
      const res = await axios.post(`/api/estudiante/cursos/${cursoSlug}/valoracion`, data)

      if (res.data.status) {
        toast.success('¡Gracias por calificar este curso!')
        if (onSuccess) onSuccess()
        handleClose()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar la calificación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppModal open={open} handleClose={handleClose}>
      <Box sx={{ p: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, textAlign: 'center' }}>
          Califica este curso
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Tu opinión nos ayuda a mejorar. Cuéntanos qué te pareció <strong>{cursoTitulo}</strong>.
        </Typography>

        {fetching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} color="primary" />
          </Box>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4} alignItems="center">
              <Box sx={{ textAlign: 'center' }}>
                <Controller
                  name="puntuacion"
                  control={control}
                  render={({ field }) => (
                    <Rating
                      {...field}
                      size="large"
                      precision={1}
                      onChange={(_, value) => field.onChange(value)}
                      sx={{ fontSize: '3rem', color: '#FFB400' }}
                    />
                  )}
                />
                {errors.puntuacion && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                    {errors.puntuacion.message}
                  </Typography>
                )}
              </Box>

              <Controller
                name="comentario"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Escribe tu reseña aquí (opcional)..."
                    variant="outlined"
                    error={!!errors.comentario}
                    helperText={errors.comentario?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: 'action.hover'
                      }
                    }}
                  />
                )}
              />

              <Box sx={{ width: '100%', display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleClose}
                  disabled={loading}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, py: 1.5 }}
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.5,
                    bgcolor: '#025E44',
                    '&:hover': { bgcolor: '#014d36' },
                    boxShadow: 'none'
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar calificación'}
                </Button>
              </Box>
            </Stack>
          </form>
        )}
      </Box>
    </AppModal>
  )
}

export default RatingModal
