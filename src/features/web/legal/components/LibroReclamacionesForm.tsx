'use client'

import React, { useState } from 'react'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Divider,
  Alert
} from '@mui/material'
import { BookOpenCheck } from 'lucide-react'
import Swal from 'sweetalert2'

import type { ReclamacionInput } from '@/schemas/reclamacion.schema'
import { ReclamacionSchema } from '@/schemas/reclamacion.schema'

export default function LibroReclamacionesForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successCode, setSuccessCode] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ReclamacionInput>({
    resolver: zodResolver(ReclamacionSchema),
    defaultValues: {
      tipo_documento: 'DNI',
      numero_documento: '',
      nombre: '',
      domicilio: '',
      telefono: '',
      email: '',
      nombre_apoderado: '',
      bien_contratado_tipo: 'SERVICIO',
      moneda: 'PEN',
      monto_reclamado: 0,
      descripcion_bien: '',
      tipo_reclamacion: 'RECLAMO',
      detalle: '',
      pedido: ''
    }
  })

  // Para lógica condicional de edad
  const onSubmit = async (data: ReclamacionInput) => {
    try {
      setIsSubmitting(true)

      const res = await fetch('/api/web/reclamaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          monto_reclamado: parseFloat(String(data.monto_reclamado))
        })
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.message || 'Error al procesar el reclamo')
      }

      setSuccessCode(result.result.codigo)
      Swal.fire({
        icon: 'success',
        title: '¡Reclamo Registrado!',
        text: `Tu código de seguimiento es: ${result.result.codigo}. Hemos enviado una copia de respaldo a tu correo electrónico.`,
        confirmButtonColor: 'var(--web-primary, #25927F)'
      })
      reset()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo enviar tu solicitud. Intenta nuevamente.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successCode) {
    return (
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, textAlign: 'center', p: 4, my: 6 }}>
        <BookOpenCheck size={64} color="var(--web-primary, #25927F)" style={{ margin: '0 auto 20px' }} />
        <Typography variant="h4" gutterBottom fontWeight="800" color="var(--web-primary, #25927F)">
          Solicitud Enviada Exitosamente
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Tu solicitud ha sido registrada bajo el código correlativo oficial:
        </Typography>
        <Box sx={{ bgcolor: '#f0f4f8', p: 2, borderRadius: 2, display: 'inline-block', mb: 3 }}>
          <Typography variant="h5" fontWeight="900" color="#DF143C" letterSpacing={2}>
            {successCode}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Se ha enviado una copia automática a tu correo electrónico. <br />
          Daremos respuesta en un plazo máximo de 15 días hábiles.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setSuccessCode(null)}
          sx={{ mt: 4, borderRadius: 2, textTransform: 'none' }}
        >
          Registrar otra solicitud
        </Button>
      </Card>
    )
  }

  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 6 }}>
      <Box sx={{ bgcolor: '#f8f9fa', p: 3, borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="900" color="var(--web-primary, #25927F)" mb={1}>
          LIBRO DE RECLAMACIONES
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth="800px" mx="auto">
          Conforme a lo establecido en el Código de Protección y Defensa del Consumidor,
          esta institución cuenta con un Libro de Reclamaciones Virtual a su disposición.
        </Typography>
        <Box sx={{ mt: 2, textAlign: 'left', bgcolor: 'white', p: 2, border: '1px solid #eee', borderRadius: 1 }}>
          <Typography variant="caption" display="block"><strong>PROVEEDOR:</strong> NOMBRE DE TU EMPRESA</Typography>
          <Typography variant="caption" display="block"><strong>RUC:</strong> 20600000000 </Typography>
          <Typography variant="caption" display="block"><strong>DOMICILIO:</strong> [DIRECCIÓN]</Typography>
        </Box>
      </Box>

      <CardContent sx={{ p: { xs: 2, md: 4 } }}>
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* SECCIÓN 1 */}
          <Typography variant="subtitle2" fontWeight="700" color="var(--web-primary, #25927F)" sx={{ bgcolor: '#f0f4f8', p: 1, mb: 3 }}>
            1. IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Nombre Completo o Razón Social" fullWidth error={!!errors.nombre} helperText={errors.nombre?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Controller
                  name="tipo_documento"
                  control={control}
                  render={({ field }) => (
                    <FormControl sx={{ minWidth: 110 }}>
                      <InputLabel id="tipo-doc-label">Tipo</InputLabel>
                      <Select {...field} labelId="tipo-doc-label" label="Tipo">
                        <MenuItem value="DNI">DNI</MenuItem>
                        <MenuItem value="CE">CE</MenuItem>
                        <MenuItem value="PASAPORTE">PAS.</MenuItem>
                        <MenuItem value="OTRO">OTRO</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="numero_documento"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Nº de Documento" fullWidth error={!!errors.numero_documento} helperText={errors.numero_documento?.message} />
                  )}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="domicilio"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Domicilio Completo" fullWidth error={!!errors.domicilio} helperText={errors.domicilio?.message} />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Teléfono / Celular" fullWidth error={!!errors.telefono} helperText={errors.telefono?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="email" label="Correo Electrónico (Obligatorio)" fullWidth error={!!errors.email} helperText={errors.email?.message} />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="nombre_apoderado"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Si es menor de edad, nombre del padre, madre o apoderado" fullWidth placeholder="Dejar en blanco si eres mayor de edad" />
                )}
              />
            </Grid>
          </Grid>

          {/* SECCIÓN 2 */}
          <Typography variant="subtitle2" fontWeight="700" color="var(--web-primary, #25927F)" sx={{ bgcolor: '#f0f4f8', p: 1, mt: 5, mb: 3 }}>
            2. IDENTIFICACIÓN DEL BIEN CONTRATADO
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset" error={!!errors.bien_contratado_tipo}>
                <Controller
                  name="bien_contratado_tipo"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup row {...field}>
                      <FormControlLabel value="PRODUCTO" control={<Radio size="small" />} label="Producto" />
                      <FormControlLabel value="SERVICIO" control={<Radio size="small" />} label="Servicio" />
                    </RadioGroup>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Controller
                  name="moneda"
                  control={control}
                  render={({ field }) => (
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel id="moneda-label">Moneda</InputLabel>
                      <Select {...field} labelId="moneda-label" label="Moneda">
                        <MenuItem value="PEN">S/ (PEN)</MenuItem>
                        <MenuItem value="USD">$ (USD)</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="monto_reclamado"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      inputProps={{ step: "0.01" }}
                      label="Monto Reclamado"
                      fullWidth
                      error={!!errors.monto_reclamado}
                      helperText={errors.monto_reclamado?.message}
                      placeholder="Ej: 150.00"
                      onChange={e => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    />
                  )}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="descripcion_bien"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Descripción del Producto o Servicio" fullWidth multiline rows={2} error={!!errors.descripcion_bien} helperText={errors.descripcion_bien?.message} />
                )}
              />
            </Grid>
          </Grid>

          {/* SECCIÓN 3 */}
          <Typography variant="subtitle2" fontWeight="700" color="var(--web-primary, #25927F)" sx={{ bgcolor: '#f0f4f8', p: 1, mt: 5, mb: 3 }}>
            3. DETALLE DE LA RECLAMACIÓN Y PEDIDO DEL CONSUMIDOR
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl component="fieldset" error={!!errors.tipo_reclamacion}>
                <Controller
                  name="tipo_reclamacion"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup row {...field} sx={{ mb: 2 }}>
                      <FormControlLabel value="RECLAMO" control={<Radio />} label={<b>RECLAMO¹</b>} />
                      <FormControlLabel value="QUEJA" control={<Radio />} label={<b>QUEJA²</b>} />
                    </RadioGroup>
                  )}
                />
              </FormControl>
              <Alert severity="info" sx={{ mb: 3, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
                ¹ <strong>RECLAMO:</strong> Disconformidad relacionada a los productos o servicios.<br />
                ² <strong>QUEJA:</strong> Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="detalle"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Detalle (Explique el motivo de su reclamo o queja)" fullWidth multiline rows={4} error={!!errors.detalle} helperText={errors.detalle?.message} />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="pedido"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Pedido (Especifique qué solución espera obtener)" fullWidth multiline rows={3} error={!!errors.pedido} helperText={errors.pedido?.message} />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ bgcolor: '#fffbea', p: 2, borderRadius: 1, mb: 4, borderLeft: '4px solid #ffb300' }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              * La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              * El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual es improrrogable.
            </Typography>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{
              bgcolor: 'var(--web-primary, #25927F)',
              color: 'white',
              py: 1.5,
              px: 4,
              borderRadius: 2,
              fontWeight: 'bold',
              '&:hover': { bgcolor: 'var(--web-dark, #025E44)' }
            }}
            fullWidth
          >
            {isSubmitting ? 'Enviando...' : 'ENVIAR RECLAMO/QUEJA'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
