'use client'

import { useParams, useRouter } from 'next/navigation'

import {
  Card, CardHeader, CardContent, Grid, Typography,
  Chip, Divider, Button, Avatar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Box, Stack
} from '@mui/material'

import HydratedDate from '@/utils/components/HydratedDate'
import { usePedido } from '../hooks/usePedidos'
import type { ThemeColor } from '@/@core/types'
import type { Pedido } from '../entity/Pedido'

type StatusType = { [key: string]: ThemeColor }

const statusObj: StatusType = {
  PENDIENTE: 'warning',
  PROCESANDO: 'info',
  COMPLETADO: 'success',
  CANCELADO: 'secondary',
  REEMBOLSADO: 'error'
}

export function PedidoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { data, isLoading, isError } = usePedido(id as string)

  if (isLoading) return <Card><CardContent>Cargando información del pedido...</CardContent></Card>
  if (isError || !data?.data) return <Card><CardContent>Error al cargar el pedido o no existe.</CardContent></Card>

  const pedido = data.data as Pedido

  return (
    <Card>
      <CardHeader
        title={`Detalle de Pedido #${String(pedido.numero_pedido).padStart(6, '0')}`}
        action={
          <Button variant="outlined" startIcon={<i className='tabler-arrow-left' />} onClick={() => router.push('/admin/pedidos')}>Volver</Button>
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
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Tipo de Comprobante</Typography>
                <Typography variant="body1" className="capitalize">{pedido.tipo_comprobante || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Número de Documento</Typography>
                <Typography variant="body1">{pedido.numero_comprobante || '-'}</Typography>
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

          {/* Voucher y acción de completar */}
          {(pedido.comprobante_url || pedido.metodo_pago_manual) && (
            <Grid item xs={12}>
              <Divider sx={{ mb: 3 }} />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems='flex-start'>
                {pedido.comprobante_url && (
                  <Box>
                    <Typography variant='h6' gutterBottom>Comprobante de Pago</Typography>
                    <Box
                      component='img'
                      src={pedido.comprobante_url}
                      alt='Comprobante'
                      sx={{ maxWidth: 280, maxHeight: 320, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                      onClick={() => window.open(pedido.comprobante_url!, '_blank')}
                    />
                    {pedido.comprobante_subido_en && (
                      <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.5 }}>
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
