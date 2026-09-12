'use client'

import { useParams, useRouter } from 'next/navigation'

import {
  Card, CardHeader, CardContent, Grid, Typography,
  Chip, Divider, Button, Avatar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Box,
  Stack
} from '@mui/material'

import HydratedDate from '@/utils/components/HydratedDate'
import { useMiPedido } from '../hooks/useMisPedidos'
import type { ThemeColor } from '@/@core/types'

type StatusType = { [key: string]: ThemeColor }

const statusObj: StatusType = {
  PENDIENTE: 'warning',
  PROCESANDO: 'info',
  COMPLETADO: 'success',
  CANCELADO: 'secondary',
  REEMBOLSADO: 'error'
}

export function MiPedidoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const { data, isLoading, isError, error } = useMiPedido(id as string)

  console.log('[MiPedidoDetalle] id:', id, 'data:', data, 'isError:', isError, 'error:', error)

  if (isLoading) return <Card><CardContent>Cargando información del pedido...</CardContent></Card>
  if (isError || !data?.data) return <Card><CardContent>Error al cargar el pedido o no existe.</CardContent></Card>

  const pedido = data.data as any

  return (
    <Card>
      <CardHeader
        title={`Detalle de Pedido #${String(pedido.numero_pedido).padStart(6, '0')}`}
        action={
          <Button variant="outlined" startIcon={<i className='tabler-arrow-left' />} onClick={() => router.push('/estudiante/pedidos')}>Volver</Button>
        }
      />
      <CardContent>
        <Grid container spacing={6}>
          {/* Info general */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Datos del Estudiante</Typography>
            <div className="flex items-center gap-4 mb-4">
              <Avatar src={pedido.usuario?.avatar || ''} alt={pedido.usuario?.nombre} sx={{ width: 56, height: 56 }} />
              <div>
                <Typography variant="subtitle1" fontWeight={600}>{pedido.usuario?.nombre} {pedido.usuario?.apellido}</Typography>
                <Typography variant="body2" color="text.secondary">{pedido.usuario?.correo}</Typography>
              </div>
            </div>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Información de Pago</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Fecha de Compra (Registro)</Typography>
                <Typography variant="body1"><HydratedDate date={pedido.creado_en} format="locale" /></Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Fecha de Pago Autorizado</Typography>
                <Typography variant="body1">
                  {pedido.pagado_en ? <HydratedDate date={pedido.pagado_en} format="locale" /> : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Método de Pago</Typography>
                <Typography variant="body1" className="capitalize">{pedido.metodo_pago?.toLowerCase().replace('_', ' ')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Estado del Pedido</Typography>
                <Chip
                  variant='tonal'
                  label={pedido.estado}
                  color={statusObj[pedido.estado] || 'default'}
                  size='small'
                  className='font-medium'
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Resumen de Total</Typography>
            <Paper variant="outlined" sx={{ p: 4, bgcolor: 'action.hover' }}>
              <div className="flex justify-between mb-2">
                <Typography color="text.secondary">Subtotal Cursos:</Typography>
                <Typography>{pedido.moneda} {Number(pedido.total).toFixed(2)}</Typography>
              </div>
              {pedido.cupon && (
                <div className="flex justify-between mb-2">
                  <Typography color="text.secondary">Cupón ({pedido.cupon.codigo}):</Typography>
                  <Typography color="success.main">Aplicado</Typography>
                </div>
              )}
              <Divider sx={{ my: 2 }} />
              <div className="flex justify-between">
                <Typography variant="h6">Total Pagado:</Typography>
                <Typography variant="h6" color="primary">{pedido.moneda} {Number(pedido.total).toFixed(2)}</Typography>
              </div>
            </Paper>

            {pedido.mensaje && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>Notas / Mensaje Adicional</Typography>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="body2">{pedido.mensaje}</Typography>
                </Paper>
              </Box>
            )}
          </Grid>

          {/* Voucher */}
          {(pedido.comprobante_url || pedido.metodo_pago_manual) && (
            <Grid item xs={12}>
              <Divider sx={{ mb: 3 }} />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems='flex-start'>
                {pedido.comprobante_url && (
                  <Box>
                    <Typography variant='h6' gutterBottom>Comprobante(s) de Pago</Typography>
                    <Stack direction='row' flexWrap='wrap' gap={2}>
                      {pedido.comprobante_url.split(',').map((url: string, idx: number) => (
                        <Box key={idx} sx={{ position: 'relative', width: 120, height: 120, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                          {url.toLowerCase().endsWith('.pdf') ? (
                            <Box
                              onClick={() => window.open(url, '_blank')}
                              sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', cursor: 'pointer' }}
                            >
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>PDF</Typography>
                            </Box>
                          ) : (
                            <Box
                              component='img'
                              src={url}
                              alt={`Comprobante ${idx + 1}`}
                              onClick={() => window.open(url, '_blank')}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.05)' }
                              }}
                            />
                          )}
                        </Box>
                      ))}
                    </Stack>
                    {pedido.comprobante_subido_en && (
                      <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 1 }}>
                        Subido: <HydratedDate date={pedido.comprobante_subido_en} format='locale' />
                      </Typography>
                    )}
                  </Box>
                )}

                <Box flex={1}>
                  {pedido.metodo_pago_manual && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant='h6' gutterBottom>Método Seleccionado</Typography>
                      <Typography variant='body2'><b>{pedido.metodo_pago_manual.nombre}</b></Typography>
                      <Typography variant='body2' color='text.secondary'>{pedido.metodo_pago_manual.numero_cuenta} · {pedido.metodo_pago_manual.nombre_cuenta}</Typography>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Grid>
          )}

          {/* Tracking */}
          {pedido.datos_envio?.estado_envio && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Seguimiento del Certificado Físico</Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 4, height: '100%' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                        <i className="tabler-truck-delivery text-[24px]" />
                      </Avatar>
                      <div>
                        <Typography variant="body2" color="text.secondary">Estado del envío</Typography>
                        <Typography variant="h6" fontWeight={700}>{pedido.datos_envio.estado_envio}</Typography>
                      </div>
                    </div>
                    {pedido.datos_envio.estado_envio === 'En tránsito' && (
                      <Typography variant="body2" color="text.secondary">
                        ¡Tu certificado ya está en camino! Usa el número de seguimiento para conocer su ubicación.
                      </Typography>
                    )}
                    {pedido.datos_envio.estado_envio === 'En origen' && (
                      <Typography variant="body2" color="text.secondary">
                        Tu certificado está siendo preparado para su envío.
                      </Typography>
                    )}
                    {pedido.datos_envio.estado_envio === 'Listo para recojo' && (
                      <Typography variant="body2" color="text.secondary">
                        Tu certificado ya llegó a la agencia de destino y está listo para ser recogido.
                      </Typography>
                    )}
                    {pedido.datos_envio.estado_envio === 'Entregado' && (
                      <Typography variant="body2" color="success.main">
                        El certificado ha sido entregado exitosamente.
                      </Typography>
                    )}
                    {pedido.datos_envio.estado_envio === 'Hubo un error' && (
                      <Typography variant="body2" color="error.main">
                        Hubo un inconveniente con el envío. Por favor, comunícate al número {pedido.datos_envio.error_telefono}.
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 4, height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>Datos de seguimiento</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">EMPRESA TRANSPORTISTA</Typography>
                      <Typography variant="body2">{pedido.datos_envio.empresa_transportista}</Typography>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="caption" color="text.secondary">NÚMERO DE SEGUIMIENTO</Typography>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip label={pedido.datos_envio.numero_seguimiento} size="small" variant="tonal" color="secondary" />
                        <Button 
                          size="small" 
                          startIcon={<i className="tabler-copy" />} 
                          onClick={() => {
                            navigator.clipboard.writeText(pedido.datos_envio.numero_seguimiento)
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                    </Box>

                    {pedido.datos_envio.numero_recojo && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" color="text.secondary">CLAVE O NÚMERO DE RECOJO</Typography>
                        <Typography variant="body2">{pedido.datos_envio.numero_recojo}</Typography>
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<i className="tabler-external-link" />}
                      onClick={() => {
                        const isShalom = pedido.datos_envio.empresa_transportista.toLowerCase().includes('shalom')
                        const url = isShalom ? 'https://shalom.com.pe/rastrea' : 'https://tracking.olvacourier.com/'

                        window.open(url, '_blank')
                      }}
                    >
                      Rastrear en {pedido.datos_envio.empresa_transportista}
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Tabla de cursos comprados */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Cursos Comprados (Detalle)</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Curso</TableCell>
                    <TableCell align="right">Precio Original</TableCell>
                    <TableCell align="right">Subtotal Pagado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedido.detalles?.map((detalle: any) => (
                    <TableRow key={detalle.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar variant="rounded" src={detalle.curso?.miniatura || ''} sx={{ width: 40, height: 30 }} />
                          <Typography variant="body2" fontWeight={600}>{detalle.curso?.titulo}</Typography>
                        </div>
                      </TableCell>
                      <TableCell align="right">{pedido.moneda} {Number(detalle.curso?.precio || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{pedido.moneda} {Number(detalle.subtotal).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

        </Grid>
      </CardContent>
    </Card>
  )
}
