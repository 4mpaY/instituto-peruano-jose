'use client'

import { useState } from 'react'

import { Box, Button, Grid, MenuItem, styled, Typography, InputAdornment, IconButton } from '@mui/material'
import { Formik, type FormikHelpers } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { useSnackbar } from 'notistack'

import { Rol } from '@prisma/client'



import AppModal from '@/utils/components/AppModal'
import CustomTextField from '@core/components/mui/TextField'
import { crearUsuarioSchema, type CrearUsuarioDto } from '@/schemas/usuario.schema'

import { useCreateUsuario } from '../hooks/useUsuarios'
import SignatureUpload from './SignatureUpload'

type CreateUsuarioModalProps = {
  open: boolean
  handleClose: () => void
  onSuccess?: () => void
}

const FormWrapper = styled(Box)(() => ({
  padding: '16px 0'
}))

const CreateUsuarioModal = ({ open, handleClose, onSuccess }: CreateUsuarioModalProps) => {
  const { enqueueSnackbar } = useSnackbar()
  const createUsuarioMutation = useCreateUsuario()
  const [showPassword, setShowPassword] = useState(false)

  const initialValues: CrearUsuarioDto = {
    correo: '',
    contrasena: '',
    nombre: '',
    apellido: '',
    numero_documento: '',
    celular: '',
    biografia: '',
    rol: Rol.ESTUDIANTE,
    esta_activo: true,
    cargo: '',
    firma: ''
  }

  const handleSubmit = async (values: CrearUsuarioDto, { setSubmitting, resetForm }: FormikHelpers<CrearUsuarioDto>) => {
    try {
      await createUsuarioMutation.mutateAsync(values)

      enqueueSnackbar('Usuario creado exitosamente', { variant: 'success' })
      resetForm()
      setShowPassword(false)
      handleClose()
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || 'Error al crear usuario'

      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppModal open={open} handleClose={handleClose}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant='h4' sx={{ mb: 1, fontWeight: 600 }}>
          Nuevo Usuario
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Completa la información para registrar un nuevo usuario en el sistema.
        </Typography>
      </Box>

      <Formik
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(crearUsuarioSchema)}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
          <form onSubmit={handleSubmit}>
            <FormWrapper>
              <Grid container spacing={3}>
                {/* Sección: Datos Personales */}
                <Grid item xs={12}>
                  <Typography variant='overline' color='text.disabled' sx={{ mb: 1, display: 'block' }}>
                    Datos Personales
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    fullWidth
                    label='Nombres'
                    name='nombre'
                    placeholder='Ej: Juan'
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
                    label='Apellidos'
                    name='apellido'
                    placeholder='Ej: Pérez'
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
                    label='DNI / Documento'
                    name='numero_documento'
                    placeholder='12345678'
                    value={values.numero_documento}
                    onChange={handleChange}
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

                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    fullWidth
                    label='Biografía (Opcional)'
                    name='biografia'
                    placeholder='Breve descripción...'
                    value={values.biografia}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.biografia && Boolean(errors.biografia)}
                    helperText={touched.biografia && errors.biografia}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-file-description text-xl text-textSecondary' />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                {(values.rol === Rol.ADMIN || values.rol === Rol.PROFESOR) && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <CustomTextField
                        fullWidth
                        label='Cargo'
                        name='cargo'
                        placeholder='Ej: Gerente General / Instructor'
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
                      <Typography variant='subtitle2' sx={{ mb: 2 }}>Firma Digital (Imagen)</Typography>
                      <SignatureUpload
                        value={values.firma || ''}
                        onChange={(url) => setFieldValue('firma', url)}
                        disabled={isSubmitting}
                      />
                    </Grid>
                  </>
                )}

                {/* Sección: Contacto y Cuenta */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant='overline' color='text.disabled' sx={{ mb: 1, display: 'block' }}>
                    Contacto y Cuenta
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    fullWidth
                    label='Correo Electrónico'
                    name='correo'
                    type='email'
                    placeholder='usuario@ejemplo.com'
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

                <Grid item xs={12} sm={6}>
                  <CustomTextField
                    fullWidth
                    label='Celular'
                    name='celular'
                    placeholder='987654321'
                    value={values.celular}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.celular && Boolean(errors.celular)}
                    helperText={touched.celular && errors.celular}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='tabler-phone text-xl text-textSecondary' />
                        </InputAdornment>
                      )
                    }}
                  />
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
                    label='Contraseña'
                    name='contrasena'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='********'
                    value={values.contrasena}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.contrasena && Boolean(errors.contrasena)}
                    helperText={touched.contrasena && errors.contrasena}
                    disabled={isSubmitting}
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

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 5 }}>
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
                  disabled={isSubmitting}
                  sx={{ px: 4 }}
                  startIcon={<i className='tabler-user-plus' />}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </Box>
            </FormWrapper>
          </form>
        )}
      </Formik>
    </AppModal>
  )
}

export default CreateUsuarioModal
