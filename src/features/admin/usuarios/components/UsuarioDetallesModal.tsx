import { useState } from 'react'
import type { SyntheticEvent } from 'react'

import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
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
  Tooltip
} from '@mui/material'
import type { Rol } from '@prisma/client'

import AppModal from '@/utils/components/AppModal'
import UserAvatar from '@/utils/components/UserAvatar'

import { useUsuario } from '../hooks/useUsuarios'
import HydratedDate from '@/utils/components/HydratedDate'

interface UsuarioDetallesModalProps {
  open: boolean
  handleClose: () => void
  usuarioId: string | null
}

const rolLabels: { [key in Rol]: string } = {
  ADMIN: 'Administrador',
  PROFESOR: 'Profesor',
  ESTUDIANTE: 'Estudiante'
}

interface CertConfirm {
  inscripcionId: string
  cursoTitulo: string
  habilitadoActual: boolean
}

const UsuarioDetallesModal = ({ open, handleClose, usuarioId }: UsuarioDetallesModalProps) => {
  const [activeTab, setActiveTab] = useState(0)
  const [certConfirm, setCertConfirm] = useState<CertConfirm | null>(null)
  const [certLoading, setCertLoading] = useState(false)

  const queryClient = useQueryClient()
  const { data: usuario, isLoading } = useUsuario(usuarioId || '')

  const handleTabChange = (_: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleToggleCert = async () => {
    if (!certConfirm) return

    setCertLoading(true)

    try {
      await axios.patch(`/api/admin/inscripciones/${certConfirm.inscripcionId}/certificado`, {
        habilitado: !certConfirm.habilitadoActual
      })
      queryClient.invalidateQueries({ queryKey: ['usuarios', usuarioId] })
      toast.success(certConfirm.habilitadoActual ? 'Certificado deshabilitado' : 'Certificado habilitado correctamente')
      setCertConfirm(null)
    } catch {
      toast.error('Error al actualizar el certificado')
    } finally {
      setCertLoading(false)
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
                  sx={{ mt: 1, fontSize: '0.95rem', lineHeight: 1.7, color: 'text.primary',
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

                  return (
                    <Box key={insc.id}>
                      {index > 0 && <Divider component='li' />}
                      <ListItem
                        alignItems='flex-start'
                        sx={{ px: 0, gap: 1 }}
                        secondaryAction={
                          tieneCertPago ? (
                            <Tooltip title={insc.certificado_habilitado ? 'Deshabilitar certificado' : 'Habilitar certificado'}>
                              <IconButton
                                size='small'
                                onClick={() => setCertConfirm({
                                  inscripcionId: insc.id,
                                  cursoTitulo: insc.curso.titulo,
                                  habilitadoActual: insc.certificado_habilitado
                                })}
                                sx={{
                                  bgcolor: insc.certificado_habilitado
                                    ? 'rgba(22,163,74,0.1)'
                                    : 'rgba(245,158,11,0.1)',
                                  color: insc.certificado_habilitado ? 'success.main' : 'warning.main',
                                  '&:hover': {
                                    bgcolor: insc.certificado_habilitado
                                      ? 'rgba(22,163,74,0.2)'
                                      : 'rgba(245,158,11,0.2)'
                                  }
                                }}
                              >
                                <i className={insc.certificado_habilitado
                                  ? 'tabler-certificate text-[18px]'
                                  : 'tabler-lock text-[18px]'
                                } />
                              </IconButton>
                            </Tooltip>
                          ) : undefined
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 40, mt: 1 }}>
                          <i className='tabler-book text-2xl text-primary' />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', pr: tieneCertPago ? 4 : 0 }}>
                              <Typography variant='body2' fontWeight={600}>{insc.curso.titulo}</Typography>
                              {tieneCertPago && (
                                <Chip
                                  size='small'
                                  icon={<i className={insc.certificado_habilitado ? 'tabler-certificate' : 'tabler-lock'} style={{ fontSize: '0.75rem' }} />}
                                  label={insc.certificado_habilitado ? `Cert. habilitado` : `Cert. ${precioFmt}`}
                                  color={insc.certificado_habilitado ? 'success' : 'warning'}
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
      <AppModal open={!!certConfirm} handleClose={() => !certLoading && setCertConfirm(null)}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: certConfirm.habilitadoActual ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)'
          }}>
            <i
              className={certConfirm.habilitadoActual ? 'tabler-lock text-4xl' : 'tabler-certificate text-4xl'}
              style={{ color: certConfirm.habilitadoActual ? '#dc2626' : '#16a34a' }}
            />
          </Box>
          <Typography variant='h5' fontWeight={700} sx={{ mb: 1 }}>
            {certConfirm.habilitadoActual ? 'Deshabilitar certificado' : 'Habilitar certificado'}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
            {certConfirm.habilitadoActual
              ? 'El estudiante ya no podrá descargar el certificado de:'
              : 'El estudiante podrá descargar el certificado de:'}
          </Typography>
          <Typography variant='body1' fontWeight={600} sx={{ mb: 4 }}>
            {certConfirm.cursoTitulo}
          </Typography>
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
                : certConfirm.habilitadoActual ? 'Sí, deshabilitar' : 'Sí, habilitar'
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
