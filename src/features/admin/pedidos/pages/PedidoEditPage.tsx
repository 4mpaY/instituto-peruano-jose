'use client'

import { useEffect, useRef, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import {
  Card, CardContent, Grid, Typography,
  Button, MenuItem, Box, Divider, Chip,
  Avatar, Stack, Paper, Alert, CircularProgress, IconButton
} from '@mui/material'
import { toast } from 'react-toastify'
import { useForm, Controller } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { getSession } from 'next-auth/react'

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
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, isError, error } = usePedido(id as string)
  const { mutateAsync: updatePedido, isPending } = useUpdatePedido()

  const [voucherPreview, setVoucherPreview] = useState<string | null>(null)
  const [uploadingVoucher, setUploadingVoucher] = useState(false)

  const { control, handleSubmit, reset, getValues } = useForm({
    defaultValues: {
      estado: '',
      metodo_pago: '',
      mensaje: '',
      tipo_comprobante: '',
      numero_comprobante: '',
      referencia_pago: '',
      fecha_entrega_estimada: '',
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
        numero_comprobante: p.numero_comprobante || '',
        referencia_pago: p.referencia_pago || '',
        fecha_entrega_estimada: p.fecha_entrega_estimada 
          ? new Date(new Date(p.fecha_entrega_estimada).getTime() - new Date(p.fecha_entrega_estimada).getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
          : (p as any).fecha_entrega_default
            ? new Date(new Date((p as any).fecha_entrega_default).getTime() - new Date((p as any).fecha_entrega_default).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
            : '',
      })
      setVoucherPreview(p.comprobante_url || null)
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
          numero_comprobante: formData.numero_comprobante || null,
          referencia_pago: formData.referencia_pago?.trim() || null,
          fecha_entrega_estimada: formData.fecha_entrega_estimada ? new Date(formData.fecha_entrega_estimada).toISOString() : null,
        } as any
      })

      toast.success('Pedido actualizado con éxito')
      router.push('/admin/pedidos')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el pedido')
    }
  }

  const handleVoucherChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast.warning(`El archivo ${f.name} supera 5 MB`)
        
return false
      }

      
return true
    }).slice(0, 5)

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      
return
    }

    setUploadingVoucher(true)

    try {
      const session = await getSession()
      const token = session?.user?.accessToken
      const fd = new FormData()

      validFiles.forEach(v => fd.append('voucher', v))
      fd.append('existing_urls', voucherPreview || '')

      const res = await fetch(`/api/pedidos/${id}/voucher`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok || body?.status === false) {
        throw new Error(body?.message || 'No se pudo actualizar el voucher')
      }

      const url = body?.result?.comprobante_url || body?.comprobante_url

      if (url) {
        setVoucherPreview(`${url}?t=${Date.now()}`)
      }

      await queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      toast.success('Voucher actualizado')
    } catch (err: any) {
      toast.error(err?.message || 'Error al subir el voucher')
    } finally {
      setUploadingVoucher(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteVoucher = async (index: number) => {
    if (!voucherPreview) return
    
    const currentUrls = voucherPreview.split(',').filter(Boolean)
    const newUrls = currentUrls.filter((_, i) => i !== index)
    const newUrlString = newUrls.join(',') || ''
    
    try {
      await updatePedido({
        id: id as string,
        data: { 
          estado: getValues('estado'),
          comprobante_url: newUrlString 
        } as any
      })
      
      setVoucherPreview(newUrlString || null)
      await queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      toast.success('Voucher eliminado')
    } catch (error) {
      toast.error('Error al eliminar voucher')
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

  if (!pedido || isError) {
    return (
      <Card>
        <CardContent>
          <Alert severity='error' variant='outlined'>
            No se pudo cargar la información del pedido. {(error as any)?.message || 'Es posible que tu sesión haya expirado o el pedido ya no exista.'}
          </Alert>
        </CardContent>
      </Card>
    )
  }

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
                        <Typography variant='body2' fontWeight={600}>{d.titulo_display || d.curso?.titulo}</Typography>
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

            {/* Voucher / verificación de pago (editable, precargado con datos del estudiante) */}
            {(pedido?.comprobante_url || pedido?.referencia_pago || pedido?.numero_comprobante) && (
              <Card>
                <CardContent>
                  <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
                    <Stack direction='row' alignItems='center' spacing={1.5}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'success.lighterOpacity', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className='tabler-photo-check' style={{ fontSize: 18, color: '#25927F' }} />
                      </Box>
                      <Box>
                        <Typography variant='subtitle2' fontWeight={700}>Verificación de pago</Typography>
                        {pedido.comprobante_subido_en && (
                          <Typography variant='caption' color='text.secondary'>
                            Subido el <HydratedDate date={pedido.comprobante_subido_en} format='locale' />
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                    {(voucherPreview || pedido.comprobante_url) && (
                      <Chip label='Voucher(s) recibido(s)' color='success' size='small' variant='tonal' icon={<i className='tabler-check' style={{ fontSize: 13 }} />} />
                    )}
                  </Stack>

                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
                    Datos enviados por el estudiante. Puedes corregirlos antes de aprobar el pedido.
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name='referencia_pago'
                        control={control}
                        render={({ field }) => (
                          <CustomTextField
                            {...field}
                            fullWidth
                            label='Banco / billetera'
                            placeholder='Ej. BCP, Yape, Plin...'
                            helperText='Indicado por el estudiante al tramitar'
                          />
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
                            label='Código de operación'
                            placeholder='Ej. 000123456'
                            helperText='Número de operación del voucher'
                            inputProps={{ style: { fontFamily: 'monospace' } }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, mb: 1.5 }}>
                    <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1.5 }}>
                      <Typography variant='body2' fontWeight={700}>
                        Imagen del voucher
                      </Typography>
                      <Button
                        size='small'
                        variant='outlined'
                        disabled={uploadingVoucher}
                        startIcon={
                          uploadingVoucher
                            ? <CircularProgress size={14} color='inherit' />
                            : <i className='tabler-photo-up' style={{ fontSize: 16 }} />
                        }
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        {uploadingVoucher ? 'Subiendo...' : voucherPreview ? 'Agregar voucher' : 'Subir imágenes'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type='file'
                        hidden
                        multiple
                        accept='image/*,application/pdf'
                        onChange={e => handleVoucherChange(e.target.files)}
                      />
                    </Stack>

                    {voucherPreview ? (
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                        {voucherPreview.split(',').map((url, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              position: 'relative',
                              width: 120,
                              height: 120,
                              borderRadius: 2,
                              border: '1.5px solid',
                              borderColor: 'divider',
                              bgcolor: '#f8fafc',
                              overflow: 'hidden',
                              '&:hover .delete-btn': { opacity: 1 }
                            }}
                          >
                            <IconButton
                              className="delete-btn"
                              size="small"
                              color="error"
                              onClick={(e) => { e.stopPropagation(); void handleDeleteVoucher(idx); }}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                bgcolor: 'rgba(255,255,255,0.9)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                zIndex: 10,
                                '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                              }}
                            >
                              <i className='tabler-x' style={{ fontSize: 16 }} />
                            </IconButton>
                            {url.toLowerCase().includes('.pdf') ? (
                              <Box
                                onClick={() => window.open(url.split('?')[0], '_blank')}
                                sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', cursor: 'pointer' }}
                              >
                                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>PDF</Typography>
                              </Box>
                            ) : (
                              <Box
                                component='img'
                                src={url}
                                alt={`Voucher ${idx + 1}`}
                                onClick={() => window.open(url.split('?')[0], '_blank')}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  cursor: 'zoom-in',
                                  transition: 'transform 0.2s',
                                  '&:hover': { transform: 'scale(1.05)' },
                                }}
                              />
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box
                        component='label'
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          py: 4,
                          px: 2,
                          borderRadius: 2,
                          border: '2px dashed',
                          borderColor: 'divider',
                          bgcolor: '#f8fafc',
                          cursor: 'pointer',
                          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className='tabler-photo-up' style={{ fontSize: 32, color: '#94a3b8' }} />
                        <Typography variant='body2' fontWeight={700}>Subir vouchers</Typography>
                        <Typography variant='caption' color='text.secondary'>Imágenes o PDFs — máx. 5 MB (hasta 5 arch.)</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Datos de Envío */}
            {pedido?.datos_envio && (
              <Card>
                <CardContent>
                  <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.lighterOpacity', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className='tabler-truck' style={{ fontSize: 18, color: 'primary.main' }} />
                    </Box>
                    <Typography variant='subtitle2' fontWeight={700}>Datos de Envío Físico</Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    {[
                      ['Método', (pedido.datos_envio as any).metodo === 'OLVA' ? 'Olva Courier' : 'Agencia de Encomiendas'],
                      ['Departamento', (pedido.datos_envio as any).departamento],
                      ['Provincia', (pedido.datos_envio as any).provincia],
                      ['Distrito', (pedido.datos_envio as any).distrito],
                      ['Dirección', (pedido.datos_envio as any).direccion],
                      ['Referencia', (pedido.datos_envio as any).referencia || '-'],
                    ].map(([label, value]) => (
                      <Grid item xs={12} sm={6} key={label as string}>
                        <Typography variant='caption' color='text.secondary' display='block'>{label}</Typography>
                        <Typography variant='body2' fontWeight={600}>{value}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Formulario de edición */}
            <Card component='form' id='pedido-edit-form' onSubmit={handleSubmit(onSubmit)}>
              <CardContent>
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ letterSpacing: 1, mb: 2, display: 'block' }}>
                  Editar Pedido
                </Typography>

                <Alert
                  severity='warning'
                  icon={<i className='tabler-alert-triangle' style={{ fontSize: 20 }} />}
                  sx={{ mb: 3, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.8125rem' } }}
                >
                  Cambiar el estado a <strong>COMPLETADO</strong> activará automáticamente
                  {(pedido as any)?.tipo === 'CERTIFICADO'
                    ? ' el certificado del estudiante.'
                    : ' la inscripción del estudiante al curso.'}
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

                  {/* Fecha de Entrega Estimada (Opcional) */}
                  {pedido?.tipo === 'CERTIFICADO' && (
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name='fecha_entrega_estimada'
                        control={control}
                        render={({ field }) => (
                          <CustomTextField
                            {...field}
                            type='datetime-local'
                            fullWidth
                            label='Fecha y Hora Estimada (Opcional)'
                            helperText='Sobrescribe la fecha calculada por el curso'
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                  )}


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
                          <MenuItem value='OPERACION'>Operación / voucher</MenuItem>
                        </CustomTextField>
                      )}
                    />
                  </Grid>

                  {/* En certificados el código de operación ya se edita arriba */}
                  {(pedido as any)?.tipo !== 'CERTIFICADO' && (
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
                  )}

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
                <Box>
                  <Alert severity='success' icon={<i className='tabler-photo-check' style={{ fontSize: 16 }} />} sx={{ borderRadius: 2, fontSize: '0.75rem', mb: 1 }}>
                    Comprobante(s) recibido(s)
                  </Alert>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {pedido.comprobante_url.split(',').map((url, idx) => (
                      <Box
                        key={idx}
                        component='a'
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          display: 'block'
                        }}
                      >
                        {url.toLowerCase().endsWith('.pdf') ? (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700 }}>PDF</Typography>
                          </Box>
                        ) : (
                          <img src={url} alt={`Voucher ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
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
