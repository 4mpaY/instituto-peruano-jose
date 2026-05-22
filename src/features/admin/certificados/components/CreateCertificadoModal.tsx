'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Autocomplete,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Chip
} from '@mui/material'

import { toast } from 'react-toastify'
import { getSession } from 'next-auth/react'

import { AxiosCertificado } from '../http/axiosCertificado'
import { useCreateCertificado } from '../hooks/useCertificados'
import type { UsuarioBusqueda, CursoBusqueda } from '../entity/Certificado'

interface Props {
  open: boolean
  onClose: () => void
}

const today = () => new Date().toISOString().split('T')[0]

export function CreateCertificadoModal({ open, onClose }: Props) {
  const { mutateAsync: createCertificado, isPending } = useCreateCertificado()

  // ── Búsqueda de usuarios ──
  const [usuarioInput, setUsuarioInput] = useState('')
  const [usuarioOpts, setUsuarioOpts] = useState<UsuarioBusqueda[]>([])
  const [usuarioLoading, setUsuarioLoading] = useState(false)
  const [usuarioSelected, setUsuarioSelected] = useState<UsuarioBusqueda | null>(null)

  // ── Búsqueda de cursos ──
  const [cursoInput, setCursoInput] = useState('')
  const [cursoOpts, setCursoOpts] = useState<CursoBusqueda[]>([])
  const [cursoLoading, setCursoLoading] = useState(false)
  const [cursoSelected, setCursoSelected] = useState<CursoBusqueda | null>(null)

  // ── Campos opcionales ──
  const [fechaEmision, setFechaEmision] = useState(today())
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaCulminacion, setFechaCulminacion] = useState('')
  const [notaFinal, setNotaFinal] = useState('')
  const [duracion, setDuracion] = useState('')
  const [docenteNombre, setDocenteNombre] = useState('')
  const [docenteCargo, setDocenteCargo] = useState('')

  // ── Estado de duplicado ──
  const [duplicado, setDuplicado] = useState<{ id: string; codigo: string } | null>(null)

  const getAxios = useCallback(async () => {
    const s = await getSession()
    const token = s?.user?.accessToken ?? null

    return new AxiosCertificado({ getAuthToken: () => token })
  }, [])

  // Buscar usuarios con debounce
  useEffect(() => {
    if (!open) return

    const timer = setTimeout(async () => {
      setUsuarioLoading(true)

      try {
        const ax = await getAxios()
        const results = await ax.buscarUsuarios(usuarioInput)

        setUsuarioOpts(results)
      } catch {
        setUsuarioOpts([])
      } finally {
        setUsuarioLoading(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [usuarioInput, open, getAxios])

  // Buscar cursos con debounce
  useEffect(() => {
    if (!open) return

    const timer = setTimeout(async () => {
      setCursoLoading(true)

      try {
        const ax = await getAxios()
        const results = await ax.buscarCursos(cursoInput)

        setCursoOpts(results)
      } catch {
        setCursoOpts([])
      } finally {
        setCursoLoading(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [cursoInput, open, getAxios])

  const resetForm = () => {
    setUsuarioSelected(null)
    setUsuarioInput('')
    setCursoSelected(null)
    setCursoInput('')
    setFechaEmision(today())
    setFechaInicio('')
    setFechaCulminacion('')
    setNotaFinal('')
    setDuracion('')
    setDocenteNombre('')
    setDocenteCargo('')
    setDuplicado(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (reemplazar = false) => {
    if (!usuarioSelected || !cursoSelected) {
      toast.warning('Debes seleccionar un estudiante y un curso.')

      return
    }

    try {
      await createCertificado({
        usuario_id: usuarioSelected.id,
        curso_id: cursoSelected.id,
        fecha_emision: fechaEmision || undefined,
        fecha_inicio_curso: fechaInicio || undefined,
        fecha_culminacion: fechaCulminacion || undefined,
        nota_final: notaFinal !== '' ? parseFloat(notaFinal) : undefined,
        duracion_override: duracion || undefined,
        docente_nombre_override: docenteNombre || undefined,
        docente_cargo_override: docenteCargo || undefined,
        reemplazar
      })

      toast.success(reemplazar ? 'Certificado reemplazado exitosamente.' : 'Certificado creado exitosamente.')
      handleClose()
    } catch (err: any) {
      const msg: string = err?.error || err?.message || ''

      if (msg.startsWith('CERTIFICADO_DUPLICADO:')) {
        const parts = msg.split(':')

        setDuplicado({ id: parts[1], codigo: parts[2] })
      } else {
        toast.error(msg || 'Error al crear el certificado.')
      }
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant='h6' fontWeight={700}>Crear Certificado Manual</Typography>
          <Typography variant='caption' color='text.secondary'>
            Completa los datos para emitir un certificado de forma manual
          </Typography>
        </Box>
        <IconButton size='small' onClick={handleClose}>
          <i className='tabler-x text-[20px]' />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {duplicado && (
          <Alert
            severity='warning'
            sx={{ mb: 3 }}
            action={
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button size='small' variant='outlined' color='warning' onClick={() => setDuplicado(null)}>
                  Cancelar
                </Button>
                <Button size='small' variant='contained' color='warning' onClick={() => handleSubmit(true)}>
                  Reemplazar
                </Button>
              </Box>
            }
          >
            <Typography variant='body2' fontWeight={600}>Ya existe un certificado para este estudiante y curso.</Typography>
            <Typography variant='caption'>Código actual: <strong>{duplicado.codigo}</strong>. ¿Deseas reemplazarlo? Se conservará el mismo código de verificación.</Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* ── CAMPOS OBLIGATORIOS ── */}
          <Grid item xs={12}>
            <Typography variant='subtitle2' fontWeight={700} color='primary' sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
              Datos obligatorios
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={usuarioOpts}
              loading={usuarioLoading}
              value={usuarioSelected}
              onChange={(_, v) => setUsuarioSelected(v)}
              inputValue={usuarioInput}
              onInputChange={(_, v) => setUsuarioInput(v)}
              getOptionLabel={(o) => `${o.nombre} ${o.apellido}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              noOptionsText='Sin resultados'
              renderOption={(props, option) => (
                <Box component='li' {...props} key={option.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar src={option.avatar || undefined} sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                    {option.nombre[0]}
                  </Avatar>
                  <Box>
                    <Typography variant='body2' fontWeight={600}>{option.nombre} {option.apellido}</Typography>
                    <Typography variant='caption' color='text.secondary'>{option.correo}</Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Estudiante *'
                  placeholder='Buscar por nombre o correo...'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {usuarioLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={cursoOpts}
              loading={cursoLoading}
              value={cursoSelected}
              onChange={(_, v) => setCursoSelected(v)}
              inputValue={cursoInput}
              onInputChange={(_, v) => setCursoInput(v)}
              getOptionLabel={(o) => o.titulo}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              noOptionsText='Sin resultados'
              renderOption={(props, option) => (
                <Box component='li' {...props} key={option.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='body2' fontWeight={600} noWrap>{option.titulo}</Typography>
                    <Typography variant='caption' color='text.disabled'>ID: {option.id.slice(0, 8)}</Typography>
                  </Box>
                  <Chip
                    size='small'
                    label={option.estado === 'PUBLICADO' ? 'Publicado' : option.estado === 'ARCHIVADO' ? 'Archivado' : 'Borrador'}
                    color={option.estado === 'PUBLICADO' ? 'success' : option.estado === 'ARCHIVADO' ? 'default' : 'warning'}
                    variant='tonal'
                    sx={{ flexShrink: 0 }}
                  />
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Curso *'
                  placeholder='Buscar por título...'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {cursoLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </Grid>

          {/* ── FECHAS ── */}
          <Grid item xs={12}>
            <Divider>
              <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
                Fechas del certificado (opcionales)
              </Typography>
            </Divider>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label='Fecha de emisión'
              type='date'
              fullWidth
              value={fechaEmision}
              onChange={e => setFechaEmision(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText='Por defecto: hoy'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label='Fecha de inicio del curso'
              type='date'
              fullWidth
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText='Aparece en el texto del PDF'
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label='Fecha de culminación'
              type='date'
              fullWidth
              value={fechaCulminacion}
              onChange={e => setFechaCulminacion(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText='Aparece en el texto del PDF'
            />
          </Grid>

          {/* ── NOTA Y DURACIÓN ── */}
          <Grid item xs={12} md={4}>
            <TextField
              label='Nota final (0 – 20)'
              type='number'
              fullWidth
              value={notaFinal}
              onChange={e => setNotaFinal(e.target.value)}
              inputProps={{ min: 0, max: 20, step: 0.1 }}
              helperText='Aparece en la página 2 del PDF'
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label='Duración del curso'
              fullWidth
              value={duracion}
              onChange={e => setDuracion(e.target.value)}
              placeholder='Ej: 40 horas académicas'
              helperText='Dejar vacío para usar la duración del curso'
            />
          </Grid>

          {/* ── OVERRIDE DOCENTE ── */}
          {/* <Grid item xs={12}>
            <Divider>
              <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
                Override del docente (opcional)
              </Typography>
            </Divider>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label='Nombre completo del docente'
              fullWidth
              value={docenteNombre}
              onChange={e => setDocenteNombre(e.target.value)}
              placeholder='Dejar vacío para usar el profesor del curso'
              helperText='Solo nombre, el apellido se omite si completas el cargo'
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label='Cargo del docente'
              fullWidth
              value={docenteCargo}
              onChange={e => setDocenteCargo(e.target.value)}
              placeholder='Ej: Instructor Principal'
              helperText='Dejar vacío para usar el cargo del profesor del curso'
            />
          </Grid> */}
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={isPending} variant='outlined' color='inherit'>
          Cancelar
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={isPending || !usuarioSelected || !cursoSelected}
          variant='contained'
          startIcon={isPending ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-certificate text-[18px]' />}
        >
          {isPending ? 'Creando...' : 'Crear Certificado'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
