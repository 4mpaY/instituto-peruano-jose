'use client'

import { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'
import MediaLibrary from '../MediaLibrary'
import { sanitizeDatetimeInput, toLocalDatetimeLocalValue } from '@/utils/functions/sanitizeDatetime'

type Recurso = { nombre: string; url: string; tipo?: 'enlace' | 'archivo' }

function inferTipo(r: Recurso): 'enlace' | 'archivo' {
  if (r.tipo) return r.tipo

  return r.url.startsWith('/') ? 'archivo' : 'enlace'
}

function getFileExt(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toUpperCase() ?? ''
  const known = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'ZIP', 'PNG', 'JPG', 'JPEG', 'MP4', 'WEBM', 'PPT', 'PPTX']

  return known.includes(ext) ? ext : 'FILE'
}

function detectService(url: string): { name: string; icon: string; domain: string } {
  try {
    const u = new URL(url)
    const h = u.hostname

    if (h.includes('drive.google.com') || h.includes('docs.google.com')) return { name: 'Google Drive', icon: 'tabler-brand-google-drive', domain: h }
    if (h.includes('dropbox.com')) return { name: 'Dropbox', icon: 'tabler-brand-dropbox', domain: h }
    if (h.includes('onedrive.live.com') || h.includes('sharepoint.com') || h.includes('1drv.ms')) return { name: 'OneDrive', icon: 'tabler-cloud', domain: h }
    if (h.includes('notion.so')) return { name: 'Notion', icon: 'tabler-brand-notion', domain: h }
    if (h.includes('youtube.com') || h.includes('youtu.be')) return { name: 'YouTube', icon: 'tabler-brand-youtube', domain: h }
    if (h.includes('vimeo.com')) return { name: 'Vimeo', icon: 'tabler-brand-vimeo', domain: h }
    if (h.includes('figma.com')) return { name: 'Figma', icon: 'tabler-brand-figma', domain: h }
    if (h.includes('github.com')) return { name: 'GitHub', icon: 'tabler-brand-github', domain: h }

    return { name: h, icon: 'tabler-world-www', domain: h }
  } catch {
    return { name: 'Enlace', icon: 'tabler-link', domain: '' }
  }
}

interface LessonEditDialogProps {
  open: boolean
  onClose: () => void
  lessonData: any
  onSave: (data: any) => void
  isSaving: boolean
}

export function LessonEditDialog({ open, onClose, lessonData, onSave, isSaving }: LessonEditDialogProps) {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState<number | string>('')
  const [videoUrl, setVideoUrl] = useState('')
  const [esEnVivo, setEsEnVivo] = useState(false)
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [enlaceReunion, setEnlaceReunion] = useState('')
  const [esVistaPrevia, setEsVistaPrevia] = useState(false)
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [contenido, setContenido] = useState('')

  const [recursoMode, setRecursoMode] = useState<'enlace' | 'archivo'>('enlace')
  const [newRecurso, setNewRecurso] = useState<Recurso>({ nombre: '', url: '', tipo: 'enlace' })
  const [openMediaResources, setOpenMediaResources] = useState(false)

  useEffect(() => {
    if (lessonData) {
      setTitle(lessonData.titulo || '')
      setDuration(lessonData.duracion || '')
      setVideoUrl(lessonData.video_url || '')
      setEsEnVivo(lessonData.es_en_vivo || false)

      setFechaProgramada(lessonData.fecha_programada ? toLocalDatetimeLocalValue(lessonData.fecha_programada) : '')
      setFechaFin(lessonData.fecha_fin ? toLocalDatetimeLocalValue(lessonData.fecha_fin) : '')
      setEnlaceReunion(lessonData.enlace_reunion || '')
      setEsVistaPrevia(lessonData.es_vista_previa || false)
      setRecursos(lessonData.recursos || [])
      setContenido(lessonData.contenido || '')
    } else {
      setTitle('')
      setDuration('')
      setVideoUrl('')
      setEsEnVivo(false)
      setFechaProgramada('')
      setFechaFin('')
      setEnlaceReunion('')
      setEsVistaPrevia(false)
      setRecursos([])
      setContenido('')
    }
  }, [lessonData])

  const handleAddRecurso = () => {
    if (newRecurso.nombre && newRecurso.url) {
      setRecursos([...recursos, { ...newRecurso, tipo: recursoMode }])
      setNewRecurso({ nombre: '', url: '', tipo: recursoMode })
    }
  }

  const handleRemoveRecurso = (index: number) => {
    setRecursos(recursos.filter((_, i) => i !== index))
  }

  const handleModeChange = (mode: 'enlace' | 'archivo') => {
    setRecursoMode(mode)
    setNewRecurso({ nombre: '', url: '', tipo: mode })
  }

  const handleSave = () => {
    onSave({
      titulo: title,
      duracion: duration ? Number(duration) : null,
      video_url: videoUrl || null,
      es_en_vivo: esEnVivo,
      fecha_programada: sanitizeDatetimeInput(fechaProgramada),
      fecha_fin: sanitizeDatetimeInput(fechaFin),
      enlace_reunion: enlaceReunion || null,
      es_vista_previa: esVistaPrevia,
      contenido: contenido || null,
      recursos: recursos
    })
  }

  const urlPreview = recursoMode === 'enlace' && newRecurso.url.length > 7 && newRecurso.url.startsWith('http')
    ? detectService(newRecurso.url)
    : null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Editar Lección</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={4} sx={{ mt: 2 }}>
          <CustomTextField
            fullWidth
            label='Título de la lección'
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <CustomTextField
            fullWidth
            multiline
            rows={3}
            label='Contenido / Descripción'
            placeholder='Descripción o instrucciones de la lección...'
            value={contenido}
            onChange={e => setContenido(e.target.value)}
          />

          <Divider />
          <Typography variant='subtitle2' color='primary'>Tipo de Lección</Typography>

          <FormControlLabel
            control={
              <Switch
                checked={esEnVivo}
                onChange={e => setEsEnVivo(e.target.checked)}
                color='primary'
              />
            }
            label={
              <Box>
                <Typography variant='body2' fontWeight={600}>¿Es una clase en vivo?</Typography>
                <Typography variant='caption' color='text.secondary'>Activa esto si la clase se transmitirá en tiempo real.</Typography>
              </Box>
            }
          />

          {esEnVivo ? (
            <>
              <CustomTextField
                fullWidth
                type='datetime-local'
                label='Fecha y Hora de Inicio'
                value={fechaProgramada}
                onChange={e => setFechaProgramada(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <CustomTextField
                fullWidth
                type='datetime-local'
                label='Fecha y Hora de Fin'
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <CustomTextField
                fullWidth
                label='Enlace de la Reunión (Zoom, Meet, WhatsApp, etc.)'
                placeholder='https://zoom.us/j/...'
                value={enlaceReunion}
                onChange={e => setEnlaceReunion(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position='start'><i className='tabler-link text-xl text-textSecondary' /></InputAdornment>
                }}
              />
            </>
          ) : (
            <CustomTextField
              fullWidth
              label='URL del Video (Vimeo / Youtube)'
              placeholder='https://vimeo.com/...'
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position='start'><i className='tabler-brand-vimeo text-xl text-textSecondary' /></InputAdornment>
              }}
            />
          )}

          <CustomTextField
            fullWidth
            type='number'
            label='Duración estimada (minutos)'
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />

          <FormControlLabel
            control={
              <Switch
                checked={esVistaPrevia}
                onChange={e => setEsVistaPrevia(e.target.checked)}
                color='primary'
              />
            }
            label={
              <Box>
                <Typography variant='body2' fontWeight={600}>Vista Previa Gratuita</Typography>
                <Typography variant='caption' color='text.secondary'>Permite que esta lección sea vista sin estar matriculado.</Typography>
              </Box>
            }
          />

          <Divider />

          {/* ── RECURSOS Y MATERIALES ── */}
          <Typography variant='subtitle2' sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem', color: 'text.secondary' }}>
            Recursos y Materiales
          </Typography>

          {/* Lista de recursos */}
          {recursos.length > 0 && (
            <Stack spacing={1.5}>
              {recursos.map((r, i) => {
                const tipo = inferTipo(r)
                const service = tipo === 'enlace' ? detectService(r.url) : null
                const ext = tipo === 'archivo' ? getFileExt(r.url) : null

                return (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: '10px 14px',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    {/* Badge tipo */}
                    {tipo === 'enlace' ? (
                      <Chip
                        label='URL'
                        size='small'
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                          bgcolor: 'primary.main',
                          color: '#fff',
                          borderRadius: 1,
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Chip
                        label={ext}
                        size='small'
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                          bgcolor: 'warning.main',
                          color: '#fff',
                          borderRadius: 1,
                          flexShrink: 0,
                        }}
                      />
                    )}

                    {/* Nombre + servicio */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='body2' fontWeight={600} noWrap>{r.nombre}</Typography>
                      {tipo === 'enlace' && service && (
                        <Typography variant='caption' color='text.secondary' noWrap>
                          {service.name}
                        </Typography>
                      )}
                    </Box>

                    {/* Botones */}
                    {tipo === 'enlace' && r.url && (
                      <IconButton size='small' onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')}>
                        <i className='tabler-external-link text-base text-textSecondary' />
                      </IconButton>
                    )}
                    <IconButton size='small' color='error' onClick={() => handleRemoveRecurso(i)}>
                      <i className='tabler-x text-base' />
                    </IconButton>
                  </Box>
                )
              })}
            </Stack>
          )}

          {/* Formulario añadir recurso */}
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {/* Pestañas */}
            <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
              {(['enlace', 'archivo'] as const).map((mode) => (
                <Button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  fullWidth
                  disableRipple
                  startIcon={<i className={mode === 'enlace' ? 'tabler-link text-base' : 'tabler-upload text-base'} />}
                  sx={{
                    borderRadius: 0,
                    py: 1.25,
                    fontWeight: recursoMode === mode ? 700 : 400,
                    fontSize: '0.8rem',
                    color: recursoMode === mode ? 'primary.main' : 'text.secondary',
                    backgroundColor: recursoMode === mode ? 'action.selected' : 'transparent',
                    borderBottom: recursoMode === mode ? '2px solid' : '2px solid transparent',
                    borderBottomColor: recursoMode === mode ? 'primary.main' : 'transparent',
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  {mode === 'enlace' ? 'Enlace externo' : 'Subir archivo'}
                </Button>
              ))}
            </Box>

            {/* Contenido del tab */}
            <Stack spacing={2} sx={{ p: 2 }}>
              <CustomTextField
                fullWidth
                size='small'
                placeholder={recursoMode === 'enlace' ? 'Nombre del recurso (ej: Guía del módulo)' : 'Nombre del archivo (ej: Plantilla Excel)'}
                value={newRecurso.nombre}
                onChange={e => setNewRecurso({ ...newRecurso, nombre: e.target.value })}
              />

              {recursoMode === 'enlace' ? (
                <Box>
                  <CustomTextField
                    fullWidth
                    size='small'
                    placeholder='https://drive.google.com/...'
                    value={newRecurso.url}
                    onChange={e => setNewRecurso({ ...newRecurso, url: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-link text-base text-textSecondary' />
                        </InputAdornment>
                      )
                    }}
                  />
                  {/* Preview del servicio detectado */}
                  {urlPreview && (
                    <Box
                      sx={{
                        mt: 1,
                        px: 1.5,
                        py: 0.75,
                        bgcolor: 'action.hover',
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <i className={`${urlPreview.icon} text-base text-primary`} />
                      <Typography variant='caption' fontWeight={600}>{urlPreview.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>· {urlPreview.domain}</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  onClick={() => setOpenMediaResources(true)}
                  sx={{
                    border: '1.5px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <i className='tabler-cloud-upload text-2xl text-textSecondary' />
                    <Typography variant='body2' color='text.secondary'>
                      Arrastra aquí o <span style={{ color: 'var(--mui-palette-primary-main)', fontWeight: 600 }}>selecciona archivo</span>
                    </Typography>
                    <Typography variant='caption' color='text.disabled'>PDF, Word, ZIP · máx. 50 MB</Typography>
                  </Box>
                </Box>
              )}

              <Button
                variant='contained'
                fullWidth
                onClick={handleAddRecurso}
                disabled={!newRecurso.nombre.trim() || !newRecurso.url}
                startIcon={<i className='tabler-plus text-base' />}
              >
                Añadir recurso
              </Button>
            </Stack>
          </Box>

          <MediaLibrary
            open={openMediaResources}
            onClose={() => setOpenMediaResources(false)}
            onSelect={(url: string, nombre?: string) => {
              const parts = url.split('/')
              const fileName = parts[parts.length - 1] || 'Recurso'
              const resourceName = newRecurso.nombre.trim() || nombre || fileName.split('.')[0] || 'Recurso'

              setRecursos(prev => [...prev, { nombre: resourceName, url, tipo: 'archivo' }])
              setNewRecurso({ nombre: '', url: '', tipo: 'archivo' })
              setOpenMediaResources(false)
            }}
            title='Seleccionar Recurso'
            acceptType='OTRO'
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button variant='contained' onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}
