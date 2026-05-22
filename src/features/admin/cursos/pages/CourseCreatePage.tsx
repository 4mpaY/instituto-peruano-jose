'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

import {
  Box,
  Button,
  Grid,
  Typography,
  InputAdornment,
  MenuItem,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Tab,
  Divider,
  FormControlLabel,
  Switch,
  IconButton
} from '@mui/material'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { Formik, type FormikHelpers } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { useSnackbar } from 'notistack'

import CustomTextField from '@core/components/mui/TextField'

import { crearCursoSchema, type CrearCursoDto } from '@/schemas/curso.schema'
import { sanitizeDatetimeInput } from '@/utils/functions/sanitizeDatetime'
import MediaLibrary from '../components/MediaLibrary'

import { useCreateCurso } from '../hooks/useCursos'
import { useCategorias } from '@/features/admin/categorias/hooks/useCategorias'

interface CourseCreatePageProps {
  profesores: { id: string; nombre: string; apellido: string }[]
}

export const CourseCreatePage = ({ profesores }: CourseCreatePageProps) => {
  const { data: session } = useSession()
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const createMutation = useCreateCurso()
  const { data: categoriasRes } = useCategorias()
  const categorias = categoriasRes?.categorias || []
  const [activeTab, setActiveTab] = useState('1')
  const [openMedia, setOpenMedia] = useState(false)
  const [openBrochure, setOpenBrochure] = useState(false)

  const initialValues: CrearCursoDto = {
    titulo: '',
    descripcion: '',
    categoria_id: null,
    profesor_id: profesores.length > 0 ? profesores[0].id : '',
    tipo_emision: 'ASINCRONO',
    es_gratis: false,
    precio: 0,
    precio_falso: 0,
    moneda: 'PEN',
    nivel: 'BASICO',
    duracion: '',
    miniatura: null,
    video_presentacion: null,
    brochure: null,
    fecha_inicio: null
  }

  const handleSubmit = async (values: CrearCursoDto, { setSubmitting }: FormikHelpers<CrearCursoDto>) => {
    try {
      const payload = {
        ...values,
        fecha_inicio: sanitizeDatetimeInput(values.fecha_inicio)
      }

      const result = await createMutation.mutateAsync(payload)

      enqueueSnackbar('Curso creado exitosamente', { variant: 'success' })

      const redirectBase = session?.user?.rol === 'ADMIN' ? '/admin/cursos' : '/profesor/mis-cursos'

      if (result?.curso?.id) {
        router.push(`${redirectBase}/${result.curso.id}`)
      } else {
        router.push(redirectBase)
      }
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al crear curso', { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant='h4' fontWeight={600}>
            Nuevo Curso
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Configura los detalles de tu nuevo programa educativo
          </Typography>
        </Box>
        <Button
          variant='outlined'
          onClick={() => router.push(session?.user?.rol === 'ADMIN' ? '/admin/cursos' : '/profesor/mis-cursos')}
          startIcon={<i className='tabler-arrow-left' />}
        >
          Cancelar y Volver
        </Button>
      </Box>

      <Formik
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(crearCursoSchema)}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: handleFormikSubmit, isSubmitting, setFieldValue }) => (
          <form onSubmit={handleFormikSubmit}>
            <TabContext value={activeTab}>
              <Card>
                <TabList onChange={(_, val) => setActiveTab(val)} variant='scrollable' sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tab icon={<i className='tabler-info-circle' />} iconPosition='start' label='Información' value='1' />
                  <Tab icon={<i className='tabler-settings' />} iconPosition='start' label='Configuración' value='2' />
                  <Tab icon={<i className='tabler-photo' />} iconPosition='start' label='Media' value='3' />
                </TabList>

                <CardContent sx={{ p: 6 }}>
                  <TabPanel value='1' sx={{ p: 0 }}>
                    <Grid container spacing={5}>
                      <Grid item xs={12}>
                        <CustomTextField
                          fullWidth
                          label='Título del Curso *'
                          name='titulo'
                          placeholder='Ej: Especialización en Gestión Ambiental'
                          value={values.titulo}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.titulo && Boolean(errors.titulo)}
                          helperText={touched.titulo && errors.titulo}
                          disabled={isSubmitting}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position='start'>
                                <i className='tabler-book text-xl text-textSecondary' />
                              </InputAdornment>
                            )
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
                          placeholder='Describe los objetivos y alcance del curso...'
                          value={values.descripcion}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={isSubmitting}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <CustomTextField
                          select
                          fullWidth
                          label='Categoría'
                          name='categoria_id'
                          value={values.categoria_id || ''}
                          onChange={handleChange}
                          disabled={isSubmitting}
                        >
                          <MenuItem value=''>Sin categoría</MenuItem>
                          {categorias.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>
                              {cat.nombre}
                            </MenuItem>
                          ))}
                        </CustomTextField>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <CustomTextField
                          select
                          fullWidth
                          label='Profesor Asignado *'
                          name='profesor_id'
                          value={values.profesor_id}
                          onChange={handleChange}
                          error={touched.profesor_id && Boolean(errors.profesor_id)}
                          helperText={touched.profesor_id && errors.profesor_id}
                          disabled={isSubmitting}
                        >
                          {profesores.map(prof => (
                            <MenuItem key={prof.id} value={prof.id}>
                              {prof.nombre} {prof.apellido}
                            </MenuItem>
                          ))}
                        </CustomTextField>
                      </Grid>

                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                          <Typography variant='body2' color='text.secondary'>
                            Modalidad de impartición:
                          </Typography>
                          <Stack direction='row' spacing={2}>
                            <Button
                              variant={values.tipo_emision === 'ASINCRONO' ? 'contained' : 'outlined'}
                              size='small'
                              onClick={() => setFieldValue('tipo_emision', 'ASINCRONO')}
                              startIcon={<i className='tabler-player-play' />}
                            >
                              Asíncrono
                            </Button>
                            <Button
                              variant={values.tipo_emision === 'SINCRONO' ? 'contained' : 'outlined'}
                              size='small'
                              onClick={() => setFieldValue('tipo_emision', 'SINCRONO')}
                              startIcon={<i className='tabler-live-photo' />}
                            >
                              Síncrono
                            </Button>
                            <Button
                              variant={values.tipo_emision === 'MIXTO' ? 'contained' : 'outlined'}
                              size='small'
                              onClick={() => setFieldValue('tipo_emision', 'MIXTO')}
                              startIcon={<i className='tabler-arrows-split' />}
                            >
                              Mixto
                            </Button>
                          </Stack>
                        </Box>
                      </Grid>

                      {(values.tipo_emision === 'SINCRONO' || values.tipo_emision === 'MIXTO') && (
                        <Grid item xs={12} sm={6}>
                          <CustomTextField
                            fullWidth
                            type='date'
                            label='Fecha de Inicio'
                            name='fecha_inicio'
                            value={values.fecha_inicio || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={isSubmitting}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position='start'>
                                  <i className='tabler-calendar text-xl text-textSecondary' />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </TabPanel>

                  <TabPanel value='2' sx={{ p: 0 }}>
                    <Grid container spacing={5}>
                      <Grid item xs={12}>
                        <Typography variant='h6' sx={{ mb: 2 }}>Precio</Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={values.es_gratis}
                              onChange={e => {
                                setFieldValue('es_gratis', e.target.checked)

                                if (e.target.checked) {
                                  setFieldValue('precio', 0)
                                  setFieldValue('precio_falso', 0)
                                }
                              }}
                            />
                          }
                          label='Este curso es gratis'
                        />
                        {!values.es_gratis && (
                          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <CustomTextField
                              type='number'
                              label='Precio'
                              name='precio'
                              value={values.precio}
                              onChange={handleChange}
                              sx={{ width: 200 }}
                            />
                            <CustomTextField
                              type='number'
                              label='Precio Falso'
                              name='precio_falso'
                              value={values.precio_falso}
                              onChange={handleChange}
                              sx={{ width: 200 }}
                            />
                            <CustomTextField
                              select
                              label='Moneda'
                              name='moneda'
                              value={values.moneda}
                              onChange={handleChange}
                              sx={{ width: 120 }}
                            >
                              <MenuItem value='PEN'>PEN (S/)</MenuItem>
                              <MenuItem value='USD'>USD ($)</MenuItem>
                            </CustomTextField>
                          </Box>
                        )}
                      </Grid>

                      <Grid item xs={12}><Divider /></Grid>

                      <Grid item xs={12}>
                        <CustomTextField
                          fullWidth
                          label='Duración Sugerida'
                          name='duracion'
                          placeholder='Ej: 40 horas académicas'
                          value={values.duracion || ''}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position='start'>
                                <i className='tabler-clock text-xl text-textSecondary' />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
                  </TabPanel>

                  <TabPanel value='3' sx={{ p: 0 }}>
                    <Grid container spacing={5}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant='subtitle2' sx={{ mb: 2 }}>Imagen de Portada</Typography>
                        {values.miniatura ? (
                          <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, borderRadius: 2, overflow: 'hidden', mb: 3, bgcolor: '#f4f4f4', border: '1px solid', borderColor: 'divider' }}>
                            <img
                              src={values.miniatura}
                              alt='Vista previa'
                              style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block', maxHeight: 280 }}
                            />
                            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                              <IconButton
                                size='small'
                                sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
                                onClick={() => setFieldValue('miniatura', '')}
                              >
                                <i className='tabler-trash text-error' />
                              </IconButton>
                            </Box>
                          </Box>
                        ) : (
                          <Box
                            onClick={() => setOpenMedia(true)}
                            sx={{
                              width: '100%',
                              maxWidth: 400,
                              height: 200,
                              borderRadius: 2,
                              border: '2px dashed',
                              borderColor: 'divider',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              bgcolor: 'action.hover',
                              mb: 3,
                              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lightOpacity' }
                            }}
                          >
                            <i className='tabler-photo-plus text-4xl text-textDisabled' />
                            <Typography color='text.secondary' sx={{ mt: 2 }}>Click para seleccionar imagen</Typography>
                          </Box>
                        )}

                        <Button
                          variant='outlined'
                          size='small'
                          startIcon={<i className='tabler-photo' />}
                          onClick={() => setOpenMedia(true)}
                        >
                          {values.miniatura ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                        </Button>

                        <MediaLibrary
                          open={openMedia}
                          onClose={() => setOpenMedia(false)}
                          onSelect={(url) => setFieldValue('miniatura', url)}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant='subtitle2' sx={{ mb: 2 }}>Brochure del Curso (PDF)</Typography>
                        {values.brochure ? (
                          <Box sx={{ p: 4, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <i className='tabler-file-type-pdf text-4xl text-error' />
                              <Box>
                                <Typography variant='body2' fontWeight={600}>Archivo PDF adjunto</Typography>
                                <Typography variant='caption' color='text.secondary'>El brochure ha sido seleccionado correctamente</Typography>
                              </Box>
                            </Box>
                            <IconButton
                              size='small'
                              sx={{ bgcolor: 'action.hover' }}
                              onClick={() => setFieldValue('brochure', null)}
                            >
                              <i className='tabler-trash text-error' />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box
                            onClick={() => setOpenBrochure(true)}
                            sx={{
                              width: '100%',
                              height: 200,
                              borderRadius: 2,
                              border: '2px dashed',
                              borderColor: 'divider',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              bgcolor: 'action.hover',
                              mb: 3,
                              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lightOpacity' }
                            }}
                          >
                            <i className='tabler-file-plus text-3xl text-textDisabled' />
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>Click para seleccionar brochure (PDF)</Typography>
                          </Box>
                        )}

                        <Button
                          variant='outlined'
                          size='small'
                          startIcon={<i className='tabler-file-text' />}
                          onClick={() => setOpenBrochure(true)}
                        >
                          {values.brochure ? 'Cambiar Brochure' : 'Seleccionar Brochure'}
                        </Button>

                        <MediaLibrary
                          open={openBrochure}
                          onClose={() => setOpenBrochure(false)}
                          onSelect={(url) => setFieldValue('brochure', url)}
                          title="Seleccionar Brochure PDF"
                          acceptType="OTRO"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <CustomTextField
                          fullWidth
                          label='Enlace de Video Introductorio (YouTube o Vimeo)'
                          name='video_presentacion'
                          placeholder='Ej: https://youtube.com/watch?v=... o https://vimeo.com/...'
                          value={values.video_presentacion || ''}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position='start'>
                                <i className='tabler-video text-xl text-textSecondary' />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Box sx={{ p: 4, borderRadius: 2, bgcolor: 'primary.lightOpacity', border: '1px dashed', borderColor: 'primary.main', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <i className='tabler-info-circle text-3xl text-primary' />
                          <Typography variant='body2' color='primary.dark'>
                            El curso se creará en estado <strong>Borrador</strong>. Podrás añadir módulos y lecciones en la siguiente pantalla.
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 8 }}>
                    <Button
                      variant='contained'
                      color='primary'
                      type='submit'
                      size='large'
                      disabled={isSubmitting || !values.titulo.trim() || !values.profesor_id}
                      startIcon={isSubmitting ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-device-floppy' />}
                    >
                      {isSubmitting ? 'Creando...' : 'Finalizar y Crear Curso'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </TabContext>
          </form>
        )}
      </Formik>
    </Box>
  )
}


