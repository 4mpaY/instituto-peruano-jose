'use client'

import { useEffect } from 'react'

import { Box, Button, Grid, MenuItem, Typography, CircularProgress } from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSnackbar } from 'notistack'
import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import AppModal from '@/utils/components/AppModal'
import CustomTextField from '@core/components/mui/TextField'
import type { Pedido } from '../entity/Pedido'

type GestionarEnvioFisicoModalProps = {
  open: boolean
  handleClose: () => void
  pedido: Pedido | null
}

const updateEnvioSchema = z.object({
  estado_envio: z.enum(['En origen', 'En tránsito', 'Listo para recojo', 'Entregado', 'Hubo un error']),
  empresa_transportista: z.string().min(1, 'La empresa es requerida'),
  numero_seguimiento: z.string().min(1, 'El número de seguimiento es requerido'),
  numero_recojo: z.string().optional().nullable(),
  error_telefono: z.string().optional().nullable(),
})

type UpdateEnvioForm = z.infer<typeof updateEnvioSchema>

export default function GestionarEnvioFisicoModal({ open, handleClose, pedido }: GestionarEnvioFisicoModalProps) {
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<UpdateEnvioForm>({
    resolver: zodResolver(updateEnvioSchema),
    defaultValues: {
      estado_envio: 'En tránsito',
      empresa_transportista: 'Olva Courier',
      numero_seguimiento: '',
      numero_recojo: '',
      error_telefono: ''
    }
  })

  const estadoEnvio = watch('estado_envio')

  useEffect(() => {
    if (pedido?.datos_envio) {
      const data = pedido.datos_envio as any

      reset({
        estado_envio: data.estado_envio || 'En tránsito',
        empresa_transportista: data.empresa_transportista || (data.metodo === 'SHALOM' ? 'Shalom' : 'Olva Courier'),
        numero_seguimiento: data.numero_seguimiento || '',
        numero_recojo: data.numero_recojo || '',
        error_telefono: data.error_telefono || ''
      })
    }
  }, [pedido, reset])

  const mutation = useMutation({
    mutationFn: async (data: UpdateEnvioForm) => {
      const response = await axios.patch(`/api/admin/pedidos/${pedido?.id}/envio`, data)

      
return response.data
    },
    onSuccess: () => {
      enqueueSnackbar('Datos de envío actualizados', { variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pedido', pedido?.id] })
      handleClose()
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'Error al actualizar', { variant: 'error' })
    }
  })

  const onSubmit = (data: UpdateEnvioForm) => {
    mutation.mutate(data)
  }

  const title = `Actualizar envío`

  return (
    <AppModal open={open} handleClose={handleClose} title={title}>
      {pedido && (
        <Typography variant='body2' sx={{ mb: 4, mt: -2 }} color='text.secondary'>
          {pedido.usuario?.nombre} {pedido.usuario?.apellido} · {pedido.detalles?.[0]?.curso?.titulo || 'Certificado'}
        </Typography>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Controller
              name='estado_envio'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label='Estado del envío'
                  error={!!errors.estado_envio}
                  helperText={errors.estado_envio?.message}
                >
                  <MenuItem value='En origen'>En origen</MenuItem>
                  <MenuItem value='En tránsito'>En tránsito</MenuItem>
                  <MenuItem value='Listo para recojo'>Listo para recojo</MenuItem>
                  <MenuItem value='Entregado'>Entregado</MenuItem>
                  <MenuItem value='Hubo un error'>Hubo un error</MenuItem>
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='empresa_transportista'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  select
                  fullWidth
                  label='Empresa transportista *'
                  error={!!errors.empresa_transportista}
                  helperText={errors.empresa_transportista?.message}
                >
                  <MenuItem value='Olva Courier'>Olva Courier</MenuItem>
                  <MenuItem value='Shalom'>Shalom</MenuItem>
                </CustomTextField>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='numero_seguimiento'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Número de seguimiento *'
                  error={!!errors.numero_seguimiento}
                  helperText={errors.numero_seguimiento?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name='numero_recojo'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Clave o número de recojo (Opcional)'
                  error={!!errors.numero_recojo}
                  helperText={errors.numero_recojo?.message}
                />
              )}
            />
          </Grid>

          {estadoEnvio === 'Hubo un error' && (
            <Grid item xs={12}>
              <Controller
                name='error_telefono'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Teléfono para que el usuario se comunique *'
                    error={!!errors.error_telefono}
                    helperText={errors.error_telefono?.message || 'Ingresa el número al que debe llamar el usuario'}
                  />
                )}
              />
            </Grid>
          )}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 6 }}>
          <Button variant='tonal' color='secondary' onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant='contained' type='submit' disabled={mutation.isPending}>
            {mutation.isPending ? <CircularProgress size={24} /> : 'Guardar cambios'}
          </Button>
        </Box>
      </form>
    </AppModal>
  )
}
