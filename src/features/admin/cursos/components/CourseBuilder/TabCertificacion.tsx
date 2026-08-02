'use client'

import { useMemo, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Tab,
  Typography,
} from '@mui/material'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { useSnackbar } from 'notistack'

import CustomTextField from '@core/components/mui/TextField'
import { useEditCurso } from '../../hooks/useCursos'
import type { Curso } from '../../entity/Curso'
import {
  addEsperaIpgPreview,
  validateCipEntregasNoOverlap,
  type CipEntregaRango,
  type UnidadEsperaIpg,
} from '@/utils/functions/certificadoDisponibilidad'

interface TabCertificacionProps {
  curso: Curso
  onSuccess: () => void
}

const emptyRango = (): Omit<CipEntregaRango, 'id'> => ({
  pagos_desde: '',
  pagos_hasta: '',
  fecha_entrega: '',
  hora: '',
})

function asEntregas(value: unknown): CipEntregaRango[] {
  if (!Array.isArray(value)) return []
  
return value.filter(
    (r): r is CipEntregaRango =>
      !!r &&
      typeof r === 'object' &&
      typeof (r as CipEntregaRango).id === 'string'
  )
}

export function TabCertificacion({ curso, onSuccess }: TabCertificacionProps) {
  const { enqueueSnackbar } = useSnackbar()
  const editMutation = useEditCurso()
  const [tab, setTab] = useState<'ipg' | 'cip'>('ipg')

  const [esperaValor, setEsperaValor] = useState<number | ''>(curso.certificado_ipg_espera_valor ?? 0)

  const [esperaUnidad, setEsperaUnidad] = useState<UnidadEsperaIpg>(
    ((curso.certificado_ipg_espera_unidad || 'DIAS').toUpperCase() as UnidadEsperaIpg) || 'DIAS'
  )

  const [precioIpg, setPrecioIpg] = useState<number | ''>(
    curso.precio_certificado_ipg ?? curso.precio_certificado ?? ''
  )

  const [precioCip, setPrecioCip] = useState<number | ''>(
    curso.precio_certificado_cip ?? ''
  )

  const [entregas, setEntregas] = useState<CipEntregaRango[]>(() => asEntregas(curso.certificado_cip_entregas))
  const [nuevo, setNuevo] = useState(emptyRango())

  const previewIpg = useMemo(() => {
    const valor = esperaValor === '' ? 0 : Number(esperaValor)

    
return addEsperaIpgPreview(valor, esperaUnidad)
  }, [esperaValor, esperaUnidad])

  const handleSaveIpg = async () => {
    try {
      const ipg = precioIpg === '' ? null : Number(precioIpg)

      const cipActual =
        curso.precio_certificado_cip != null
          ? Number(curso.precio_certificado_cip)
          : precioCip === ''
            ? null
            : Number(precioCip)

      const legacy =
        Math.max(ipg && ipg > 0 ? ipg : 0, cipActual && cipActual > 0 ? cipActual : 0) || null

      await editMutation.mutateAsync({
        id: curso.id,
        data: {
          certificado_ipg_espera_valor: esperaValor === '' ? 0 : Number(esperaValor),
          certificado_ipg_espera_unidad: esperaUnidad,
          precio_certificado_ipg: ipg,
          precio_certificado: legacy,
        } as any,
      })
      enqueueSnackbar('Configuración IPG guardada', { variant: 'success' })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al guardar', { variant: 'error' })
    }
  }

  const handleAddCip = () => {
    const candidate: CipEntregaRango = {
      id: crypto.randomUUID(),
      ...nuevo,
    }

    const next = [...entregas, candidate]
    const error = validateCipEntregasNoOverlap(next)

    if (error) {
      enqueueSnackbar(error, { variant: 'warning' })
      
return
    }

    setEntregas(next)
    setNuevo(emptyRango())
  }

  const handleRemoveCip = (id: string) => {
    setEntregas(prev => prev.filter(r => r.id !== id))
  }

  const handleSaveCip = async () => {
    const error = validateCipEntregasNoOverlap(entregas)

    if (error) {
      enqueueSnackbar(error, { variant: 'warning' })
      
return
    }

    try {
      const cip = precioCip === '' ? null : Number(precioCip)

      const ipgActual =
        curso.precio_certificado_ipg != null
          ? Number(curso.precio_certificado_ipg)
          : precioIpg === ''
            ? null
            : Number(precioIpg)

      const legacy =
        Math.max(ipgActual && ipgActual > 0 ? ipgActual : 0, cip && cip > 0 ? cip : 0) || null

      await editMutation.mutateAsync({
        id: curso.id,
        data: {
          certificado_cip_entregas: entregas,
          precio_certificado_cip: cip,
          precio_certificado: legacy,
        } as any,
      })
      enqueueSnackbar('Configuración CIP guardada', { variant: 'success' })
      onSuccess()
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Error al guardar', { variant: 'error' })
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        Configuración de entrega de certificados
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Defina cuándo el alumno podrá ver y descargar cada certificado después de habilitarlo.
      </Typography>

      <TabContext value={tab}>
        <Box
          sx={{
            display: 'inline-flex',
            p: 0.5,
            mb: 3,
            borderRadius: '12px',
            bgcolor: 'action.hover',
          }}
        >
          <TabList
            onChange={(_, v) => setTab(v)}
            TabIndicatorProps={{ style: { display: 'none' } }}
            sx={{
              minHeight: 0,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                px: 2.5,
              },
              '& .Mui-selected': {
                bgcolor: '#fff',
                boxShadow: 1,
              },
            }}
          >
            <Tab label="IPG Ingenieros" value="ipg" />
            <Tab label="Colegio de Ingenieros" value="cip" />
          </TabList>
        </Box>

        <TabPanel value="ipg" sx={{ p: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Certificados a nombre de IPG Ingenieros
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure el precio y el tiempo de espera para que el certificado IPG esté disponible
                después de habilitarlo. El precio es independiente del certificado del Colegio de
                Ingenieros.
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <CustomTextField
                    fullWidth
                    type="number"
                    label="Precio del certificado IPG (S/)"
                    value={precioIpg}
                    onChange={e => setPrecioIpg(e.target.value === '' ? '' : Number(e.target.value))}
                    inputProps={{ min: 0, step: '0.01' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <CustomTextField
                    fullWidth
                    type="number"
                    label="Tiempo de disponibilidad"
                    value={esperaValor}
                    onChange={e => setEsperaValor(e.target.value === '' ? '' : Number(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <CustomTextField
                    select
                    fullWidth
                    label="Unidad de tiempo"
                    value={esperaUnidad}
                    onChange={e => setEsperaUnidad(e.target.value as UnidadEsperaIpg)}
                  >
                    <MenuItem value="DIAS">Días</MenuItem>
                    <MenuItem value="HORAS">Horas</MenuItem>
                    <MenuItem value="MINUTOS">Minutos</MenuItem>
                  </CustomTextField>
                </Grid>
              </Grid>

              <Box
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Vista previa
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Si un certificado se habilita ahora, estará disponible el{' '}
                  <strong>
                    {previewIpg.toLocaleString('es-PE', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </strong>
                  .
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={handleSaveIpg}
                disabled={editMutation.isPending}
                startIcon={<i className="tabler-device-floppy" />}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Guardar configuración
              </Button>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="cip" sx={{ p: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Certificados a nombre del Colegio de Ingenieros
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Puede configurar <strong>varios periodos de pago (o habilitación)</strong> y un{' '}
                <strong>precio propio</strong> para este certificado (independiente del IPG). Cada
                periodo define en qué días cae el alumno y, según ese periodo, en qué fecha y hora se
                le liberará el certificado CIP.
              </Typography>

              <Box
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: 'rgba(2,94,68,0.06)',
                  border: '1px solid',
                  borderColor: 'rgba(2,94,68,0.18)',
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Cómo funciona
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.25, color: 'text.secondary', '& li': { mb: 0.75 } }}>
                  <Typography component="li" variant="body2">
                    Agregue un rango <strong>Pagos / habilitación desde – hasta</strong> (por ejemplo,
                    del 1 al 15 de marzo).
                  </Typography>
                  <Typography component="li" variant="body2">
                    Asocie a ese rango una <strong>fecha y hora de entrega</strong> (por ejemplo, el 20
                    de marzo a las 10:00).
                  </Typography>
                  <Typography component="li" variant="body2">
                    Si al alumno se le habilita el CIP dentro de ese rango, verá el certificado solo a
                    partir de esa fecha de entrega.
                  </Typography>
                  <Typography component="li" variant="body2">
                    Si cae en otro rango (por ejemplo, del 16 al 31 de marzo), usará la fecha de
                    entrega de ese otro rango.
                  </Typography>
                  <Typography component="li" variant="body2">
                    Los rangos no pueden superponerse: cada día pertenece a un solo periodo.
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <CustomTextField
                    fullWidth
                    type="number"
                    label="Precio del certificado CIP (S/)"
                    value={precioCip}
                    onChange={e => setPrecioCip(e.target.value === '' ? '' : Number(e.target.value))}
                    inputProps={{ min: 0, step: '0.01' }}
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Agregar periodo de entrega
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Indique el lapso en que el alumno paga o es habilitado, y la fecha en que se le
                  liberará el certificado.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      type="date"
                      label="Habilitación / pagos desde"
                      InputLabelProps={{ shrink: true }}
                      value={nuevo.pagos_desde}
                      onChange={e => setNuevo(v => ({ ...v, pagos_desde: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      type="date"
                      label="Habilitación / pagos hasta"
                      InputLabelProps={{ shrink: true }}
                      value={nuevo.pagos_hasta}
                      onChange={e => setNuevo(v => ({ ...v, pagos_hasta: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      type="date"
                      label="Fecha de entrega del certificado"
                      InputLabelProps={{ shrink: true }}
                      value={nuevo.fecha_entrega}
                      onChange={e => setNuevo(v => ({ ...v, fecha_entrega: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <CustomTextField
                      fullWidth
                      type="time"
                      label="Hora de entrega"
                      InputLabelProps={{ shrink: true }}
                      value={nuevo.hora}
                      onChange={e => setNuevo(v => ({ ...v, hora: e.target.value }))}
                    />
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  onClick={handleAddCip}
                  startIcon={<i className="tabler-plus" />}
                  sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Agregar periodo
                </Button>
              </Box>

              {entregas.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Periodos configurados ({entregas.length})
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 1, px: 1 }}>
                    {[
                      'Habilitación desde',
                      'Habilitación hasta',
                      'Entrega del certificado',
                      'Hora',
                      'Acciones',
                    ].map(h => (
                      <Grid item xs={h === 'Acciones' ? 1.5 : 2.625} key={h}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          {h}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Divider sx={{ mb: 1.5 }} />
                  {entregas.map(r => (
                    <Grid
                      container
                      spacing={1}
                      key={r.id}
                      alignItems="center"
                      sx={{ mb: 1.25 }}
                    >
                      {[r.pagos_desde, r.pagos_hasta, r.fecha_entrega, r.hora].map((val, idx) => (
                        <Grid item xs={2.625} key={idx}>
                          <Box
                            sx={{
                              px: 1.5,
                              py: 1,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                              fontSize: '0.85rem',
                            }}
                          >
                            {val || '—'}
                          </Box>
                        </Grid>
                      ))}
                      <Grid item xs={1.5}>
                        <IconButton color="error" onClick={() => handleRemoveCip(r.id)} size="small">
                          <i className="tabler-trash" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                  <Typography variant="caption" color="text.secondary">
                    Cada alumno se asigna al periodo cuyo rango incluye la fecha en que se le
                    habilita el certificado CIP.
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                onClick={handleSaveCip}
                disabled={editMutation.isPending}
                startIcon={<i className="tabler-device-floppy" />}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Guardar configuración
              </Button>
            </CardContent>
          </Card>
        </TabPanel>
      </TabContext>
    </Box>
  )
}
