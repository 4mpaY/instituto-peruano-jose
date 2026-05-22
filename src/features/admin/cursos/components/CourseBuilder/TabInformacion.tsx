'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'

import {
  Grid,
  InputAdornment,
  MenuItem,
  Typography,
  Box,
  Button,
  IconButton
} from '@mui/material'
import { useSnackbar } from 'notistack'

import CustomTextField from '@core/components/mui/TextField'
import MediaLibrary from '../MediaLibrary'
import { sanitizeDatetimeInput, toLocalDateInputValue } from '@/utils/functions/sanitizeDatetime'

import type { Curso } from '../../entity/Curso'
import { useEditCurso } from '../../hooks/useCursos'
import { useCategorias } from '@/features/admin/categorias/hooks/useCategorias'
import CourseThumbnail from '@/utils/components/CourseThumbnail'

interface TabInformacionProps {
  curso: Curso
  profesores: { id: string; nombre: string; apellido: string }[]
  onSuccess: () => void
}

export function TabInformacion({ curso, profesores, onSuccess }: TabInformacionProps) {
  const { enqueueSnackbar } = useSnackbar()
  const editMutation = useEditCurso()
  const { data: categoriasRes } = useCategorias()
  const categorias = categoriasRes?.categorias || []

  const [openMedia, setOpenMedia] = useState(false)
  const [openBrochure, setOpenBrochure] = useState(false)

  const [form, setForm] = useState({
    titulo: curso.titulo,
    descripcion: curso.descripcion || '',
    categoria_id: curso.categoria_id || '',
    profesor_id: curso.profesor_id,
    tipo_emision: curso.tipo_emision,
    duracion: curso.duracion || '',
    codigo: curso.codigo || '',
    miniatura: curso.miniatura || '',
    video_presentacion: curso.video_presentacion || '',
    brochure: curso.brochure || '',
    fecha_inicio: curso.fecha_inicio ? toLocalDateInputValue(curso.fecha_inicio) : '',
    fecha_fin: curso.fecha_fin ? toLocalDateInputValue(curso.fecha_fin) : '',
    nivel: curso.nivel || 'BASICO'
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    try {
      await editMutation.mutateAsync({
        id: curso.id,
        data: {
          titulo: form.titulo,
          descripcion: form.descripcion?.trim() || null,
          categoria_id: form.categoria_id || null,
          profesor_id: form.profesor_id,
          tipo_emision: form.tipo_emision as 'SINCRONO' | 'ASINCRONO' | 'MIXTO',
          duracion: form.duracion || null,
          codigo: form.codigo?.trim().toUpperCase() || null,
          miniatura: form.miniatura || null,
          video_presentacion: form.video_presentacion || null,
          brochure: form.brochure || null,
          fecha_inicio: form.fecha_inicio ? sanitizeDatetimeInput(form.fecha_inicio) : null,
          fecha_fin: form.fecha_fin ? sanitizeDatetimeInput(form.fecha_fin) : null,
          nivel: form.nivel as 'BASICO' | 'INTERMEDIO' | 'AVANZADO'
        }
      })
      enqueueSnackbar('Curso actualizado exitosamente', { variant: 'success' })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al actualizar', { variant: 'error' })
    }
  }

  return (
    <Grid container spacing={5}>
      <Grid item xs={12}>
        <CustomTextField
          fullWidth
          label='Título del Curso'
          name='titulo'
          value={form.titulo}
          onChange={handleChange}
          InputProps={{
            startAdornment: <InputAdornment position='start'><i className='tabler-book text-xl text-textSecondary' /></InputAdornment>
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <CustomTextField
          fullWidth
          multiline
          rows={4}
          label='Descripción'
          name='descripcion'
          value={form.descripcion}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <CustomTextField
          select
          fullWidth
          label='Categoría'
          name='categoria_id'
          value={form.categoria_id}
          onChange={handleChange}
        >
          <MenuItem value=''>Sin categoría</MenuItem>
          {categorias.map(cat => (
            <MenuItem key={cat.id} value={cat.id}>{cat.nombre}</MenuItem>
          ))}
        </CustomTextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <CustomTextField
          select
          fullWidth
          label='Profesor'
          name='profesor_id'
          value={form.profesor_id}
          onChange={handleChange}
        >
          {profesores.map(p => (
            <MenuItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</MenuItem>
          ))}
        </CustomTextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <CustomTextField
          select
          fullWidth
          label='Nivel del Curso'
          name='nivel'
          value={form.nivel}
          onChange={handleChange}
        >
          <MenuItem value='BASICO'>Básico</MenuItem>
          <MenuItem value='INTERMEDIO'>Intermedio</MenuItem>
          <MenuItem value='AVANZADO'>Avanzado</MenuItem>
        </CustomTextField>
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant='body2' color='text.secondary'>Tipo de emisión:</Typography>
          <Button
            variant={form.tipo_emision === 'ASINCRONO' ? 'contained' : 'outlined'}
            size='small'
            onClick={() => setForm(prev => ({ ...prev, tipo_emision: 'ASINCRONO' }))}
            startIcon={<i className='tabler-player-play' />}
          >
            Asíncrono
          </Button>
          <Button
            variant={form.tipo_emision === 'SINCRONO' ? 'contained' : 'outlined'}
            size='small'
            onClick={() => setForm(prev => ({ ...prev, tipo_emision: 'SINCRONO' }))}
            startIcon={<i className='tabler-live-photo' />}
          >
            Síncrono
          </Button>
          <Button
            variant={form.tipo_emision === 'MIXTO' ? 'contained' : 'outlined'}
            size='small'
            onClick={() => setForm(prev => ({ ...prev, tipo_emision: 'MIXTO' }))}
            startIcon={<i className='tabler-arrows-split' />}
          >
            Mixto
          </Button>
        </Box>
      </Grid>
      {(form.tipo_emision === 'SINCRONO' || form.tipo_emision === 'MIXTO') && (
        <>
          <Grid item xs={12} sm={6}>
            <CustomTextField
              fullWidth
              type='date'
              label='Fecha de Inicio'
              name='fecha_inicio'
              value={form.fecha_inicio}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <InputAdornment position='start'><i className='tabler-calendar text-xl text-textSecondary' /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomTextField
              fullWidth
              type='date'
              label='Fecha de Fin'
              name='fecha_fin'
              value={form.fecha_fin}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <InputAdornment position='start'><i className='tabler-calendar-event text-xl text-textSecondary' /></InputAdornment>
              }}
            />
          </Grid>
        </>
      )}
      <Grid item xs={12} sm={6}>
        <CustomTextField
          fullWidth
          label='Duración'
          name='duracion'
          placeholder='Ej: 12 horas'
          value={form.duracion}
          onChange={handleChange}
          InputProps={{
            startAdornment: <InputAdornment position='start'><i className='tabler-clock text-xl text-textSecondary' /></InputAdornment>
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <CustomTextField
          fullWidth
          label='Código del Curso'
          name='codigo'
          placeholder='Ej: MKTG01'
          value={form.codigo}
          onChange={handleChange}
          inputProps={{ maxLength: 20 }}
          helperText='Se usa en el código del certificado. Máx. 20 caracteres.'
          InputProps={{
            startAdornment: <InputAdornment position='start'><i className='tabler-certificate text-xl text-textSecondary' /></InputAdornment>
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>Imagen de Portada</Typography>
        {form.miniatura ? (
          <Box sx={{ position: 'relative', width: '100%', borderRadius: 2, overflow: 'hidden', mb: 2, bgcolor: '#f4f4f4', border: '1px solid', borderColor: 'divider', aspectRatio: '16/9' }}>
            <CourseThumbnail
              src={form.miniatura}
              title='Vista previa'
              variant='simple'
            />
            <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
              <IconButton
                size='small'
                sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
                onClick={() => setForm(prev => ({ ...prev, miniatura: '' }))}
              >
                <i className='tabler-trash text-error text-sm' />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Box
            onClick={() => setOpenMedia(true)}
            sx={{
              width: '100%',
              height: 120,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              bgcolor: 'action.hover',
              mb: 2,
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lightOpacity' }
            }}
          >
            <i className='tabler-photo-plus text-2xl text-textDisabled' />
            <Typography variant='caption' color='text.secondary' sx={{ mt: 1 }}>Click para seleccionar</Typography>
          </Box>
        )}

        <Button
          variant='outlined'
          size='small'
          fullWidth
          startIcon={<i className='tabler-photo' />}
          onClick={() => setOpenMedia(true)}
        >
          {form.miniatura ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
        </Button>

        <MediaLibrary
          open={openMedia}
          onClose={() => setOpenMedia(false)}
          onSelect={(url) => setForm(prev => ({ ...prev, miniatura: url }))}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>Brochure (PDF)</Typography>
        {form.brochure ? (
          <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <i className='tabler-file-type-pdf text-3xl text-error' />
              <Box>
                <Typography variant='body2' fontWeight={600}>Archivo PDF adjunto</Typography>
                <Typography variant='caption' color='text.secondary'>Click en Guardar para confirmar cambios</Typography>
              </Box>
            </Box>
            <IconButton
              size='small'
              sx={{ bgcolor: 'action.hover' }}
              onClick={() => setForm(prev => ({ ...prev, brochure: '' }))}
            >
              <i className='tabler-trash text-error text-sm' />
            </IconButton>
          </Box>
        ) : (
          <Box
            onClick={() => setOpenBrochure(true)}
            sx={{
              width: '100%',
              height: 120,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              bgcolor: 'action.hover',
              mb: 2,
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lightOpacity' }
            }}
          >
            <i className='tabler-file-plus text-2xl text-textDisabled' />
            <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5 }}>Seleccionar brochure PDF</Typography>
          </Box>
        )}

        <Button
          variant='outlined'
          size='small'
          fullWidth
          startIcon={<i className='tabler-file-text' />}
          onClick={() => setOpenBrochure(true)}
        >
          {form.brochure ? 'Cambiar Brochure' : 'Seleccionar Brochure'}
        </Button>

        <MediaLibrary
          open={openBrochure}
          onClose={() => setOpenBrochure(false)}
          onSelect={(url) => setForm(prev => ({ ...prev, brochure: url }))}
          title="Seleccionar Brochure PDF"
          acceptType="OTRO"
        />
      </Grid>
      <Grid item xs={12}>
        <CustomTextField
          fullWidth
          label='URL Video Presentación del Curso(YouTube o Vimeo)'
          name='video_presentacion'
          value={form.video_presentacion}
          onChange={handleChange}
          InputProps={{
            startAdornment: <InputAdornment position='start'><i className='tabler-video text-xl text-textSecondary' /></InputAdornment>
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={editMutation.isPending}
            startIcon={<i className='tabler-device-floppy' />}
          >
            {editMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  )
}
