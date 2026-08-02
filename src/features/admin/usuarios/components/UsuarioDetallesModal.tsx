import { useState, useEffect } from 'react'
import type { SyntheticEvent } from 'react'

import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { getSession } from 'next-auth/react'
import { toast } from 'react-toastify'
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Alert
} from '@mui/material'
import type { Rol } from '@prisma/client'

import AppModal from '@/utils/components/AppModal'
import UserAvatar from '@/utils/components/UserAvatar'

import { useUsuario } from '../hooks/useUsuarios'
import HydratedDate from '@/utils/components/HydratedDate'
import { AxiosCertificado } from '@/features/admin/certificados/http/axiosCertificado'

interface UsuarioDetallesModalProps {
  open: boolean
  handleClose: () => void
  usuarioId: string | null
}

const rolLabels: { [key in Rol]: string } = {
  ADMIN: 'Administrador',
  PROFESOR: 'Profesor',
  ESTUDIANTE: 'Estudiante',
  ASESOR: 'Asesor'
}

type TipoCertificado = 'ipg' | 'cip'

interface CertConfirm {
  inscripcionId: string
  cursoTitulo: string
  habilitadoActual: boolean
  tipo: TipoCertificado
  precioSugerido: number | null
  moneda: string
}

const METODOS_PAGO = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta' },
  { value: 'OTRO', label: 'Otro' },
]

const todayInputValue = () => {
  const d = new Date()

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const UsuarioDetallesModal = ({ open, handleClose, usuarioId }: UsuarioDetallesModalProps) => {
  const [activeTab, setActiveTab] = useState(0)
  const [certConfirm, setCertConfirm] = useState<CertConfirm | null>(null)
  const [certLoading, setCertLoading] = useState(false)
  const [certPagadoEn, setCertPagadoEn] = useState(todayInputValue())
  const [certMonto, setCertMonto] = useState('')
  const [certMetodo, setCertMetodo] = useState('TRANSFERENCIA')
  const [certComprobante, setCertComprobante] = useState('')

  const queryClient = useQueryClient()
  const { data: usuario, isLoading } = useUsuario(usuarioId || '')

  useEffect(() => {
    if (!certConfirm || certConfirm.habilitadoActual) return
    setCertPagadoEn(todayInputValue())
    setCertMonto(certConfirm.precioSugerido != null ? String(certConfirm.precioSugerido) : '')
    setCertMetodo('TRANSFERENCIA')
    setCertComprobante('')
  }, [certConfirm])

  const handleTabChange = (_: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleToggleCert = async () => {
    if (!certConfirm) return

    const habilitando = !certConfirm.habilitadoActual

    if (habilitando) {
      if (!certPagadoEn) {
        toast.error('Indica la fecha de pago')

        return
      }

      if (certMonto === '' || Number(certMonto) < 0) {
        toast.error('Indica el monto del pedido')

        return
      }
    }

    setCertLoading(true)

    try {
      const payload: Record<string, unknown> = {
        habilitado: habilitando,
        tipo: certConfirm.tipo,
      }

      if (habilitando) {
        payload.pagado_en = new Date(`${certPagadoEn}T12:00:00`).toISOString()
        payload.monto = Number(certMonto)
        payload.metodo_pago = certMetodo
        if (certComprobante.trim()) payload.numero_comprobante = certComprobante.trim()
      }

      const res = await axios.patch(`/api/admin/inscripciones/${certConfirm.inscripcionId}/certificado`, payload)

      if (!res.data?.status) {
        toast.error(res.data?.message || 'Error al actualizar el certificado')

        return
      }

      queryClient.invalidateQueries({ queryKey: ['usuarios', usuarioId] })
      const nro = res.data?.result?.numeroPedido

      toast.success(
        certConfirm.habilitadoActual
          ? 'Certificado deshabilitado'
          : nro
            ? `Pedido #${nro} registrado · Certificado habilitado`
            : 'Certificado habilitado correctamente'
      )
      setCertConfirm(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al actualizar el certificado')
    } finally {
      setCertLoading(false)
    }
  }

  const handleDownloadCert = async (certificadoId: string, tipo: TipoCertificado) => {
    try {
      toast.info('Generando PDF...')

      const getAuthToken = async () => {
        const s = await getSession()

        return s?.user?.accessToken ?? null
      }

      const axiosCertificado = new AxiosCertificado({ getAuthToken })
      const blob = await axiosCertificado.downloadPdf(certificadoId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `certificado-${tipo}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Certificado descargado')
    } catch {
      toast.error('Error al descargar el certificado')
    }
  }

  if (isLoading) {
    return (
      <AppModal open={open} handleClose={handleClose}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 300, gap: 2 }}>
          <CircularProgress />
          <Typography>Cargando detalles...</Typography>
        </Box>
      </AppModal>
    )
  }

  if (!usuario) return null

  return (
    <>
      <AppModal open={open} handleClose={handleClose}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
          <UserAvatar
            src={usuario.avatar}
            name={usuario.nombre}
            apellido={usuario.apellido}
            size={80}
          />
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 600 }}>
              {usuario.nombre} {usuario.apellido}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={rolLabels[usuario.rol]} size='small' color='primary' variant='tonal' />
              <Chip
                label={usuario.esta_activo ? 'Activo' : 'Inactivo'}
                size='small'
                color={usuario.esta_activo ? 'success' : 'secondary'}
                variant='tonal'
              />
            </Box>
          </Box>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tab label='Perfil' />
          <Tab label='Inscripciones' disabled={usuario.rol === 'ADMIN'} />
          <Tab label='Cursos Dictados' disabled={usuario.rol !== 'PROFESOR' && usuario.rol !== 'ADMIN'} />
        </Tabs>

        <Box sx={{ minHeight: 300 }}>
          {/* TAB: Perfil */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 600 }}>CORREO</Typography>
                <Typography variant='body1'>{usuario.correo}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 600 }}>DNI / DOCUMENTO</Typography>
                <Typography variant='body1'>{usuario.numero_documento}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 600 }}>CELULAR</Typography>
                <Typography variant='body1'>{usuario.celular || 'No registrado'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 600 }}>FECHA DE REGISTRO</Typography>
                <Typography variant='body1'><HydratedDate date={usuario.creado_en} format="date" /></Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 600 }}>BIOGRAFÍA</Typography>
                {usuario.biografia ? (
                  <Box
                    sx={{
                      mt: 1, fontSize: '0.95rem', lineHeight: 1.7, color: 'text.primary',
                      '& h1,& h2,& h3': { fontSize: '1rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
                      '& p': { m: 0 },
                      '& ul,& ol': { pl: 3, my: 0.5 },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: usuario.biografia.replace(/<!--PROFESOR_BIO_JSON:[\s\S]*?-->/g, '').trim()
                    }}
                  />
                ) : (
                  <Typography variant='body1' sx={{ mt: 1, fontStyle: 'italic' }}>Sin biografía redactada.</Typography>
                )}
              </Grid>
            </Grid>
          )}

          {/* TAB: Inscripciones */}
          {activeTab === 1 && (
            <Box>
              {usuario.inscripciones && usuario.inscripciones.length > 0 ? (
                <List sx={{ pt: 0 }}>
                  {usuario.inscripciones.map((insc, index) => {
                    const tieneCertPago = insc.curso.precio_certificado && Number(insc.curso.precio_certificado) > 0

                    const precioFmt = tieneCertPago
                      ? `${insc.curso.moneda} ${Number(insc.curso.precio_certificado).toFixed(2)}`
                      : null

                    const tipos: { tipo: TipoCertificado; label: string; habilitado: boolean; certificadoId: string | null }[] = [
                      { tipo: 'ipg', label: 'IPG', habilitado: insc.certificado_ipg_habilitado, certificadoId: insc.certificado_ipg_id },
                      { tipo: 'cip', label: 'CIP', habilitado: insc.certificado_cip_habilitado, certificadoId: insc.certificado_cip_id }
                    ]

                    return (
                      <Box key={insc.id}>
                        {index > 0 && <Divider component='li' />}
                        <ListItem
                          alignItems='flex-start'
                          sx={{ px: 0, gap: 1 }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {tipos.map(({ tipo, label, habilitado, certificadoId }) => (
                                <Box key={tipo} sx={{ display: 'flex', alignItems: 'center' }}>
                                  {habilitado && certificadoId && (
                                    <Tooltip title={`Descargar certificado ${label}`}>
                                      <IconButton
                                        size='small'
                                        color='primary'
                                        onClick={() => handleDownloadCert(certificadoId, tipo)}
                                      >
                                        <i className='tabler-download text-[18px]' />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {tieneCertPago && (
                                    <Tooltip title={`${habilitado ? 'Deshabilitar' : 'Registrar pago y habilitar'} certificado ${label}`}>
                                      <IconButton
                                        size='small'
                                        onClick={() => setCertConfirm({
                                          inscripcionId: insc.id,
                                          cursoTitulo: insc.curso.titulo,
                                          habilitadoActual: habilitado,
                                          tipo,
                                          precioSugerido: insc.curso.precio_certificado != null
                                            ? Number(insc.curso.precio_certificado)
                                            : null,
                                          moneda: insc.curso.moneda || 'PEN',
                                        })}
                                        sx={{
                                          bgcolor: habilitado ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)',
                                          color: habilitado ? 'success.main' : 'warning.main',
                                          '&:hover': {
                                            bgcolor: habilitado ? 'rgba(22,163,74,0.2)' : 'rgba(245,158,11,0.2)'
                                          }
                                        }}
                                      >
                                        <i className={habilitado ? 'tabler-certificate text-[18px]' : 'tabler-lock text-[18px]'} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          }
                        >
                          <ListItemIcon sx={{ minWidth: 40, mt: 1 }}>
                            <i className='tabler-book text-2xl text-primary' />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pr: 10 }}>
                                <Typography variant='body2' fontWeight={600}>{insc.curso.titulo}</Typography>
                                {tipos.map(({ tipo, label, habilitado }) => (
                                  habilitado && (
                                    <Chip
                                      key={tipo}
                                      size='small'
                                      icon={<i className='tabler-certificate' style={{ fontSize: '0.75rem' }} />}
                                      label={label}
                                      color='success'
                                      variant='tonal'
                                      sx={{ fontSize: '0.68rem', height: 20 }}
                                    />
                                  )
                                ))}
                                {tieneCertPago && !insc.certificado_ipg_habilitado && !insc.certificado_cip_habilitado && (
                                  <Chip
                                    size='small'
                                    icon={<i className='tabler-lock' style={{ fontSize: '0.75rem' }} />}
                                    label={`Cert. ${precioFmt}`}
                                    color='warning'
                                    variant='tonal'
                                    sx={{ fontSize: '0.68rem', height: 20 }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography component='span' variant='caption' color='text.secondary'>
                                Estado: {insc.estado} — Inscrito el <HydratedDate date={insc.inscrito_en} format='date' />
                              </Typography>
                            }
                          />
                        </ListItem>
                      </Box>
                    )
                  })}
                </List>
              ) : (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <i className='tabler-mood-empty text-5xl text-textDisabled' />
                  <Typography sx={{ mt: 2 }} color='text.secondary'>Este usuario no tiene inscripciones activas.</Typography>
                </Box>
              )}
            </Box>
          )}

          {/* TAB: Cursos Dictados */}
          {activeTab === 2 && (
            <Box>
              {usuario.cursos_dictados && usuario.cursos_dictados.length > 0 ? (
                <List sx={{ pt: 0 }}>
                  {usuario.cursos_dictados.map((curso, index) => (
                    <Box key={curso.id}>
                      {index > 0 && <Divider variant='inset' component='li' />}
                      <ListItem alignItems='flex-start' sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40, mt: 1 }}>
                          <i className='tabler-school text-2xl text-warning' />
                        </ListItemIcon>
                        <ListItemText
                          primary={curso.titulo}
                          secondary={
                            <>
                              <Typography component='span' variant='body2' color='text.primary'>
                                Estado: {curso.estado}
                              </Typography>
                              {` — Creado el `} <HydratedDate date={curso.creado_en} format="date" />
                            </>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              ) : (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <i className='tabler-mood-empty text-5xl text-textDisabled' />
                  <Typography sx={{ mt: 2 }} color='text.secondary'>Este usuario no tiene cursos asignados como profesor.</Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant='tonal' color='secondary' onClick={handleClose}>
            Cerrar
          </Button>
        </Box>
      </AppModal>

      {/* Modal de confirmación para habilitar/deshabilitar certificado */}
      {certConfirm && (
        <AppModal
          open={!!certConfirm}
          handleClose={() => !certLoading && setCertConfirm(null)}
          sx={{ maxWidth: certConfirm.habilitadoActual ? 440 : 520 }}
        >
          <Box sx={{ textAlign: certConfirm.habilitadoActual ? 'center' : 'left' }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: certConfirm.habilitadoActual ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)'
            }}>
              <i
                className={certConfirm.habilitadoActual ? 'tabler-lock text-4xl' : 'tabler-receipt text-4xl'}
                style={{ color: certConfirm.habilitadoActual ? '#dc2626' : '#16a34a' }}
              />
            </Box>
            <Typography variant='h5' fontWeight={700} sx={{ mb: 1, textAlign: 'center' }}>
              {certConfirm.habilitadoActual
                ? `Deshabilitar certificado ${certConfirm.tipo.toUpperCase()}`
                : `Registrar pago · ${certConfirm.tipo.toUpperCase()}`}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5, textAlign: 'center' }}>
              {certConfirm.habilitadoActual
                ? `El estudiante ya no podrá descargar el certificado ${certConfirm.tipo.toUpperCase()} de:`
                : 'Para habilitar el certificado debes registrar un pedido con la fecha de pago.'}
            </Typography>
            <Typography variant='body1' fontWeight={600} sx={{ mb: certConfirm.habilitadoActual ? 4 : 2.5, textAlign: 'center' }}>
              {certConfirm.cursoTitulo}
            </Typography>

            {!certConfirm.habilitadoActual && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Alert severity='info'>
                  Se creará un pedido tipo certificado (o se completará uno pendiente) para dejar registro del pago.
                </Alert>
                <TextField
                  label='Fecha de pago'
                  type='date'
                  fullWidth
                  required
                  value={certPagadoEn}
                  onChange={e => setCertPagadoEn(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={certLoading}
                />
                <TextField
                  label='Monto del pedido'
                  type='number'
                  fullWidth
                  required
                  value={certMonto}
                  onChange={e => setCertMonto(e.target.value)}
                  disabled={certLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        {certConfirm.moneda === 'USD' ? '$' : 'S/'}
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 0, step: '0.01' }}
                />
                <TextField
                  select
                  label='Método de pago'
                  fullWidth
                  value={certMetodo}
                  onChange={e => setCertMetodo(e.target.value)}
                  disabled={certLoading}
                >
                  {METODOS_PAGO.map(m => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label='N° operación / comprobante (opcional)'
                  fullWidth
                  value={certComprobante}
                  onChange={e => setCertComprobante(e.target.value)}
                  disabled={certLoading}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant='tonal'
                color='secondary'
                onClick={() => setCertConfirm(null)}
                disabled={certLoading}
              >
                Cancelar
              </Button>
              <Button
                variant='contained'
                color={certConfirm.habilitadoActual ? 'error' : 'success'}
                onClick={handleToggleCert}
                disabled={certLoading}
                startIcon={certLoading
                  ? <CircularProgress size={16} color='inherit' />
                  : <i className={certConfirm.habilitadoActual ? 'tabler-lock' : 'tabler-circle-check'} />
                }
              >
                {certLoading
                  ? 'Guardando...'
                  : certConfirm.habilitadoActual ? 'Sí, deshabilitar' : 'Crear pedido y habilitar'
                }
              </Button>
            </Box>
          </Box>
        </AppModal>
      )}
    </>
  )
}

export default UsuarioDetallesModal
