'use client'

import { useState } from 'react'

import {
  Box,
  Button,
  Grid,
  MenuItem,
  styled,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Avatar,
  Divider,
  Stack
} from '@mui/material'
import { Formik, type FormikHelpers } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { useSnackbar } from 'notistack'
import { Rol, TipoDocumento } from '@prisma/client'

import { MuiTelInput } from 'mui-tel-input'

import AppModal from '@/utils/components/AppModal'
import CustomTextField from '@core/components/mui/TextField'
import { actualizarUsuarioSchema, type ActualizarUsuarioDto } from '@/schemas/usuario.schema'
import MediaLibrary from '../../cursos/components/MediaLibrary'
import ProfesorBioEditor from '@/features/perfil/components/ProfesorBioEditor'

import { useUsuario, useEditUsuario } from '../hooks/useUsuarios'
import SignatureUpload from './SignatureUpload'

type EditUsuarioModalProps = {
  open: boolean
  handleClose: () => void
  usuarioId: string | null
  onSuccess?: () => void
}

const FormWrapper = styled(Box)(() => ({
  padding: '16px 0'
}))

const EditUsuarioModal = ({ open, handleClose, usuarioId, onSuccess }: EditUsuarioModalProps) => {
  const { enqueueSnackbar } = useSnackbar()
  const { data: usuario, isLoading } = useUsuario(usuarioId || '')
  const editUsuarioMutation = useEditUsuario()
  const [showPassword, setShowPassword] = useState(false)
  const [openAvatarMedia, setOpenAvatarMedia] = useState(false)

  const handleSubmit = async (values: ActualizarUsuarioDto, { setSubmitting }: FormikHelpers<ActualizarUsuarioDto>) => {
    if (!usuarioId) return

    try {
      const dataToSend = { ...values }

      if (!dataToSend.contrasena) {
        delete dataToSend.contrasena
      }

      await editUsuarioMutation.mutateAsync({ id: usuarioId, data: dataToSend })

      enqueueSnackbar('Usuario actualizado exitosamente', { variant: 'success' })
      handleClose()
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || 'Error al actualizar usuario'

      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AppModal open={open} handleClose={handleClose}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
          <CircularProgress />
          <Typography>Cargando usuario...</Typography>
        </Box>
      </AppModal>
    )
  }

  if (!usuario) return null

  const initialValues: ActualizarUsuarioDto = {
    correo: usuario.correo,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    numero_documento: usuario.numero_documento || '',
    celular: usuario.celular || '',
    biografia: usuario.biografia || '',
    rol: usuario.rol,
    esta_activo: usuario.esta_activo,
    contrasena: '',
    cargo: usuario.cargo || '',
    firma: usuario.firma || '',
    tipo_documento: usuario.tipo_documento || TipoDocumento.DNI,
    avatar: usuario.avatar || ''
  }

  const getInitials = (nombre: string, apellido: string) =>
    `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()

  return (
    <AppModal
      open={open}
      handleClose={handleClose}
      sx={{ display: 'flex', flexDirection: 'column', p: '0 !important', overflow: 'hidden' }}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(actualizarUsuarioSchema)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue, setFieldTouched }) => (
          <>
            {/* ── Área scrollable ── */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 3, sm: 5 }, pt: { xs: 3, sm: 5 }, pb: 2 }}>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant='h4' sx={{ mb: 0.5, fontWeight: 600 }}>Editar Usuario</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Actualiza la información del perfil y los permisos del usuario.
                </Typography>
              </Box>

              <form id='edit-usuario-form' onSubmit={handleSubmit}>
                <FormWrapper>
                  <Grid container spacing={3}>

                    {/* ── Foto de Perfil ── */}
                    <Grid item xs={12}>
                      <Typography variant='overline' color='text.disabled' sx={{ mb: 2, display: 'block' }}>
                        Foto de Perfil
                      </Typography>
                      <Stack direction='row' alignItems='center' spacing={3}>
                        <Avatar
                          src={values.avatar || undefined}
                          sx={{ width: 80, height: 80, fontSize: '1.5rem', bgcolor: 'primary.main' }}
                        >
                          {!values.avatar && getInitials(values.nombre || 'U', values.apellido || 'U')}
                        </Avatar>
                        <Stack spacing={1}>
                          <Stack direction='row' spacing={1}>
                            <Button
                              variant='outlined'
                              size='small'
                              startIcon={<i className='tabler-camera text-base' />}
                              onClick={() => setOpenAvatarMedia(true)}
                              disabled={isSubmitting}
                            >
                              {values.avatar ? 'Cambiar foto' : 'Subir foto'}
                            </Button>
                            {values.avatar && (
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => setFieldValue('avatar', '')}
                                disabled={isSubmitting}
                                title='Eliminar foto'
                              >
                                <i className='tabler-trash text-base' />
                              </IconButton>
                            )}
                          </Stack>
                          <Typography variant='caption' color='text.secondary'>
                            JPG, PNG o WEBP · recomendado 400×400px
                          </Typography>
                        </Stack>
                      </Stack>

                      <MediaLibrary
                        open={openAvatarMedia}
                        onClose={() => setOpenAvatarMedia(false)}
                        onSelect={(url) => { setFieldValue('avatar', url); setOpenAvatarMedia(false) }}
                        title='Seleccionar Foto de Perfil'
                        acceptType='IMAGEN'
                      />
                    </Grid>

                    <Grid item xs={12}><Divider /></Grid>

                    {/* ── Información Personal ── */}
                    <Grid item xs={12}>
                      <Typography variant='overline' color='text.disabled' sx={{ mb: 1, display: 'block' }}>
                        Información Personal
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        fullWidth
                        label='Nombre'
                        name='nombre'
                        value={values.nombre}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.nombre && Boolean(errors.nombre)}
                        helperText={touched.nombre && errors.nombre}
                        disabled={isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <i className='tabler-user text-xl text-textSecondary' />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        fullWidth
                        label='Apellido'
                        name='apellido'
                        value={values.apellido}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.apellido && Boolean(errors.apellido)}
                        helperText={touched.apellido && errors.apellido}
                        disabled={isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <i className='tabler-user text-xl text-textSecondary' />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        fullWidth
                        label='Correo Electrónico'
                        name='correo'
                        type='email'
                        value={values.correo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.correo && Boolean(errors.correo)}
                        helperText={touched.correo && errors.correo}
                        disabled={isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <i className='tabler-mail text-xl text-textSecondary' />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <CustomTextField
                        select
                        fullWidth
                        label='Tipo de Doc.'
                        name='tipo_documento'
                        value={values.tipo_documento}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.tipo_documento && Boolean((errors as any).tipo_documento)}
                        helperText={touched.tipo_documento && (errors as any).tipo_documento as string}
                        disabled={isSubmitting}
                      >
                        <MenuItem value="DNI">DNI</MenuItem>
                        <MenuItem value="OTRO">Otro</MenuItem>
                      </CustomTextField>
                    </Grid>

                    <Grid item xs={12} sm={5}>
                      <CustomTextField
                        fullWidth
                        label={values.tipo_documento === 'OTRO' ? 'Documento' : 'DNI (opcional)'}
                        name='numero_documento'
                        placeholder={values.tipo_documento === 'OTRO' ? 'Ej. AB12345' : '12345678'}
                        value={values.numero_documento}
                        onChange={(e) => {
                          if (values.tipo_documento === 'DNI') {
                            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 8)
                          } else {
                            e.target.value = e.target.value.substring(0, 20)
                          }

                          handleChange(e)
                        }}
                        onBlur={handleBlur}
                        error={touched.numero_documento && Boolean(errors.numero_documento)}
                        helperText={touched.numero_documento && errors.numero_documento}
                        disabled={isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <i className='tabler-id text-xl text-textSecondary' />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <MuiTelInput
                        fullWidth
                        label='Celular (Opcional)'
                        name='celular'
                        defaultCountry='PE'
                        forceCallingCode
                        value={values.celular}
                        onChange={(newValue) => setFieldValue('celular', newValue)}
                        onBlur={() => setFieldTouched('celular', true)}
                        error={touched.celular && Boolean(errors.celular)}
                        helperText={touched.celular && (errors.celular as string)}
                        disabled={isSubmitting}
                      />
                    </Grid>

                    {/* Biografía — simple para ESTUDIANTE */}
                    {values.rol === Rol.ESTUDIANTE && (
                      <Grid item xs={12}>
                        <CustomTextField
                          fullWidth
                          multiline
                          rows={3}
                          label='Descripción / Biografía'
                          name='biografia'
                          placeholder='Describe brevemente al usuario...'
                          value={values.biografia}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.biografia && Boolean(errors.biografia)}
                          helperText={touched.biografia && errors.biografia}
                          disabled={isSubmitting}
                        />
                      </Grid>
                    )}

                    {/* ── Perfil Docente (solo PROFESOR / ADMIN) ── */}
                    {(values.rol === Rol.ADMIN || values.rol === Rol.PROFESOR) && (
                      <>
                        <Grid item xs={12}><Divider /></Grid>

                        <Grid item xs={12}>
                          <Typography variant='overline' color='text.disabled' sx={{ mb: 2, display: 'block' }}>
                            Perfil Profesional
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
                            Esta información se mostrará públicamente en la página de docente.
                          </Typography>
                          <ProfesorBioEditor
                            value={values.biografia}
                            onChange={(html) => setFieldValue('biografia', html)}
                            rol={values.rol}
                          />
                        </Grid>

                        <Grid item xs={12} sm={12}>
                          <CustomTextField
                            fullWidth
                            label='Cargo en empresa (se muestra en el certificado)'
                            name='cargo'
                            placeholder='Ej: Instructor Senior · Seguridad Industrial'
                            value={values.cargo}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.cargo && Boolean(errors.cargo)}
                            helperText={touched.cargo && errors.cargo}
                            disabled={isSubmitting}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position='start'>
                                  <i className='tabler-user-cog text-xl text-textSecondary' />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant='overline' color='text.disabled' sx={{ mb: 2, display: 'block' }}>
                            Firma Digital
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
                            Utilizada para firmar los certificados de los cursos que dicta. (Imagen PNG con tamaño 500px x 350px)
                          </Typography>
                          <SignatureUpload
                            value={values.firma || ''}
                            onChange={(url) => setFieldValue('firma', url)}
                            disabled={isSubmitting}
                          />
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12}><Divider /></Grid>

                    {/* ── Seguridad y Permisos ── */}
                    <Grid item xs={12}>
                      <Typography variant='overline' color='text.disabled' sx={{ mb: 1, display: 'block' }}>
                        Seguridad y Permisos
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        select
                        fullWidth
                        label='Rol de Usuario'
                        name='rol'
                        value={values.rol}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.rol && Boolean(errors.rol)}
                        helperText={touched.rol && errors.rol}
                        disabled={isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <i className='tabler-shield-lock text-xl text-textSecondary mr-2' />
                            </InputAdornment>
                          )
                        }}
                      >
                        <MenuItem value={Rol.ESTUDIANTE}>Estudiante</MenuItem>
                        <MenuItem value={Rol.PROFESOR}>Profesor</MenuItem>
                        <MenuItem value={Rol.ADMIN}>Administrador</MenuItem>
                      </CustomTextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        fullWidth
                        label='Nueva Contraseña (Opcional)'
                        name='contrasena'
                        type={showPassword ? 'text' : 'password'}
                        value={values.contrasena}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.contrasena && Boolean(errors.contrasena)}
                        helperText={touched.contrasena && errors.contrasena}
                        disabled={isSubmitting}
                        placeholder='Dejar en blanco para mantener la actual'
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <i className='tabler-lock text-xl text-textSecondary' />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton
                                edge='end'
                                onClick={() => setShowPassword(!showPassword)}
                                onMouseDown={e => e.preventDefault()}
                                aria-label='toggle password visibility'
                              >
                                <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                </FormWrapper>
              </form>
            </Box>

            {/* ── Footer fijo ── */}
            <Box sx={{
              px: { xs: 3, sm: 5 },
              py: 2,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}>
              <Button
                variant='tonal'
                color='secondary'
                onClick={handleClose}
                disabled={isSubmitting}
                sx={{ px: 4 }}
              >
                Cancelar
              </Button>
              <Button
                variant='contained'
                type='submit'
                form='edit-usuario-form'
                disabled={isSubmitting}
                sx={{ px: 4 }}
                startIcon={<i className='tabler-check' />}
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Usuario'}
              </Button>
            </Box>
          </>
        )}
      </Formik>
    </AppModal>
  )
}

export default EditUsuarioModal
