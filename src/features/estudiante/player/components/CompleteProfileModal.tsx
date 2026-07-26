'use client'

import { useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  MenuItem,
  Typography,
  Alert
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { Formik, type FormikHelpers } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import axios from 'axios'
import { useSnackbar } from 'notistack'
import { MuiTelInput } from 'mui-tel-input'

import CustomTextField from '@core/components/mui/TextField'

interface CompleteProfileModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  requireDocument?: boolean
  requireCelular?: boolean
}

const createProfileSchema = (requireDocument: boolean, requireCelular: boolean) => z.object({
  tipo_documento: z.enum(['DNI', 'CE', 'PASAPORTE', 'OTRO']),
  numero_documento: requireDocument 
    ? z.string().trim().min(1, 'El número de documento es obligatorio')
    : z.string().trim().optional().or(z.literal('')),
  celular: requireCelular
    ? z.string().trim().min(1, 'El celular es obligatorio').regex(/^\+?[\d\s-]{9,20}$/, 'Formato de celular inválido (puede incluir +)')
    : z.string().trim().optional().or(z.literal(''))
}).superRefine((data, ctx) => {
  if (data.tipo_documento === 'DNI' && data.numero_documento) {
    if (!/^\d{8}$/.test(data.numero_documento)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El DNI debe tener exactamente 8 dígitos',
        path: ['numero_documento']
      })
    }
  }
})

type ProfileForm = z.infer<ReturnType<typeof createProfileSchema>>

export default function CompleteProfileModal({ 
  open, 
  onClose, 
  onSuccess,
  requireDocument = true,
  requireCelular = true
}: CompleteProfileModalProps) {
  const { data: session, update } = useSession()
  const { enqueueSnackbar } = useSnackbar()
  const [error, setError] = useState('')

  const schema = createProfileSchema(requireDocument, requireCelular)

  const initialValues: ProfileForm = {
    tipo_documento: (session?.user?.tipo_documento as ProfileForm['tipo_documento']) || 'DNI',
    numero_documento: session?.user?.numero_documento || '',
    celular: session?.user?.celular || ''
  }

  const handleSubmit = async (values: ProfileForm, { setSubmitting }: FormikHelpers<ProfileForm>) => {
    setError('')

    try {
      const response = await axios.put('/api/perfil', {
        nombre: session?.user?.name?.split(' ')[0] || 'Usuario', // Required fields for API
        apellido: session?.user?.name?.split(' ').slice(1).join(' ') || 'Apellidos',
        tipo_documento: values.tipo_documento,
        numero_documento: values.numero_documento,
        celular: values.celular
      })

      if (response.data.status) {
        await update() // Refresh next-auth session
        enqueueSnackbar('Perfil actualizado con éxito', { variant: 'success' })
        onSuccess()
      } else {
        setError(response.data.message || 'Ocurrió un error al actualizar el perfil')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al conectar con el servidor')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => {}} maxWidth='sm' fullWidth disableEscapeKeyDown>
      <DialogTitle>Completa tu perfil para continuar</DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(schema)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
          <form onSubmit={handleSubmit} noValidate>
            <DialogContent>
              <Typography variant='body2' sx={{ mb: 4 }}>
                {requireDocument && requireCelular && 'Antes de continuar, por favor completa tu número de documento y celular. Esta información es requerida para la emisión de tus certificados.'}
                {requireDocument && !requireCelular && 'Antes de continuar, por favor completa tu número de documento. Esta información es requerida para procesar tu solicitud.'}
                {!requireDocument && requireCelular && 'Antes de iniciar tu evaluación, por favor completa tu celular.'}
              </Typography>
              
              {error && (
                <Alert severity='error' sx={{ mb: 4 }}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={4}>
                {requireDocument && (
                  <>
                    <Grid item xs={12} sm={requireCelular ? 3 : 4}>
                      <CustomTextField
                        select
                        fullWidth
                        label='Tipo de Doc.'
                        name='tipo_documento'
                        value={values.tipo_documento}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.tipo_documento && Boolean(errors.tipo_documento)}
                        helperText={touched.tipo_documento && (errors.tipo_documento as string)}
                        disabled={isSubmitting}
                      >
                        <MenuItem value="DNI">DNI</MenuItem>
                        <MenuItem value="OTRO">Otro</MenuItem>
                      </CustomTextField>
                    </Grid>

                    <Grid item xs={12} sm={requireCelular ? 5 : 8}>
                      <CustomTextField
                        fullWidth
                        label='N° Documento'
                        name='numero_documento'
                        value={values.numero_documento}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.numero_documento && Boolean(errors.numero_documento)}
                        helperText={touched.numero_documento && errors.numero_documento}
                        disabled={isSubmitting}
                      />
                    </Grid>
                  </>
                )}

                {requireCelular && (
                  <Grid item xs={12} sm={requireDocument ? 4 : 12}>
                    <MuiTelInput
                      fullWidth
                      label='Celular'
                      name='celular'
                      defaultCountry="PE"
                      preferredCountries={['PE', 'CO', 'MX', 'CL', 'AR']}
                      value={values.celular}
                      onChange={(value) => {
                        setFieldValue('celular', value)
                      }}
                      onBlur={handleBlur}
                      error={touched.celular && Boolean(errors.celular)}
                      helperText={touched.celular && errors.celular}
                      disabled={isSubmitting}
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color='secondary' disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type='submit' variant='contained' disabled={isSubmitting}>
                Guardar y Continuar
              </Button>
            </DialogActions>
          </form>
        )}
      </Formik>
    </Dialog>
  )
}
