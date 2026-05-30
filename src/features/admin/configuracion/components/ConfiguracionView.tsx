'use client'

import { useState } from 'react'
import type { SyntheticEvent } from 'react'

import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Divider,
  MenuItem,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Link,
  CardHeader,
  FormControlLabel
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { getSession } from 'next-auth/react'
import { Rol } from '@prisma/client'

import { AxiosConfiguracion } from '../http/axiosConfiguracion'
import type { Configuracion } from '../entity/Configuracion'
import MediaLibrary from '../../cursos/components/MediaLibrary'
import { useUsuarios } from '../../usuarios/hooks/useUsuarios'

interface ConfiguracionViewProps {
  initialData?: Configuracion[]
}


interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography
      variant='overline'
      sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 1.2, display: 'block', mb: 2 }}
    >
      {children}
    </Typography>
  )
}

const PLANTILLAS_CERTIFICADO = [
  {
    id: 'clasico',
    nombre: 'Clásico',
    descripcion: 'Panel lateral con gradiente. Ideal para institutos y academias.',
    thumbnail: '/images/plantillas-certificado/clasico.png',
  },
  {
    id: 'clasico_resumido',
    nombre: 'Clásico (Resumido)',
    descripcion: 'Temario a dos columnas sin cuadro de notas para ahorrar espacio.',
    thumbnail: '/images/plantillas-certificado/clasico_resumido.png',
  },
  {
    id: 'corporativo',
    nombre: 'Corporativo',
    descripcion: 'Diseño formal con borde y detalles dorados. Empresas B2B.',
    thumbnail: '/images/plantillas-certificado/corporativo.png',
  },
  {
    id: 'moderno',
    nombre: 'Moderno',
    descripcion: 'Fondo oscuro con acentos de color. Academias tech y startups.',
    thumbnail: '/images/plantillas-certificado/moderno.png',
  },
  {
    id: 'elegante',
    nombre: 'Elegante',
    descripcion: 'Fondo crema con bordes ornamentales. Estilo universitario.',
    thumbnail: '/images/plantillas-certificado/elegante.png',
  },
]

function CertificadosSettings({ config, onInputChange }: { config: any; onInputChange: (clave: string, valor: string) => void }) {
  const { data: usuariosData, isLoading } = useUsuarios({ limit: '1000' })
  const candidatos = (usuariosData?.usuarios || []).filter(u => u.rol === Rol.ADMIN || u.rol === Rol.PROFESOR)
  const plantillaActiva = config.CERTIFICADO_PLANTILLA || 'clasico'

  return (
    <Stack spacing={4}>

      {/* ── SELECTOR DE PLANTILLA ─────────────────────────────── */}
      <Box>
        <SectionLabel>Plantilla de Certificado</SectionLabel>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          Selecciona el diseño que se usará para todos los certificados generados en la plataforma.
          Los colores y el logo se aplican automáticamente según el branding configurado.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {PLANTILLAS_CERTIFICADO.map((p) => {
            const isSelected = plantillaActiva === p.id

            
return (
              <Box
                key={p.id}
                onClick={() => onInputChange('CERTIFICADO_PLANTILLA', p.id)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  overflow: 'hidden',
                  transition: 'all 0.18s',
                  boxShadow: isSelected ? 4 : 0,
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                  position: 'relative',
                }}
              >
                {isSelected && (
                  <Box
                    sx={{
                      position: 'absolute', top: 6, right: 6, zIndex: 1,
                      bgcolor: 'primary.main', borderRadius: '50%',
                      width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <i className='tabler-check' style={{ fontSize: 13, color: '#fff' }} />
                  </Box>
                )}
                <Box
                  component='img'
                  src={p.thumbnail}
                  alt={p.nombre}
                  sx={{ width: '100%', aspectRatio: '297/210', objectFit: 'cover', display: 'block' }}
                />
                <Box sx={{ p: 1.5, bgcolor: isSelected ? 'primary.main' : 'background.paper' }}>
                  <Typography
                    variant='body2'
                    fontWeight={700}
                    sx={{ color: isSelected ? '#fff' : 'text.primary', mb: 0.3 }}
                  >
                    {p.nombre}
                  </Typography>
                  <Typography
                    variant='caption'
                    sx={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'text.secondary', lineHeight: 1.3, display: 'block' }}
                  >
                    {p.descripcion}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>

      <Divider />
      <Box>
        <SectionLabel>Información de la Institución</SectionLabel>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          Estos datos se imprimirán en la cabecera del certificado. Si se dejan en blanco, se usarán los datos generales de branding.
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Nombre de la Institución'
              value={config.CERTIFICADO_INSTITUTION_NAME || ''}
              onChange={(e) => onInputChange('CERTIFICADO_INSTITUTION_NAME', e.target.value)}
              placeholder='Ej: Instituto Tecnológico ARM'
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Eslogan o Lema'
              value={config.CERTIFICADO_SLOGAN || ''}
              onChange={(e) => onInputChange('CERTIFICADO_SLOGAN', e.target.value)}
              placeholder='Ej: Capacitación de Élite'
            />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      <Box>
        <SectionLabel>Configuración de Firmas</SectionLabel>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          Selecciona al usuario que actuará como <strong>Gerente General</strong> en los certificados. Asegúrate de que tenga su <strong>Cargo</strong> y <strong>Firma</strong> configurados en su perfil.
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label='Designar Principal Firmante'
              value={config.CERTIFICADO_GERENTE_GENERAL_ID || ''}
              onChange={(e) => onInputChange('CERTIFICADO_GERENTE_GENERAL_ID', e.target.value)}
              disabled={isLoading}
              helperText='Este usuario aparecerá como el principal firmante en todos los certificados.'
            >
              <MenuItem value=''>
                <em>Ninguno seleccionado</em>
              </MenuItem>
              {candidatos.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.nombre} {u.apellido} ({u.rol})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant='outlined' sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.CERTIFICADO_MOSTRAR_FIRMA_DOCENTE !== 'false'}
                    onChange={(e) => onInputChange('CERTIFICADO_MOSTRAR_FIRMA_DOCENTE', e.target.checked ? 'true' : 'false')}
                    color='primary'
                  />
                }
                label={
                  <Box>
                    <Typography variant='body2' fontWeight={600}>Mostrar firma del docente</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Si está activo, la firma del docente del curso aparecerá como firmante secundario en el certificado.
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {config.CERTIFICADO_GERENTE_GENERAL_ID && candidatos.find(u => u.id === config.CERTIFICADO_GERENTE_GENERAL_ID) && (
        <Paper variant='outlined' sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant='subtitle2' gutterBottom>Vista Previa — Gerente General</Typography>
          {(() => {
            const gerente = candidatos.find(u => u.id === config.CERTIFICADO_GERENTE_GENERAL_ID)

            return (
              <Grid container spacing={2} alignItems='center'>
                <Grid item>
                  {gerente?.firma ? (
                    <Box sx={{ width: 120, height: 60, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 0.5 }}>
                      <img src={gerente.firma} alt='Firma' style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </Box>
                  ) : (
                    <Typography variant='caption' color='error'>Sin firma configurada</Typography>
                  )}
                </Grid>
                <Grid item xs>
                  <Typography variant='body2' fontWeight={600}>{gerente?.nombre} {gerente?.apellido}</Typography>
                  <Typography variant='caption' display='block'>
                    {gerente?.cargo || <span style={{ color: 'red' }}>Sin cargo configurado</span>}
                  </Typography>
                </Grid>
              </Grid>
            )
          })()}
        </Paper>
      )}
    </Stack>
  )
}

interface GatewayAccordionProps {
  icon: string
  title: string
  subtitle: string
  enabledKey: string
  config: any
  onInputChange: (clave: string, valor: string) => void
  children: React.ReactNode
}

function GatewayAccordion({ icon, title, subtitle, enabledKey, config, onInputChange, children }: GatewayAccordionProps) {
  const enabled = config[enabledKey] === 'true'

  return (
    <Accordion
      variant='outlined'
      sx={{ borderRadius: '8px !important', '&:before': { display: 'none' }, mb: 1 }}
    >
      <AccordionSummary
        expandIcon={<i className='tabler-chevron-down' style={{ fontSize: 18 }} />}
        sx={{ px: 3, py: 1.5, minHeight: 64 }}
      >
        <Stack direction='row' alignItems='center' spacing={2} sx={{ flex: 1, mr: 2 }}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2,
              bgcolor: 'action.selected',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <i className={icon} style={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant='subtitle1' fontWeight={600} lineHeight={1.2}>{title}</Typography>
            <Typography variant='caption' color='text.secondary'>{subtitle}</Typography>
          </Box>
          <Chip
            label={enabled ? 'Activo' : 'Inactivo'}
            color={enabled ? 'success' : 'default'}
            size='small'
            sx={{ fontWeight: 600 }}
          />
          <Switch
            checked={enabled}
            size='small'
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onInputChange(enabledKey, e.target.checked ? 'true' : 'false')}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 3, pb: 3, pt: 1 }}>
        <Divider sx={{ mb: 3 }} />
        {children}
      </AccordionDetails>
    </Accordion>
  )
}

export function ConfiguracionView({ initialData }: ConfiguracionViewProps) {
  const { enqueueSnackbar } = useSnackbar()
  const [tabValue, setTabValue] = useState(0)
  const [saving, setSaving] = useState(false)
  const [openMedia, setOpenMedia] = useState(false)
  const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({})
  const [openLogoMedia, setOpenLogoMedia] = useState(false)
  const [pendingLogoLabel, setPendingLogoLabel] = useState('')

  const initialMapped = (initialData || []).reduce((acc: { [key: string]: string }, curr: Configuracion) => {
    acc[curr.clave] = curr.valor

    return acc
  }, {})

  const [config, setConfig] = useState<{ [key: string]: string }>({
    HOME_HERO_TITLE: '',
    HOME_HERO_DESCRIPTION: '',
    WHATSAPP_NUMERO: '',
    WHATSAPP_NUMERO_EMPRESAS: '',
    HOME_LOGOS: '[]',
    TEMPLATE_NAME: 'Aula Virtual',
    TEMPLATE_SLOGAN: '',
    CERTIFICADO_INSTITUTION_NAME: '',
    CERTIFICADO_SLOGAN: '',
    CERTIFICADO_INSTITUTION_URL: '',
    TEMPLATE_LOGO: '',
    SETTINGS_COOKIE_NAME: 'arm',
    PRIMARY_COLOR_MAIN: '#131FF2',
    PRIMARY_COLOR_LIGHT: '#242CBF',
    PRIMARY_COLOR_DARK: '#9196F2',
    PAYPAL_ENABLED: 'true',
    PAYPAL_CLIENT_ID: '',
    PAYPAL_CLIENT_SECRET: '',
    PAYPAL_API_URL: 'https://api-m.sandbox.paypal.com',
    PAYPAL_PUBLIC_CLIENT_ID: '',
    PAYPAL_EXCHANGE_RATE: '3.80',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    IZIPAY_ENABLED: 'true',
    IZIPAY_MERCHANT_CODE: '',
    IZIPAY_API_KEY: '',
    IZIPAY_RSA_KEY: '',
    IZIPAY_ENDPOINT: 'https://sandbox-api-pw.izipay.pe',
    IZIPAY_SDK_URL: 'https://sandbox-checkout.izipay.pe/payments/v1/js/index.js',
    CULQI_ENABLED: 'true',
    CULQI_PUBLIC_KEY: '',
    CULQI_PRIVATE_KEY: '',
    CULQI_RSA_ID: '',
    CULQI_RSA_PUBLIC_KEY: '',
    CERTIFICADO_GERENTE_GENERAL_ID: '',
    CERTIFICADO_PLANTILLA: 'clasico',
    PAGO_MANUAL_ENABLED: 'false',
    PAGO_MANUAL_WHATSAPP_NUMERO: '',
    PAGO_MANUAL_WHATSAPP_MENSAJE: '',
    MP_ENABLED: 'true',
    MP_ACCESS_TOKEN: '',
    MP_PUBLIC_KEY: '',
    PEDIDOS_SOLICITAR_COMPROBANTE: 'true',
    COMENTARIOS_REQUIERE_APROBACION: 'false',
    ...initialMapped
  })

  const handleChangeTab = (event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleInputChange = (clave: string, valor: string) => {
    setConfig(prev => ({ ...prev, [clave]: valor }))
  }

  const logosArray: { label: string; url: string }[] = (() => {
    try { return JSON.parse(config.HOME_LOGOS || '[]') } catch { return [] }
  })()

  const handleRemoveLogo = (index: number) => {
    const updated = logosArray.filter((_, i) => i !== index)

    handleInputChange('HOME_LOGOS', JSON.stringify(updated))
  }

  const toggleSecret = (key: string) => {
    setShowSecret(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const payload = Object.entries(config).map(([clave, valor]) => {
        const item = initialData?.find(d => d.clave === clave)

        return { clave, valor, descripcion: item?.descripcion || '' }
      })

      const getAuthToken = async () => {
        const s = await getSession()

        return s?.user?.accessToken ?? null
      }

      const axiosConfig = new AxiosConfiguracion({ getAuthToken })

      await axiosConfig.save(payload)
      enqueueSnackbar('Configuración actualizada. Los cambios estéticos pueden requerir recargar la página.', { variant: 'success' })
    } catch (err) {
      console.error(err)
      enqueueSnackbar('Error al guardar la configuración', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const SecretField = ({ label, configKey, helperText }: { label: string; configKey: string; helperText?: string }) => (
    <TextField
      label={label}
      fullWidth
      type={showSecret[configKey] ? 'text' : 'password'}
      value={config[configKey] || ''}
      onChange={(e) => handleInputChange(configKey, e.target.value)}
      helperText={helperText}
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <IconButton onClick={() => toggleSecret(configKey)} edge='end' size='small'>
              <i className={showSecret[configKey] ? 'tabler-eye-off' : 'tabler-eye'} style={{ fontSize: 18 }} />
            </IconButton>
          </InputAdornment>
        )
      }}
    />
  )

  const tabs = [
    {
      label: 'Web',
      content: (
        <Stack spacing={4}>
          {/* Hero */}
          <Box>
            <Typography variant='h6' gutterBottom>Hero de la Página Principal</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Separa el título en dos líneas usando un salto de línea — la segunda línea se resaltará en color.
            </Typography>
            <Stack spacing={3}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label='Título del Hero'
                placeholder={'Aprende sin límites,\ncrece sin fronteras'}
                value={config.HOME_HERO_TITLE}
                onChange={(e) => handleInputChange('HOME_HERO_TITLE', e.target.value)}
                helperText='Usa Enter para separar líneas. La segunda línea aparece en color.'
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label='Descripción del Hero'
                placeholder='Accede a cursos especializados, rutas de aprendizaje y certificaciones...'
                value={config.HOME_HERO_DESCRIPTION}
                onChange={(e) => handleInputChange('HOME_HERO_DESCRIPTION', e.target.value)}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Logos */}
          <Box>
            <Typography variant='h6' gutterBottom>Logos de Empresas Clientes</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Estos logos aparecerán en el carrusel de la página principal. Si no hay logos, se mostrarán los predeterminados.
            </Typography>

            {/* Lista de logos actuales */}
            {logosArray.length > 0 && (
              <Stack spacing={1} sx={{ mb: 3 }}>
                {logosArray.map((logo, i) => (
                  <Paper key={i} variant='outlined' sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 64, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 1 }}>
                      <img src={logo.url} alt={logo.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </Box>
                    <Typography variant='body2' sx={{ flex: 1 }}>{logo.label}</Typography>
                    <IconButton size='small' color='error' onClick={() => handleRemoveLogo(i)}>
                      <i className='tabler-trash' style={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            )}

            {/* Formulario añadir logo */}
            <Paper variant='outlined' sx={{ p: 2 }}>
              <Typography variant='subtitle2' gutterBottom>Añadir Logo</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='flex-start'>
                <TextField
                  size='small'
                  label='Nombre del logo'
                  placeholder='Ej: TechCorp'
                  value={pendingLogoLabel}
                  onChange={(e) => setPendingLogoLabel(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<i className='tabler-photo' />}
                  onClick={() => setOpenLogoMedia(true)}
                  disabled={!pendingLogoLabel.trim()}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Seleccionar imagen
                </Button>
              </Stack>
              {!pendingLogoLabel.trim() && (
                <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                  Escribe el nombre del logo antes de seleccionar la imagen.
                </Typography>
              )}
            </Paper>
          </Box>

          <MediaLibrary
            open={openLogoMedia}
            onClose={() => setOpenLogoMedia(false)}
            onSelect={(url) => {
              const nuevo = { label: pendingLogoLabel.trim() || 'Logo', url }
              const actualizado = [...logosArray, nuevo]

              handleInputChange('HOME_LOGOS', JSON.stringify(actualizado))
              setPendingLogoLabel('')
              setOpenLogoMedia(false)
            }}
            title='Seleccionar Logo de Empresa'
            acceptType='IMAGEN'
          />

          <Divider />

          {/* Visibilidad de páginas */}
          <Box>
            <Typography variant='h6' gutterBottom>Visibilidad de Páginas</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Activa o desactiva las páginas del sitio web público. Los cambios pueden tardar unos minutos en aplicarse.
            </Typography>
            <Paper variant='outlined' sx={{ p: 2, bgcolor: 'background.default' }}>
              <Stack spacing={1}>
                <FormControlLabel
                  control={<Switch checked={config.WEB_RUTAS_HABILITADO === 'true'} onChange={(e) => handleInputChange('WEB_RUTAS_HABILITADO', e.target.checked ? 'true' : 'false')} />}
                  label='Mostrar página de Rutas de Aprendizaje'
                />
                <FormControlLabel
                  control={<Switch checked={config.WEB_EMPRESAS_HABILITADO === 'true'} onChange={(e) => handleInputChange('WEB_EMPRESAS_HABILITADO', e.target.checked ? 'true' : 'false')} />}
                  label='Mostrar página de Empresas'
                />
              </Stack>
            </Paper>
          </Box>

          <Divider />

          {/* Facturación */}
          <Box>
            <Typography variant='h6' gutterBottom>Facturación y Comprobantes</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Controla si los alumnos pueden solicitar comprobantes de pago (Boleta/Factura) durante el checkout.
            </Typography>
            <Paper variant='outlined' sx={{ p: 2, bgcolor: 'background.default' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.PEDIDOS_SOLICITAR_COMPROBANTE === 'true'}
                    onChange={(e) => handleInputChange('PEDIDOS_SOLICITAR_COMPROBANTE', e.target.checked ? 'true' : 'false')}
                  />
                }
                label='Habilitar solicitud de comprobantes en el Checkout'
              />
            </Paper>
          </Box>

          {/* Comentarios */}
          <Box>
            <Typography variant='h6' gutterBottom>Moderación de Comentarios</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Controla si los comentarios de los estudiantes requieren aprobación antes de ser visibles públicamente. Los comentarios de admin y profesor siempre se publican de inmediato.
            </Typography>
            <Paper variant='outlined' sx={{ p: 2, bgcolor: 'background.default' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.COMENTARIOS_REQUIERE_APROBACION === 'true'}
                    onChange={(e) => handleInputChange('COMENTARIOS_REQUIERE_APROBACION', e.target.checked ? 'true' : 'false')}
                  />
                }
                label='Requerir aprobación antes de publicar comentarios de estudiantes'
              />
            </Paper>
          </Box>
        </Stack>
      )
    },
    {
      label: 'Branding',
      icon: 'tabler-palette',
      content: (
        <Stack spacing={4}>
          <Box>
            <SectionLabel>Identidad de la Plataforma</SectionLabel>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Nombre de la Plataforma'
                  value={config.TEMPLATE_NAME}
                  onChange={(e) => handleInputChange('TEMPLATE_NAME', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Slogan'
                  value={config.TEMPLATE_SLOGAN}
                  onChange={(e) => handleInputChange('TEMPLATE_SLOGAN', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Nombre de Cookie'
                  value={config.SETTINGS_COOKIE_NAME}
                  onChange={(e) => handleInputChange('SETTINGS_COOKIE_NAME', e.target.value)}
                  helperText='Prefijo usado para cookies de configuración del tema'
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <SectionLabel>Logo</SectionLabel>
            <Grid container spacing={3} alignItems='flex-start'>
              <Grid item xs={12} md={4}>
                <Paper
                  variant='outlined'
                  sx={{
                    p: 2, textAlign: 'center', borderRadius: 2,
                    minHeight: 120, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 1.5
                  }}
                >
                  {config.TEMPLATE_LOGO ? (
                    <img
                      src={config.TEMPLATE_LOGO}
                      alt='Logo'
                      style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <Typography variant='caption' color='text.disabled'>Sin logo</Typography>
                  )}
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<i className='tabler-photo' />}
                    onClick={() => setOpenMedia(true)}
                  >
                    Cambiar logo
                  </Button>
                </Paper>
              </Grid>
            </Grid>
            <MediaLibrary
              open={openMedia}
              onClose={() => setOpenMedia(false)}
              onSelect={(url) => {
                handleInputChange('TEMPLATE_LOGO', url)
                enqueueSnackbar('Logo seleccionado — recuerda guardar los cambios', { variant: 'info' })
              }}
              title='Seleccionar Logo'
            />
          </Box>

          <Divider />

          <Box>
            <SectionLabel>Colores del Tema</SectionLabel>

            {/* Paletas predefinidas */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>Paletas Predefinidas</Typography>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
                Haz clic en una paleta para aplicar los colores automáticamente.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 110px)', gap: 1.5 }}>
                {[
                  { label: 'Teal & Lima', main: '#25927F', light: '#BDD962', dark: '#025E44' },
                  { label: 'Índigo & Lima', main: '#4F46E5', light: '#A3E635', dark: '#3730A3' },
                  { label: 'Océano Profundo', main: '#0369A1', light: '#38BDF8', dark: '#082F49' },
                  { label: 'Índigo & Dorado', main: '#7C3AED', light: '#FCD34D', dark: '#4C1D95' },
                  { label: 'Esmeralda', main: '#059669', light: '#A7F3D0', dark: '#064E3B' },
                  { label: 'Pizarra & Coral', main: '#475569', light: '#FB923C', dark: '#1E293B' },
                  { label: 'Granate & Champán', main: '#9F1239', light: '#FBCFE8', dark: '#4C0519' },
                  { label: 'Cian Tecnológico', main: '#0891B2', light: '#67E8F9', dark: '#164E63' },
                  { label: 'Naranja Fuego', main: '#EA580C', light: '#FED7AA', dark: '#7C2D12' },
                  { label: 'Naranja & Negro', main: '#F97316', light: '#FFEDD5', dark: '#1C1917' },
                  { label: 'Ámbar Dorado', main: '#D97706', light: '#FDE68A', dark: '#78350F' },
                  { label: 'Azul Presidencial', main: '#1D4ED8', light: '#93C5FD', dark: '#1E3A8A' },
                  { label: 'Azul & Oro', main: '#2563EB', light: '#FCD34D', dark: '#1E3A8A' },
                  { label: 'Marino Oficial', main: '#0F4C81', light: '#BAE6FD', dark: '#0C2340' },
                ].map((palette) => (
                  <Box
                    key={palette.label}
                    onClick={() => {
                      handleInputChange('PRIMARY_COLOR_MAIN', palette.main)
                      handleInputChange('PRIMARY_COLOR_LIGHT', palette.light)
                      handleInputChange('PRIMARY_COLOR_DARK', palette.dark)
                    }}
                    sx={{
                      width: 110,
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: config.PRIMARY_COLOR_MAIN === palette.main ? 'primary.main' : 'divider',
                      overflow: 'hidden',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      '&:hover': { transform: 'scale(1.04)', boxShadow: 3 },
                    }}
                  >
                    <Stack direction='row' sx={{ height: 32 }}>
                      <Box sx={{ flex: 1, bgcolor: palette.dark }} />
                      <Box sx={{ flex: 1, bgcolor: palette.main }} />
                      <Box sx={{ flex: 1, bgcolor: palette.light }} />
                    </Stack>
                    <Box sx={{ px: 1, py: 0.5, bgcolor: 'background.paper', width: '100%' }}>
                      <Typography variant='caption' sx={{ fontSize: '0.65rem', fontWeight: 600, display: 'block', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {palette.label}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Grid container spacing={3}>
              {[
                { label: 'Color Primario Principal', key: 'PRIMARY_COLOR_MAIN' },
                { label: 'Color Primario Claro (Light)', key: 'PRIMARY_COLOR_LIGHT' },
                { label: 'Color Primario Oscuro (Dark)', key: 'PRIMARY_COLOR_DARK' }
              ].map(({ label, key }) => (
                <Grid item xs={12} md={4} key={key}>
                  <Typography variant='body2' fontWeight={500} sx={{ mb: 1 }}>{label}</Typography>
                  <Stack direction='row' spacing={1.5} alignItems='center'>
                    <TextField
                      fullWidth
                      size='small'
                      value={config[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                    />
                    <Box
                      sx={{
                        width: 44, height: 44, flexShrink: 0,
                        borderRadius: 1.5, bgcolor: config[key],
                        border: '2px solid', borderColor: 'divider',
                        cursor: 'pointer'
                      }}
                      component='label'
                    >
                      <input
                        type='color'
                        value={/^#[0-9A-Fa-f]{6}$/.test(config[key]) ? config[key] : '#000000'}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                      />
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>
      )
    },
    {
      label: 'Pagos',
      icon: 'tabler-credit-card',
      content: (
        <Stack spacing={1.5}>
          <GatewayAccordion
            icon='tabler-building-bank'
            title='Culqi'
            subtitle='Tarjetas de débito y crédito (Perú)'
            enabledKey='CULQI_ENABLED'
            config={config}
            onInputChange={handleInputChange}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Public Key'
                  value={config.CULQI_PUBLIC_KEY}
                  onChange={(e) => handleInputChange('CULQI_PUBLIC_KEY', e.target.value)}
                  helperText='pk_test_... o pk_live_... — usada en el frontend para tokenizar'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SecretField
                  label='Private Key'
                  configKey='CULQI_PRIVATE_KEY'
                  helperText='sk_test_... o sk_live_... — usada en el backend para el cargo'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='RSA ID'
                  value={config.CULQI_RSA_ID}
                  onChange={(e) => handleInputChange('CULQI_RSA_ID', e.target.value)}
                  helperText='Identificador para el cifrado RSA (requerido para v4)'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='RSA Public Key'
                  multiline
                  rows={3}
                  value={config.CULQI_RSA_PUBLIC_KEY}
                  onChange={(e) => handleInputChange('CULQI_RSA_PUBLIC_KEY', e.target.value)}
                  helperText='Clave pública RSA para cifrado de datos sensibles'
                />
              </Grid>
            </Grid>
          </GatewayAccordion>

          <GatewayAccordion
            icon='tabler-shield-check'
            title='IziPay'
            subtitle='Pasarela de pagos peruana — tarjetas y billeteras'
            enabledKey='IZIPAY_ENABLED'
            config={config}
            onInputChange={handleInputChange}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Merchant Code'
                  value={config.IZIPAY_MERCHANT_CODE}
                  onChange={(e) => handleInputChange('IZIPAY_MERCHANT_CODE', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SecretField label='API Key' configKey='IZIPAY_API_KEY' />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='RSA Key'
                  multiline
                  rows={2}
                  value={config.IZIPAY_RSA_KEY}
                  onChange={(e) => handleInputChange('IZIPAY_RSA_KEY', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Endpoint API'
                  value={config.IZIPAY_ENDPOINT}
                  onChange={(e) => handleInputChange('IZIPAY_ENDPOINT', e.target.value)}
                  helperText='Ej: https://sandbox-api-pw.izipay.pe'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='SDK JS URL'
                  value={config.IZIPAY_SDK_URL}
                  onChange={(e) => handleInputChange('IZIPAY_SDK_URL', e.target.value)}
                />
              </Grid>
            </Grid>
          </GatewayAccordion>

          <GatewayAccordion
            icon='tabler-brand-paypal'
            title='PayPal'
            subtitle='Pagos internacionales en dólares (USD)'
            enabledKey='PAYPAL_ENABLED'
            config={config}
            onInputChange={handleInputChange}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Client ID'
                  value={config.PAYPAL_CLIENT_ID}
                  onChange={(e) => handleInputChange('PAYPAL_CLIENT_ID', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SecretField label='Client Secret' configKey='PAYPAL_CLIENT_SECRET' />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='API URL'
                  value={config.PAYPAL_API_URL}
                  onChange={(e) => handleInputChange('PAYPAL_API_URL', e.target.value)}
                  helperText='https://api-m.paypal.com (producción) o https://api-m.sandbox.paypal.com'
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant='caption' color='text.secondary'>Tipo de Cambio</Typography>
                </Divider>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='Soles por Dólar'
                  value={config.PAYPAL_EXCHANGE_RATE}
                  onChange={(e) => handleInputChange('PAYPAL_EXCHANGE_RATE', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>S/</InputAdornment>,
                    endAdornment: <InputAdornment position='end'>por $1</InputAdornment>
                  }}
                  helperText='Define cuántos soles equivale 1 dólar para los cobros en PayPal'
                />
              </Grid>
            </Grid>
          </GatewayAccordion>

          <GatewayAccordion
            icon='tabler-shopping-cart'
            title='Mercado Pago'
            subtitle='Pagos en línea con tarjetas, billeteras y más (Latinoamérica)'
            enabledKey='MP_ENABLED'
            config={config}
            onInputChange={handleInputChange}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SecretField
                  label='Access Token'
                  configKey='MP_ACCESS_TOKEN'
                  helperText='TEST-... (sandbox) o APP_USR-... (producción)'
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Public Key'
                  value={config.MP_PUBLIC_KEY || ''}
                  onChange={(e) => handleInputChange('MP_PUBLIC_KEY', e.target.value)}
                  helperText='TEST-... (sandbox) — usada en el frontend'
                />
              </Grid>
            </Grid>
          </GatewayAccordion>

          <GatewayAccordion
            icon='tabler-device-mobile'
            title='Pago Manual'
            subtitle='Yape, transferencias bancarias — el admin verifica el voucher'
            enabledKey='PAGO_MANUAL_ENABLED'
            config={config}
            onInputChange={handleInputChange}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Número de WhatsApp'
                  value={config.PAGO_MANUAL_WHATSAPP_NUMERO || ''}
                  onChange={(e) => handleInputChange('PAGO_MANUAL_WHATSAPP_NUMERO', e.target.value)}
                  helperText='Sin + ni espacios. Ej: 51959436827'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <i className='tabler-brand-whatsapp' style={{ fontSize: 18, color: '#25D366' }} />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Paper variant='outlined' sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Stack direction='row' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={2}>
                    <Box>
                      <Typography variant='subtitle2'>Cuentas y Métodos de Pago</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Administra los números de Yape, cuentas bancarias y QRs que verá el estudiante en el checkout.
                      </Typography>
                    </Box>
                    <Button
                      variant='outlined'
                      size='small'
                      href='/admin/metodos-pago'
                      component={Link}
                      endIcon={<i className='tabler-arrow-right' style={{ fontSize: 16 }} />}
                    >
                      Gestionar métodos
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </GatewayAccordion>
        </Stack>
      )
    },
    {
      label: 'Integraciones',
      icon: 'tabler-plug',
      content: (
        <Stack spacing={3}>
          <TextField
            label='Google Client ID'
            fullWidth
            value={config.GOOGLE_CLIENT_ID}
            onChange={(e) => handleInputChange('GOOGLE_CLIENT_ID', e.target.value)}
          />
          <SecretField
            label='Google Client Secret'
            configKey='GOOGLE_CLIENT_SECRET'
          />
        </Stack>
      )
    },
    {
      label: 'Certificación',
      icon: 'tabler-certificate',
      content: <CertificadosSettings config={config} onInputChange={handleInputChange} />
    }
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Paper
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <CardHeader title='Configuración del Sistema' className='pbe-4' sx={{ flexShrink: 0 }} />
        <Divider sx={{ flexShrink: 0 }} />

        <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleChangeTab}
            aria-label='configuracion tabs'
            sx={{
              px: 2, pt: 1,
              '& .MuiTab-root': { minHeight: 52, textTransform: 'none', fontWeight: 500, fontSize: '0.875rem' },
              '& .MuiTab-iconWrapper': { mr: 0.75 }
            }}
            variant='scrollable'
            scrollButtons='auto'
          >
            {tabs.map((tab, i) => (
              <Tab
                key={i}
                label={tab.label}
                icon={tab.icon ? <i className={tab.icon} style={{ fontSize: 18 }} /> : undefined}
                iconPosition='start'
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 3 }}>
          {tabs.map((tab, i) => (
            <CustomTabPanel key={i} value={tabValue} index={i}>
              {tab.content}
            </CustomTabPanel>
          ))}
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            borderTop: 1,
            borderColor: 'divider',
            px: 3,
            py: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            bgcolor: 'background.paper'
          }}
        >
          <Button
            variant='contained'
            size='large'
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-device-floppy' />}
            sx={{ minWidth: 180 }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
