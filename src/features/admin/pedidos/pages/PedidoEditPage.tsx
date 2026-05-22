'use client'

import { useEffect } from 'react'

import { useParams, useRouter } from 'next/navigation'

import {
  Card, CardContent, Grid, Typography,
  Button, MenuItem, Box, Divider, Chip,
  Avatar, Stack, Paper, Alert
} from '@mui/material'
import { toast } from 'react-toastify'
import { useForm, Controller } from 'react-hook-form'

import CustomTextField from '@core/components/mui/TextField'
import HydratedDate from '@/utils/components/HydratedDate'
import { usePedido, useUpdatePedido } from '../hooks/usePedidos'
import type { Pedido } from '../entity/Pedido'

const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'warning' },
  { value: 'PROCESANDO', label: 'Procesando', color: 'info' },
  { value: 'COMPLETADO', label: 'Completado (Pagado)', color: 'success' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'secondary' },
  { value: 'REEMBOLSADO', label: 'Reembolsado', color: 'error' }
] as const

const METODOS_PAGO = [
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito', icon: 'tabler-credit-card' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito', icon: 'tabler-credit-card' },
  { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria', icon: 'tabler-building-bank' },
  { value: 'YAPE', label: 'Yape', icon: 'tabler-device-mobile' },
  { value: 'PLIN', label: 'Plin', icon: 'tabler-device-mobile' },
  { value: 'PAYPAL', label: 'PayPal', icon: 'tabler-brand-paypal' },
  { value: 'IZIPAY', label: 'Izipay', icon: 'tabler-credit-card' },
  { value: 'CULQI', label: 'Culqi', icon: 'tabler-credit-card' },
  { value: 'OTRO', label: 'Otro', icon: 'tabler-dots' }
]

const estadoColor: Record<string, 'warning' | 'info' | 'success' | 'secondary' | 'error' | 'default'> = {
  PENDIENTE: 'warning', PROCESANDO: 'info', COMPLETADO: 'success',
  CANCELADO: 'secondary', REEMBOLSADO: 'error'
}

export function PedidoEditPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const { data, isLoading } = usePedido(id as string)
  const { mutateAsync: updatePedido, isPending } = useUpdatePedido()

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      estado: '',
      metodo_pago: '',
      mensaje: '',
      tipo_comprobante: '',
      numero_comprobante: ''
    }
  })

  useEffect(() => {
    if (data?.data) {
      const p = data.data as Pedido

      reset({
        estado: p.estado || 'PENDIENTE',
        metodo_pago: p.metodo_pago || 'TRANSFERENCIA',
        mensaje: p.mensaje || '',
        tipo_comprobante: p.tipo_comprobante || '',
        numero_comprobante: p.numero_comprobante || ''
      })
    }
  }, [data, reset])

  const onSubmit = async (formData: any) => {

    if (!formData.estado || !formData.metodo_pago) {
      return toast.error('El estado y método de pago son requeridos')
    }

    try {
      await updatePedido({
        id: id as string,
        data: {
          estado: formData.estado as Pedido['estado'],
          metodo_pago: formData.metodo_pago as Pedido['metodo_pago'],
          mensaje: formData.mensaje || null,
          tipo_comprobante: formData.tipo_comprobante || null,
          numero_comprobante: formData.numero_comprobante || null
        } as any
      })

      toast.success('Pedido actualizado con éxito')
      router.push('/admin/pedidos')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el pedido')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction='row' alignItems='center' spacing={2} sx={{ py: 4 }}>
            <i className='tabler-loader-2 animate-spin' style={{ fontSize: 24, color: '#aaa' }} />
            <Typography color='text.secondary'>Cargando información del pedido...</Typography>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  const pedido = data?.data as Pedido

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

      {/* ── ENCABEZADO ── */}
      <Stack direction='row' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={2}>
        <Stack direction='row' alignItems='center' spacing={2}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'primary.lighterOpacity', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='tabler-receipt text-primary' style={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant='h5' fontWeight={800}>
              Pedido #{String(pedido?.numero_pedido || '').padStart(6, '0')}
            </Typography>
            {pedido?.creado_en && (
              <Typography variant='caption' color='text.secondary'>
                Registrado el <HydratedDate date={pedido.creado_en} format='locale' />
              </Typography>
            )}
          </Box>
        </Stack>
        <Chip
          label={ESTADOS.find(e => e.value === pedido?.estado)?.label || pedido?.estado}
          color={estadoColor[pedido?.estado] || 'default'}
          variant='tonal'
          sx={{ fontWeight: 700, fontSize: '0.8125rem', px: 1 }}
        />
      </Stack>

      <Grid container spacing={4}>

        {/* ── COLUMNA IZQUIERDA ── */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>

            {/* Estudiante */}
            <Card>
              <CardContent>
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ letterSpacing: 1 }}>
                  Estudiante
                </Typography>
                <Stack direction='row' alignItems='center' spacing={2} sx={{ mt: 1.5 }}>
                  <Avatar src={pedido?.usuario?.avatar || ''} sx={{ width: 48, height: 48 }}>
                    {pedido?.usuario?.nombre?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant='subtitle1' fontWeight={700}>
                      {pedido?.usuario?.nombre} {pedido?.usuario?.apellido}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>{pedido?.usuario?.correo}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Cursos */}
            <Card>
              <CardContent>
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ letterSpacing: 1, mb: 2, display: 'block' }}>
                  Cursos Adquiridos
                </Typography>
                <Stack spacing={2}>
                  {pedido?.detalles?.map((d: any) => (
                    <Stack key={d.id} direction='row' alignItems='center' spacing={2}>
                      <Avatar
                        src={d.curso?.miniatura || ''}
                        variant='rounded'
                        sx={{ width: 48, height: 36, bgcolor: 'action.selected' }}
                      >
                        <i className='tabler-book' style={{ fontSize: 16 }} />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant='body2' fontWeight={600}>{d.curso?.titulo}</Typography>
                      </Box>
                      <Typography variant='body2' fontWeight={700} color='primary.main'>
                        {pedido.moneda} {Number(d.subtotal).toFixed(2)}
                      </Typography>
                    </Stack>
                  ))}
                  <Divider />
                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='subtitle2' color='text.secondary'>Total del pedido</Typography>
                    <Typography variant='subtitle1' fontWeight={800} color='success.main'>
                      {pedido?.moneda} {Number(pedido?.total || 0).toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Voucher */}
            {pedido?.comprobante_url && (
              <Card>
                <CardContent>
                  <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
                    <Stack direction='row' alignItems='center' spacing={1.5}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'success.lighterOpacity', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className='tabler-photo-check' style={{ fontSize: 18, color: '#25927F' }} />
                      </Box>
                      <Box>
                        <Typography variant='subtitle2' fontWeight={700}>Comprobante de Pago</Typography>
                        {pedido.comprobante_subido_en && (
                          <Typography variant='caption' color='text.secondary'>
                            Subido el <HydratedDate date={pedido.comprobante_subido_en} format='locale' />
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                    <Chip label='Recibido' color='success' size='small' variant='tonal' icon={<i className='tabler-check' style={{ fontSize: 13 }} />} />
                  </Stack>

                  <Box
                    component='img'
                    src={pedido.comprobante_url}
                    alt='Comprobante'
                    onClick={() => window.open(pedido.comprobante_url!, '_blank')}
                    sx={{
                      width: '100%', maxHeight: 340, objectFit: 'contain',
                      borderRadius: 2, border: '1.5px solid', borderColor: 'divider',
                      bgcolor: '#f8fafc', cursor: 'zoom-in',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.01)' }
                    }}
                  />
                  <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                    Click en la imagen para verla en tamaño completo
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Formulario de edición */}
            <Card component='form' onSubmit={handleSubmit(onSubmit)}>
              <CardContent>
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ letterSpacing: 1, mb: 2, display: 'block' }}>
                  Editar Pedido
                </Typography>

                <Alert
                  severity='warning'
                  icon={<i className='tabler-alert-triangle' style={{ fontSize: 20 }} />}
                  sx={{ mb: 3, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.8125rem' } }}
                >
                  Cambiar el estado a <strong>COMPLETADO</strong> inscribirá al estudiante automáticamente.
                  Cambiar de Completado a Cancelado/Reembolsado <strong>revocará los accesos irreversiblemente</strong>.
                </Alert>

                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='estado'
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          select
                          fullWidth
                          label='Estado del Pedido'
                          required
                        >
                          {ESTADOS.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                          ))}
                        </CustomTextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='metodo_pago'
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          select
                          fullWidth
                          label='Método de Pago'
                          required
                        >
                          {METODOS_PAGO.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>
                              <Stack direction='row' alignItems='center' spacing={1.5}>
                                <i className={`${opt.icon} text-textSecondary`} style={{ fontSize: 16 }} />
                                <span>{opt.label}</span>
                              </Stack>
                            </MenuItem>
                          ))}
                        </CustomTextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='tipo_comprobante'
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          select
                          fullWidth
                          label='Tipo de Comprobante'
                        >
                          <MenuItem value=''>Ninguno</MenuItem>
                          <MenuItem value='TICKET'>Ticket</MenuItem>
                          <MenuItem value='BOLETA'>Boleta</MenuItem>
                          <MenuItem value='FACTURA'>Factura</MenuItem>
                        </CustomTextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name='numero_comprobante'
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          fullWidth
                          label='Número de Documento (RUC/DNI)'
                          placeholder='Ej. 20601234567'
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name='mensaje'
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          fullWidth
                          multiline
                          rows={3}
                          label='Notas / Mensaje para el estudiante'
                          placeholder='Ej. Transferencia verificada el DD/MM/AAAA'
                          helperText='El estudiante podrá ver este mensaje en su panel de pedidos.'
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ mb: 3 }} />
                    <Stack direction='row' justifyContent='flex-end' spacing={2}>
                      <Button
                        variant='outlined'
                        color='secondary'
                        startIcon={<i className='tabler-arrow-left' />}
                        onClick={() => router.push('/admin/pedidos')}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type='submit'
                        variant='contained'
                        disabled={isPending}
                        startIcon={isPending ? <i className='tabler-loader-2 animate-spin' /> : <i className='tabler-device-floppy' />}
                      >
                        {isPending ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

          </Stack>
        </Grid>

        {/* ── COLUMNA DERECHA: resumen ── */}
        <Grid item xs={12} lg={4}>
          <Paper variant='outlined' sx={{ p: 3, borderRadius: 3, position: { lg: 'sticky' }, top: 24 }}>
            <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ letterSpacing: 1 }}>
              Resumen
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='body2' color='text.secondary'>N° Pedido</Typography>
                <Typography variant='body2' fontWeight={700}>#{String(pedido?.numero_pedido || '').padStart(6, '0')}</Typography>
              </Stack>
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='body2' color='text.secondary'>Estado</Typography>
                <Chip label={ESTADOS.find(e => e.value === pedido?.estado)?.label || pedido?.estado} color={estadoColor[pedido?.estado] || 'default'} size='small' variant='tonal' />
              </Stack>
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='body2' color='text.secondary'>Cursos</Typography>
                <Typography variant='body2' fontWeight={600}>{pedido?.detalles?.length || 0}</Typography>
              </Stack>
              {pedido?.cupon && (
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2' color='text.secondary'>Cupón</Typography>
                  <Chip label={pedido.cupon.codigo} size='small' color='info' variant='tonal' />
                </Stack>
              )}
              <Divider />
              <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Typography variant='subtitle2'>Total</Typography>
                <Typography variant='h6' fontWeight={800} color='success.main'>
                  {pedido?.moneda} {Number(pedido?.total || 0).toFixed(2)}
                </Typography>
              </Stack>

              {pedido?.comprobante_url ? (
                <Alert severity='success' icon={<i className='tabler-photo-check' style={{ fontSize: 16 }} />} sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
                  Comprobante recibido
                </Alert>
              ) : (
                <Alert severity='warning' icon={<i className='tabler-photo-off' style={{ fontSize: 16 }} />} sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
                  Sin comprobante
                </Alert>
              )}

              {pedido?.pagado_en && (
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2' color='text.secondary'>Pagado el</Typography>
                  <Typography variant='body2' fontWeight={600}>
                    <HydratedDate date={pedido.pagado_en} format='locale' />
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  )
}
