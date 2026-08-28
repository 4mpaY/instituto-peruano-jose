'use client'

import { useEffect, useMemo, useState } from 'react'

import axios from 'axios'
import { useSnackbar } from 'notistack'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  Stack,
  TextField,
  Tooltip,
  Typography,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { MuiTelInput } from 'mui-tel-input'

import type { CipEntregaRango } from '@/utils/functions/certificadoDisponibilidad'
import {
  estimarDisponibilidadAlTramitar,
  resolvePrecioCertificadoCip,
  resolvePrecioCertificadoIpg,
} from '@/utils/functions/certificadoPrecios'
import { isValidCelular, normalizeCelular } from '@/utils/functions/validatePhone'
import { getTelFlagElement } from '@/utils/functions/getTelFlagElement'

type Step = 'datos' | 'certificacion' | 'envio' | 'resumen' | 'pago'

type CertTipo = 'IPG' | 'CIP'

interface MetodoPagoManual {
  id: string
  nombre: string
  nombre_banco?: string | null
  numero_cuenta: string
  cci?: string | null
  descripcion?: string | null
  imagen_url?: string | null
}

export interface TramiteCertificadoCursoInfo {
  id: string
  titulo: string
  moneda?: string
  precio_certificado?: number | null
  precio_certificado_ipg?: number | null
  precio_certificado_cip?: number | null
  precio_envio_fisico?: number | null
  certificado_ipg_espera_valor?: number | null
  certificado_ipg_espera_unidad?: string | null
  certificado_cip_entregas?: CipEntregaRango[] | null
}

interface Props {
  curso: TramiteCertificadoCursoInfo
  onClose?: () => void

  /** Se llama al cerrar la pantalla de éxito (no al crear el pedido). */
  onSuccess?: (info?: {
    pedidoId: string
    numeroPedido: number
    certificadoTipo: CertTipo
    etiquetaEntrega?: string
    disponibleDesde?: string | null
  }) => void | Promise<void>

  /** Si se pasa, solo se muestran esos tipos (p. ej. el faltante). */
  tiposDisponibles?: { ipg?: boolean; cip?: boolean }
}



function formatMoney(valor: number, moneda = 'PEN') {
  const symbol = moneda === 'USD' ? '$' : 'S/'

  return `${symbol} ${valor.toFixed(2)}`
}

export default function TramiteCertificadoFlow({
  curso,
  onClose,
  onSuccess,
  tiposDisponibles,
}: Props) {
  const { enqueueSnackbar } = useSnackbar()
  const [step, setStep] = useState<Step>('datos')
  const [showResumenDatos, setShowResumenDatos] = useState(false)
  const [loadingPerfil, setLoadingPerfil] = useState(true)
  const [confirmDatos, setConfirmDatos] = useState(false)
  const [tipo, setTipo] = useState<CertTipo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [pedidoCreado, setPedidoCreado] = useState<{
    numeroPedido: number
    pedidoId: string
    certificadoTipo: CertTipo
    etiquetaEntrega: string
    disponibleDesde: string | null
  } | null>(null)

  const [metodos, setMetodos] = useState<MetodoPagoManual[]>([])
  const [metodoId, setMetodoId] = useState<string | null>(null)
  const [bancoPago, setBancoPago] = useState('')
  const [codigoOperacion, setCodigoOperacion] = useState('')
  const [vouchers, setVouchers] = useState<File[]>([])
  const [voucherPreviews, setVoucherPreviews] = useState<string[]>([])


  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    celular: '',
  })

  const [solicitaEnvio, setSolicitaEnvio] = useState(false)

  const [datosEnvio, setDatosEnvio] = useState({
    metodo: 'OLVA',
    departamento: '',
    provincia: '',
    distrito: '',
    direccion: '',
    referencia: '',
  })

  const STEPS: { id: Step; label: string }[] = [
    { id: 'datos', label: 'Datos' },
    { id: 'certificacion', label: 'Certificación' },
    ...(solicitaEnvio ? [{ id: 'envio' as Step, label: 'Envío' }] : []),
    { id: 'resumen', label: 'Resumen' },
    { id: 'pago', label: 'Pago' },
  ]

  const [datosTouched, setDatosTouched] = useState(false)

  const precioIpgRaw = resolvePrecioCertificadoIpg(curso)
  const precioCipRaw = resolvePrecioCertificadoCip(curso)
  const mostrarIpg = precioIpgRaw != null && (tiposDisponibles?.ipg !== false)
  const mostrarCip = precioCipRaw != null && (tiposDisponibles?.cip !== false)
  const precioIpg = mostrarIpg ? precioIpgRaw : null
  const precioCip = mostrarCip ? precioCipRaw : null
  const moneda = curso.moneda || 'PEN'

  useEffect(() => {
    if (tipo) return
    if (precioIpg != null && precioCip == null) setTipo('IPG')
    else if (precioCip != null && precioIpg == null) setTipo('CIP')
  }, [precioIpg, precioCip, tipo])

  const dispIpg = useMemo(
    () =>
      estimarDisponibilidadAlTramitar({
        tipo: 'ipg',
        ipgEsperaValor: curso.certificado_ipg_espera_valor,
        ipgEsperaUnidad: curso.certificado_ipg_espera_unidad,
      }),
    [curso.certificado_ipg_espera_valor, curso.certificado_ipg_espera_unidad]
  )

  const dispCip = useMemo(
    () =>
      estimarDisponibilidadAlTramitar({
        tipo: 'cip',
        cipEntregas: curso.certificado_cip_entregas,
      }),
    [curso.certificado_cip_entregas]
  )

  const precioBase = tipo === 'CIP' ? precioCip : tipo === 'IPG' ? precioIpg : null
  const precioSeleccionado = precioBase != null ? precioBase + (solicitaEnvio ? Number(curso.precio_envio_fisico || 0) : 0) : null
  const stepIndex = STEPS.findIndex(s => s.id === step)
  const metodoSeleccionado = metodos.find(m => m.id === metodoId)
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text).catch(() => {})

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingPerfil(true)

        const [perfilRes, metodosRes] = await Promise.all([
          axios.get('/api/perfil'),
          axios.get('/api/metodos-pago'),
        ])

        const u = perfilRes.data?.result || perfilRes.data || {}

        setForm({
          nombre: u.nombre || '',
          apellido: u.apellido || '',
          correo: u.correo || '',
          tipo_documento: u.tipo_documento || 'DNI',
          numero_documento: u.numero_documento || '',

          // E.164: evita falso "inválido" cuando BD guarda el número sin +51
          celular: normalizeCelular(u.celular || ''),
        })

        const lista = metodosRes.data?.result?.metodos || metodosRes.data?.result || []
        const arr = Array.isArray(lista) ? lista : []

        setMetodos(arr)
        if (arr[0]?.id) setMetodoId(arr[0].id)
      } catch {
        enqueueSnackbar('No se pudo cargar tu perfil', { variant: 'error' })
      } finally {
        setLoadingPerfil(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const erroresDatos = {
    nombre: !form.nombre.trim() ? 'El nombre es obligatorio' : null,
    apellido: !form.apellido.trim() ? 'El apellido es obligatorio' : null,
    correo: !form.correo.trim() ? 'El correo es obligatorio' : null,
    numero_documento: !form.numero_documento.trim()
      ? 'El documento es obligatorio'
      : form.tipo_documento === 'DNI' && !/^\d{8}$/.test(form.numero_documento.trim())
        ? 'El DNI debe tener exactamente 8 dígitos'
        : null,
    celular: !form.celular.trim()
      ? 'El celular es obligatorio'
      : !isValidCelular(form.celular)
        ? 'Número de celular inválido para el país seleccionado'
        : null,
    confirmDatos: !confirmDatos ? 'Debes confirmar que los datos son correctos' : null,
  }

  const canContinueDatos = Object.values(erroresDatos).every(e => e == null)

  const handleVouchers = (files: File[]) => {
    // Liberar memoria
    voucherPreviews.forEach(p => URL.revokeObjectURL(p))

    if (!files || files.length === 0) {
      setVouchers([])
      setVoucherPreviews([])
      
return
    }

    const limitedFiles = files.slice(0, 5)

    setVouchers(limitedFiles)
    setVoucherPreviews(limitedFiles.map(f => URL.createObjectURL(f)))
  }

  const handleSubmitPago = async () => {
    if (!tipo || precioSeleccionado == null) return
    setSubmitError(null)

    if (!metodoId) {
      const msg = 'Selecciona un medio de pago'

      setSubmitError(msg)
      enqueueSnackbar(msg, { variant: 'warning' })

      return
    }

    if (!bancoPago.trim()) {
      const msg = 'Indica el banco o billetera donde realizaste el pago'

      setSubmitError(msg)
      enqueueSnackbar(msg, { variant: 'warning' })

      return
    }

    if (!codigoOperacion.trim()) {
      const msg = 'Ingresa el código u operación'

      setSubmitError(msg)
      enqueueSnackbar(msg, { variant: 'warning' })

      return
    }

    if (vouchers.length === 0) {
      const msg = 'Sube al menos la imagen de tu voucher'

      setSubmitError(msg)
      enqueueSnackbar(msg, { variant: 'warning' })

      return
    }

    setSubmitting(true)

    try {
      const checkoutRes = await axios.post('/api/estudiante/certificado/checkout', {
        cursoId: curso.id,
        certificadoTipo: tipo,
        metodoPagoManualId: metodoId,
        numeroComprobante: codigoOperacion.trim(),
        bancoPago: bancoPago.trim(),
        datosPerfil: {
          nombre: form.nombre,
          apellido: form.apellido,
          tipo_documento: form.tipo_documento,
          numero_documento: form.numero_documento,
          celular: form.celular,
        },
        solicitaEnvio,
        datosEnvio: solicitaEnvio ? datosEnvio : undefined,
      })

      if (!checkoutRes.data?.status) {
        throw new Error(checkoutRes.data?.message || 'No se pudo crear el pedido')
      }

      const { pedidoId, numeroPedido, certificadoTipo } = checkoutRes.data.result
      const fd = new FormData()

      vouchers.forEach(v => fd.append('voucher', v))

      // fetch sin Content-Type forzado (igual que el checkout de cursos)
      const voucherRes = await fetch(`/api/pedidos/${pedidoId}/voucher`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })

      const voucherData = await voucherRes.json().catch(() => ({}))

      if (!voucherRes.ok || voucherData?.status === false) {
        throw new Error(
          voucherData?.message ||
            'El pedido se creó, pero no se pudo subir el voucher. Revisa Mis Pedidos o contacta soporte.'
        )
      }

      const tipoCreado = (String(certificadoTipo || tipo).toUpperCase() === 'CIP' ? 'CIP' : 'IPG') as CertTipo

      const disp =
        tipoCreado === 'CIP'
          ? estimarDisponibilidadAlTramitar({
              tipo: 'cip',
              cipEntregas: curso.certificado_cip_entregas,
            })
          : estimarDisponibilidadAlTramitar({
              tipo: 'ipg',
              ipgEsperaValor: curso.certificado_ipg_espera_valor,
              ipgEsperaUnidad: curso.certificado_ipg_espera_unidad,
            })

      setPedidoCreado({
        pedidoId,
        numeroPedido,
        certificadoTipo: tipoCreado,
        etiquetaEntrega: disp.etiqueta,
        disponibleDesde: disp.disponibleDesde ? disp.disponibleDesde.toISOString() : null,
      })
      enqueueSnackbar(`Pedido #${numeroPedido} enviado. Validaremos tu pago pronto.`, {
        variant: 'success',
      })

      // Notificar al padre de inmediato (sobrevive remounts del formulario).
      // No propagar errores de refresh: el pedido ya quedó creado.
      try {
        await onSuccess?.({
          pedidoId,
          numeroPedido,
          certificadoTipo: tipoCreado,
          etiquetaEntrega: disp.etiqueta,
          disponibleDesde: disp.disponibleDesde ? disp.disponibleDesde.toISOString() : null,
        })
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Error al enviar el pago'

      setSubmitError(msg)
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEntendido = () => {
    onClose?.()
  }

  if (loadingPerfil) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (pedidoCreado) {
    const nombreTipo =
      pedidoCreado.certificadoTipo === 'CIP' ? 'Colegio de Ingenieros' : 'IPG Ingenieros'

    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            mx: 'auto',
            mb: 2,
            background: 'linear-gradient(135deg, #025E44 0%, #3AB079 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="tabler-hourglass" style={{ fontSize: '2rem', color: '#fff' }} />
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
          ¡Solicitud enviada!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 460, mx: 'auto' }}>
          Tu solicitud para el certificado ({nombreTipo}) fue registrada. Estamos esperando la
          aprobación del pago por parte del administrador.
        </Typography>

        <Box
          sx={{
            textAlign: 'left',
            maxWidth: 460,
            mx: 'auto',
            mb: 3,
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(245,158,11,0.06)',
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-clock" style={{ fontSize: 18, color: '#d97706' }} />
            ¿Qué sigue?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            1. Validaremos tu voucher y el código de operación.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            2. Al aprobar el pago, se habilitará tu certificado.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            3. {pedidoCreado.etiquetaEntrega}
          </Typography>
          {pedidoCreado.disponibleDesde && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
              Disponible estimado desde:{' '}
              <strong>
                {new Date(pedidoCreado.disponibleDesde).toLocaleString('es-PE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowResumenDatos(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '12px',
              px: 3,
            }}
          >
            Ver datos enviados
          </Button>
          <Button
            variant="contained"
            onClick={handleEntendido}
            sx={{
              bgcolor: '#025E44',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '12px',
              px: 4,
              '&:hover': { bgcolor: '#014d36' },
            }}
          >
            Entendido
          </Button>
        </Stack>

        <Dialog open={showResumenDatos} onClose={() => setShowResumenDatos(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>Datos Enviados</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nombres</Typography>
                <Typography variant="body1" fontWeight={600}>{form.nombre || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Apellidos</Typography>
                <Typography variant="body1" fontWeight={600}>{form.apellido || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Correo</Typography>
                <Typography variant="body1" fontWeight={600}>{form.correo || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{form.tipo_documento === 'DNI' ? 'DNI' : 'Documento'}</Typography>
                <Typography variant="body1" fontWeight={600}>{form.numero_documento || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Celular</Typography>
                <Typography variant="body1" fontWeight={600}>{form.celular || '-'}</Typography>
              </Box>

              {solicitaEnvio && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1 }}>Envío Físico</Typography>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Método</Typography>
                    <Typography variant="body1" fontWeight={600}>{datosEnvio.metodo === 'OLVA' ? 'Olva Courier' : 'Agencia de Encomiendas'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Ubicación</Typography>
                    <Typography variant="body1" fontWeight={600}>{`${datosEnvio.departamento}, ${datosEnvio.provincia}, ${datosEnvio.distrito}`}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Dirección</Typography>
                    <Typography variant="body1" fontWeight={600}>{datosEnvio.direccion || '-'}</Typography>
                  </Box>
                  {datosEnvio.referencia && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Referencia</Typography>
                      <Typography variant="body1" fontWeight={600}>{datosEnvio.referencia}</Typography>
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResumenDatos(false)} sx={{ fontWeight: 700 }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'inline-block',
            px: 1.5,
            py: 0.5,
            mb: 1,
            borderRadius: 999,
            bgcolor: 'action.hover',
            fontWeight: 700,
          }}
        >
          Solicitud de certificación
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
          Solicitud de certificación
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completa el formulario para tramitar tu certificado. Debes haber aprobado las evaluaciones del curso.
        </Typography>
      </Box>

      {/* Stepper */}
      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3, flexWrap: 'wrap' }}>
        {STEPS.map((s, idx) => {
          const done = idx < stepIndex
          const active = s.id === step

          return (
            <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 90 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  bgcolor: done || active ? 'primary.main' : 'action.hover',
                  color: done || active ? '#fff' : 'text.secondary',
                }}
              >
                {done ? <i className="tabler-check" style={{ fontSize: 14 }} /> : idx + 1}
              </Box>
              <Typography variant="caption" fontWeight={active ? 800 : 600} color={active ? 'text.primary' : 'text.secondary'}>
                {s.label}
              </Typography>
            </Box>
          )
        })}
      </Stack>

      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {step === 'datos' && (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
              Confirma tus datos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Todos los campos son obligatorios. Revisa que la información esté correcta antes de continuar.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nombres"
                  value={form.nombre}
                  error={datosTouched && !!erroresDatos.nombre}
                  helperText={datosTouched ? erroresDatos.nombre : undefined}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Apellidos"
                  value={form.apellido}
                  error={datosTouched && !!erroresDatos.apellido}
                  helperText={datosTouched ? erroresDatos.apellido : undefined}
                  onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  disabled
                  label="Correo electrónico"
                  value={form.correo}
                  error={datosTouched && !!erroresDatos.correo}
                  helperText={datosTouched ? erroresDatos.correo : undefined}
                  onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Tipo Doc."
                  value={form.tipo_documento}
                  onChange={e => setForm(f => ({ ...f, tipo_documento: e.target.value }))}
                >
                  <MenuItem value="DNI">DNI</MenuItem>
                  <MenuItem value="CE">CE</MenuItem>
                  <MenuItem value="PASAPORTE">Pasaporte</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8} md={3}>
                <TextField
                  fullWidth
                  required
                  label={form.tipo_documento === 'DNI' ? 'DNI' : 'Documento'}
                  value={form.numero_documento}
                  error={datosTouched && !!erroresDatos.numero_documento}
                  helperText={datosTouched ? erroresDatos.numero_documento : undefined}
                  inputProps={
                    form.tipo_documento === 'DNI'
                      ? { maxLength: 8, inputMode: 'numeric', pattern: '[0-9]*' }
                      : { maxLength: 20 }
                  }
                  onChange={e => {
                    const value =
                      form.tipo_documento === 'DNI'
                        ? e.target.value.replace(/\D/g, '').slice(0, 8)
                        : e.target.value.slice(0, 20)

                    setForm(f => ({ ...f, numero_documento: value }))
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MuiTelInput
                  fullWidth
                  required
                  label="Número de celular"
                  defaultCountry="PE"
                  forceCallingCode
                  preferredCountries={['PE', 'CO', 'MX', 'CL', 'AR', 'VE']}
                  value={form.celular}
                  getFlagElement={getTelFlagElement}
                  error={datosTouched && !!erroresDatos.celular}
                  helperText={datosTouched ? erroresDatos.celular ?? undefined : undefined}
                  onChange={newValue => setForm(f => ({ ...f, celular: newValue }))}
                />
              </Grid>
            </Grid>
            <FormControlLabel
              sx={{ mt: 2, alignItems: 'flex-start' }}
              control={
                <Checkbox
                  checked={confirmDatos}
                  onChange={e => setConfirmDatos(e.target.checked)}
                  color={datosTouched && !!erroresDatos.confirmDatos ? 'error' : 'primary'}
                />
              }
              label="Confirmo que los datos ingresados son correctos y serán usados para la emisión del certificado. *"
            />
            {datosTouched && erroresDatos.confirmDatos && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: -0.5, ml: 4 }}>
                {erroresDatos.confirmDatos}
              </Typography>
            )}
          </>
        )}

        {step === 'certificacion' && (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
              Elige tu tipo de certificación
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Solo puedes obtener un tipo de certificado por curso (IPG o Colegio de Ingenieros).
            </Typography>
            <Grid container spacing={2}>
              {precioIpg != null && (
                <Grid item xs={12} md={precioCip != null ? 6 : 12}>
                  <CertOptionCard
                    selected={tipo === 'IPG'}
                    onSelect={() => setTipo('IPG')}
                    badge="Entrega rápida"
                    title="Certificado IPG Ingenieros"
                    bullets={[dispIpg.etiqueta, 'Emitido por IPG Ingenieros.']}
                    price={formatMoney(precioIpg, moneda)}
                  />
                </Grid>
              )}
              {precioCip != null && (
                <Grid item xs={12} md={precioIpg != null ? 6 : 12}>
                  <CertOptionCard
                    selected={tipo === 'CIP'}
                    onSelect={() => setTipo('CIP')}
                    badge="Certificación oficial"
                    title="Certificado Colegio de Ingenieros"
                    bullets={[dispCip.etiqueta, 'Emitido por el Colegio de Ingenieros.']}
                    price={formatMoney(precioCip, moneda)}
                  />
                </Grid>
              )}
            </Grid>
            {precioIpg == null && precioCip == null && (
              <Typography color="warning.main">
                Este curso aún no tiene precios de certificado configurados.
              </Typography>
            )}

            {curso.precio_envio_fisico != null && Number(curso.precio_envio_fisico) > 0 && (
              <Box sx={{ mt: 3, p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider', bgcolor: solicitaEnvio ? 'rgba(2,94,68,0.02)' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <FormControlLabel
                  sx={{ m: 0, alignItems: 'flex-start' }}
                  control={
                    <Checkbox
                      sx={{ mt: -1 }}
                      checked={solicitaEnvio}
                      onChange={e => setSolicitaEnvio(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography fontWeight={700}>También quiero mi certificado físico <Typography component="span" variant="caption" color="text.secondary">(opcional)</Typography></Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Envío estimado: 5 a 7 días hábiles después de la emisión. En el siguiente paso eliges cómo recibirlo.
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="h6" fontWeight={800} sx={{ pr: 1, pl: { xs: 5, sm: 0 }, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                  + {formatMoney(Number(curso.precio_envio_fisico), moneda)}
                </Typography>
              </Box>
            )}
          </>
        )}

        {step === 'envio' && solicitaEnvio && (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
              Datos de envío
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Elige cómo deseas recibir tu certificado físico e ingresa la dirección.
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Método de envío</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box
                    onClick={() => setDatosEnvio(d => ({ ...d, metodo: 'OLVA' }))}
                    sx={{
                      p: 1.5,
                      border: '2px solid',
                      borderColor: datosEnvio.metodo === 'OLVA' ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      bgcolor: datosEnvio.metodo === 'OLVA' ? 'rgba(2,94,68,0.04)' : 'transparent',
                    }}
                  >
                    <Radio checked={datosEnvio.metodo === 'OLVA'} sx={{ p: 0 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>Olva Courier</Typography>
                      <Typography variant="caption" color="text.secondary">Entrega en tu dirección.</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box
                    onClick={() => setDatosEnvio(d => ({ ...d, metodo: 'SHALOM' }))}
                    sx={{
                      p: 1.5,
                      border: '2px solid',
                      borderColor: datosEnvio.metodo === 'SHALOM' ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      bgcolor: datosEnvio.metodo === 'SHALOM' ? 'rgba(2,94,68,0.04)' : 'transparent',
                    }}
                  >
                    <Radio checked={datosEnvio.metodo === 'SHALOM'} sx={{ p: 0 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>Shalom</Typography>
                      <Typography variant="caption" color="text.secondary">Recojo en agencia.</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Departamento"
                    value={datosEnvio.departamento}
                    onChange={e => setDatosEnvio(d => ({ ...d, departamento: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Provincia"
                    value={datosEnvio.provincia}
                    onChange={e => setDatosEnvio(d => ({ ...d, provincia: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Distrito"
                    value={datosEnvio.distrito}
                    onChange={e => setDatosEnvio(d => ({ ...d, distrito: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Dirección completa"
                    placeholder="Av. / Jr. / Calle, número, urbanización"
                    value={datosEnvio.direccion}
                    onChange={e => setDatosEnvio(d => ({ ...d, direccion: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Referencia"
                    placeholder="Ej. Frente al parque central"
                    value={datosEnvio.referencia}
                    onChange={e => setDatosEnvio(d => ({ ...d, referencia: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          </>
        )}

        {step === 'resumen' && tipo && precioSeleccionado != null && (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
              Resumen de tu solicitud
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Revisa todo antes de proceder con el pago.
            </Typography>

            <Typography variant="caption" fontWeight={800} color="text.secondary">
              DATOS PERSONALES
            </Typography>
            <Box sx={{ mt: 1, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              {[
                ['Nombres', form.nombre],
                ['Apellidos', form.apellido],
                ['Correo', form.correo],
                [form.tipo_documento === 'DNI' ? 'DNI' : 'Documento', form.numero_documento],
                ['Celular', form.celular || '—'],
              ].map(([k, v], i) => (
                <Box
                  key={k}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    px: 2,
                    py: 1.25,
                    borderTop: i ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">{k}</Typography>
                  <Typography variant="body2" fontWeight={600}>{v}</Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="caption" fontWeight={800} color="text.secondary">
              CERTIFICACIÓN
            </Typography>
            <Box sx={{ mt: 1, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 2, py: 1.5 }}>
              <Typography variant="body2" color="text.secondary">Tipo de certificado</Typography>
              <Typography variant="body2" fontWeight={700}>
                {tipo === 'CIP' ? 'Certificado Colegio de Ingenieros' : 'Certificado IPG Ingenieros'}
                {tipo === 'CIP' && dispCip.disponibleDesde
                  ? ` (${dispCip.disponibleDesde.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })})`
                  : ''}
              </Typography>
            </Box>

            {solicitaEnvio && (
              <>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  ENVÍO FÍSICO
                </Typography>
                <Box sx={{ mt: 1, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                  {[
                    ['Método', datosEnvio.metodo === 'OLVA' ? 'Olva Courier' : 'Agencia de Encomiendas'],
                    ['Ubicación', `${datosEnvio.departamento}, ${datosEnvio.provincia}, ${datosEnvio.distrito}`],
                    ['Dirección', datosEnvio.direccion],
                    datosEnvio.referencia ? ['Referencia', datosEnvio.referencia] : null,
                  ].filter(Boolean).map((item, i) => {
                    if (!item) return null
                    const [k, v] = item

                    
return (
                      <Box
                        key={k as string}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 2,
                          px: 2,
                          py: 1.25,
                          borderTop: i ? '1px solid' : 'none',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">{k}</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right' }}>{v}</Typography>
                      </Box>
                    )
                  })}
                </Box>
              </>
            )}

            <Typography variant="caption" fontWeight={800} color="text.secondary">
              PAGO
            </Typography>
            <Box sx={{ mt: 1, px: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: solicitaEnvio ? 0.5 : 1 }}>
                <Typography variant="body2">Precio del certificado</Typography>
                <Typography variant="body2">{formatMoney(Number(precioBase || 0), moneda)}</Typography>
              </Box>
              {solicitaEnvio && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Envío físico</Typography>
                  <Typography variant="body2">{formatMoney(Number(curso.precio_envio_fisico || 0), moneda)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={800}>Total a pagar</Typography>
                <Typography fontWeight={800} fontSize="1.1rem">
                  {formatMoney(precioSeleccionado, moneda)}
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {step === 'pago' && precioSeleccionado != null && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" fontWeight={800}>Método de pago</Typography>
              <Chip
                label={`Total a pagar: ${formatMoney(precioSeleccionado, moneda)}`}
                color="primary"
                sx={{ fontWeight: 800 }}
              />
            </Box>



            {/* Paso 1: elegir dónde pagar */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <PagoStepBadge n={1} />
              <Typography variant="subtitle2" fontWeight={700}>Elige dónde vas a realizar el pago</Typography>
            </Stack>

            {metodos.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 3 }}>No hay métodos de pago disponibles en este momento.</Alert>
            ) : (
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {metodos.map(m => {
                  const isSelected = metodoId === m.id

                  return (
                    <Box
                      key={m.id}
                      onClick={() => setMetodoId(m.id)}
                      sx={{
                        border: '2px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        bgcolor: isSelected ? 'rgba(2,94,68,0.04)' : 'background.paper',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 1.75 }}>
                        {m.imagen_url ? (
                          <Avatar
                            src={m.imagen_url}
                            variant="rounded"
                            sx={{ width: 44, height: 44, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
                          />
                        ) : (
                          <Avatar variant="rounded" sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: 'primary.100' }}>
                            <i className="tabler-cash" style={{ fontSize: 20 }} />
                          </Avatar>
                        )}
                        <Box flex={1} minWidth={0}>
                          <Typography variant="body2" fontWeight={700} noWrap>{m.nombre_banco || m.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{m.numero_cuenta}</Typography>
                        </Box>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            flexShrink: 0,
                            border: '2px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            bgcolor: isSelected ? 'primary.main' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <i className="tabler-check" style={{ fontSize: 11, color: '#fff' }} />}
                        </Box>
                      </Stack>
                    </Box>
                  )
                })}
              </Stack>
            )}

            {/* Paso 2: datos del método seleccionado */}
            {metodoSeleccionado && (
              <>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <PagoStepBadge n={2} />
                  <Typography variant="subtitle2" fontWeight={700}>Realiza el pago con estos datos</Typography>
                </Stack>

                <Box sx={{ mb: metodoSeleccionado.descripcion ? 2 : 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  {metodoSeleccionado.imagen_url && (
                    <Box sx={{ textAlign: 'center', p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                      <Box
                        component="img"
                        src={metodoSeleccionado.imagen_url}
                        alt={metodoSeleccionado.nombre}
                        sx={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', borderRadius: 1 }}
                      />
                    </Box>
                  )}

                  <Box sx={{ px: 2.5, py: 1.5 }}>
                    {metodoSeleccionado.nombre_banco && (
                      <PagoCopyRow
                        label="Banco / Billetera"
                        value={metodoSeleccionado.nombre_banco}
                        onCopy={() => copyToClipboard(metodoSeleccionado.nombre_banco!)}
                      />
                    )}
                    <PagoCopyRow
                      label="N° Cuenta"
                      value={metodoSeleccionado.numero_cuenta}
                      onCopy={() => copyToClipboard(metodoSeleccionado.numero_cuenta)}
                    />
                    {metodoSeleccionado.cci && (
                      <PagoCopyRow
                        label="CCI"
                        value={metodoSeleccionado.cci}
                        onCopy={() => copyToClipboard(metodoSeleccionado.cci!)}
                      />
                    )}
                  </Box>

                  <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(2,94,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" fontWeight={600} color="primary.main">Monto exacto a pagar</Typography>
                    <Chip
                      label={formatMoney(precioSeleccionado, moneda)}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 800, fontSize: '0.85rem' }}
                    />
                  </Box>
                </Box>

                {metodoSeleccionado.descripcion && (
                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2, fontSize: 12 }}>{metodoSeleccionado.descripcion}</Alert>
                )}
              </>
            )}

            {/* Paso 3: banco, código y comprobante */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <PagoStepBadge n={3} />
              <Typography variant="subtitle2" fontWeight={700}>Registra tu pago y sube el voucher</Typography>
            </Stack>

            <TextField
              fullWidth
              required
              label="Banco o billetera donde realizaste el pago"
              placeholder="Ej. BCP, Interbank, Yape, Plin..."
              value={bancoPago}
              onChange={e => setBancoPago(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Indica desde qué banco o app enviaste el dinero"
            />

            <TextField
              fullWidth
              required
              label="Código o número de operación"
              placeholder="Ej. 000123456"
              value={codigoOperacion}
              onChange={e => setCodigoOperacion(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
              Imagen del voucher / comprobante *
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Captura de pantalla o foto de la transferencia (JPG, PNG, WEBP, PDF - máx. 5 MB c/u, hasta 5 archivos)
            </Typography>

            {voucherPreviews.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {voucherPreviews.map((preview, idx) => (
                  <Box key={idx} sx={{ position: 'relative', width: 80, height: 80 }}>
                    {vouchers[idx]?.type === 'application/pdf' ? (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <i className="tabler-file-type-pdf" style={{ fontSize: 32, color: '#ef4444' }} />
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={preview}
                        alt="Comprobante de pago"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newVouchers = [...vouchers]

                        newVouchers.splice(idx, 1)
                        handleVouchers(newVouchers)
                      }}
                      sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'error.main', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: 'error.dark' } }}
                    >
                      <i className="tabler-x" style={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {vouchers.length < 5 && (
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  p: 3,
                  borderRadius: 2.5,
                  border: '2px dashed',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  textAlign: 'center',
                  minHeight: 160,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                <input
                  hidden
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={e => {
                    const files = Array.from(e.target.files || [])
                    
                    const validFiles = files.filter(f => {
                      if (f.size > 5 * 1024 * 1024) {
                        enqueueSnackbar(`El archivo ${f.name} supera los 5 MB`, { variant: 'warning' })
                        
return false
                      }

                      
return true
                    })

                    if (validFiles.length > 0) {
                      const newVouchers = [...vouchers, ...validFiles].slice(0, 5)

                      handleVouchers(newVouchers)
                    }
                    
                    e.target.value = ''
                  }}
                />
                <i className="tabler-photo-up" style={{ fontSize: 36, color: '#64748b' }} />
                <Typography variant="body2" fontWeight={700}>
                  Haz clic para subir comprobante(s)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Puedes subir hasta 5 imágenes o PDFs (máx 5MB c/u)
                </Typography>
              </Box>
            )}
          </>
        )}

        {submitError && step === 'pago' && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2.5, gap: 1.5 }}>
        <Button
          variant="outlined"
          startIcon={<i className="tabler-chevron-left" />}
          onClick={() => {
            if (step === 'datos') onClose?.()
            else {
              const currentIdx = STEPS.findIndex(s => s.id === step)

              setStep(STEPS[currentIdx - 1].id)
            }
          }}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {step === 'datos' ? 'Cancelar' : 'Atrás'}
        </Button>

        {step !== 'pago' ? (
          <Button
            variant="contained"
            endIcon={<i className="tabler-chevron-right" />}
            disabled={step === 'certificacion' && !tipo}
            onClick={() => {
              if (step === 'datos') {
                setDatosTouched(true)

                if (!canContinueDatos) {
                  enqueueSnackbar('Completa todos los campos obligatorios', { variant: 'warning' })

                  return
                }

                setStep('certificacion')
              } else {
                const currentIdx = STEPS.findIndex(s => s.id === step)

                setStep(STEPS[currentIdx + 1].id)
              }
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {step === 'resumen' ? 'Confirmar y continuar al pago' : 'Continuar'}
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <i className="tabler-send" />}
            onClick={handleSubmitPago}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Enviando...' : 'Enviar pago para revisión'}
          </Button>
        )}
      </Box>
    </Box>
  )
}

function PagoStepBadge({ n }: { n: number }) {
  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        bgcolor: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Typography variant="caption" color="white" fontWeight={800} lineHeight={1}>{n}</Typography>
    </Box>
  )
}

function PagoCopyRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 110 }}>{label}</Typography>
      <Stack direction="row" alignItems="center" spacing={0.25}>
        <Typography variant="body2" fontWeight={700} fontFamily="monospace">{value}</Typography>
        <Tooltip title="Copiar">
          <IconButton size="small" onClick={onCopy} sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
            <i className="tabler-copy" style={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  )
}

function CertOptionCard({
  selected,
  onSelect,
  badge,
  title,
  bullets,
  price,
}: {
  selected: boolean
  onSelect: () => void
  badge: string
  title: string
  bullets: string[]
  price: string
}) {
  return (
    <Box
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onSelect()
      }}
      sx={{
        p: 2.5,
        height: '100%',
        borderRadius: 3,
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        cursor: 'pointer',
        position: 'relative',
        bgcolor: selected ? 'rgba(2,94,68,0.04)' : 'background.paper',
      }}
    >
      <Radio checked={selected} sx={{ position: 'absolute', top: 8, right: 8 }} />
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {badge}
      </Typography>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.25, pr: 4 }}>
        {title}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, mb: 2, color: 'text.secondary' }}>
        {bullets.map(b => (
          <Typography component="li" variant="body2" key={b} sx={{ mb: 0.5 }}>
            {b}
          </Typography>
        ))}
      </Box>
      <Typography variant="h6" fontWeight={800}>
        {price}
      </Typography>
    </Box>
  )
}
