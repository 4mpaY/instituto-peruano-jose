'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

import { signIn } from 'next-auth/react'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import GoogleButton from '@/features/shared/components/GoogleButton'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'

// Third-party Imports
import classnames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Type Imports
import type { SystemMode } from '@core/types'
import { registerSchema, type RegisterDto } from '@/schemas/auth.schema'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Config Imports

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import Logo from '@components/layout/shared/Logo'
import Link from '@components/Link'

// Styled Custom Components
const RegisterIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 600,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const Register = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginUrl, setLoginUrl] = useState('/login')

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  useEffect(() => {
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')

    if (callbackUrl) {
      setLoginUrl(`/login?callbackUrl=${callbackUrl}`)
    }
  }, [])

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
      nombre: '',
      apellido: '',
      numero_documento: '',
      celular: ''
    }
  })

  const onSubmit = async (data: RegisterDto) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Error al registrar usuario')

        return
      }

      setSuccess(true)

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const callbackUrl = urlParams.get('callbackUrl')

        router.push(callbackUrl ? `/login?callbackUrl=${callbackUrl}` : '/login')
      }, 2000)
    } catch (err) {
      setError('Ocurrió un error al registrar el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true)
      const result = await signIn('google', { redirect: false })

      if (result?.url) {
        const width = 500
        const height = 600
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2

        const popup = window.open(
          result.url,
          'google-register',
          `width=${width},height=${height},left=${left},top=${top}`
        )

        const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup)
            router.refresh()

            const urlParams = new URLSearchParams(window.location.search)
            const callbackUrl = urlParams.get('callbackUrl')

            router.push(callbackUrl || '/dashboard')
          }
        }, 1000)
      } else {
        setError('No se pudo obtener la URL de registro de Google.')
      }
    } catch (err) {
      console.error('Error al iniciar registro con Google:', err)
      setError('Ocurrió un error al conectar con Google.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex justify-center min-bs-[100dvh]'>
      <div
        className={classnames(
          'flex items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <RegisterIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && (
          <MaskImg
            alt='mask'
            src={authBackground}
            className={classnames({ 'scale-x-[-1]': theme.direction === 'rtl' })}
          />
        )}
      </div>
      <div className='flex justify-center items-center bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[600px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[550px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>Crea tu cuenta 🚀</Typography>
            <Typography>Completa tus datos para registrarte</Typography>
          </div>

          {error && (
            <Alert severity='error' className='mb-4'>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity='success' className='mb-4'>
              ¡Registro exitoso! Redirigiendo al login...
            </Alert>
          )}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='nombre'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label='Nombre'
                      placeholder='Juan'
                      error={!!errors.nombre}
                      helperText={errors.nombre?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name='apellido'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label='Apellido'
                      placeholder='Pérez'
                      error={!!errors.apellido}
                      helperText={errors.apellido?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name='numero_documento'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label='DNI'
                      placeholder='12345678'
                      error={!!errors.numero_documento}
                      helperText={errors.numero_documento?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name='celular'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label='Celular (opcional)'
                      placeholder='987654321'
                      error={!!errors.celular}
                      helperText={errors.celular?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name='correo'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label='Correo electrónico'
                      placeholder='correo@ejemplo.com'
                      type='email'
                      error={!!errors.correo}
                      helperText={errors.correo?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name='contrasena'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label='Contraseña'
                      placeholder='············'
                      type={isPasswordShown ? 'text' : 'password'}
                      error={!!errors.contrasena}
                      helperText={errors.contrasena?.message}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setIsPasswordShown(!isPasswordShown)}
                              onMouseDown={e => e.preventDefault()}
                              disabled={isLoading}
                            >
                              <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name='confirmarContrasena'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label='Confirmar Contraseña'
                      placeholder='············'
                      type={isConfirmPasswordShown ? 'text' : 'password'}
                      error={!!errors.confirmarContrasena}
                      helperText={errors.confirmarContrasena?.message}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}
                              onMouseDown={e => e.preventDefault()}
                              disabled={isLoading}
                            >
                              <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Button
              fullWidth
              variant='contained'
              type='submit'
              disabled={isLoading || success}
              sx={{
                backgroundColor: 'var(--web-primary, #25927F)',
                '&:hover': { backgroundColor: 'var(--web-dark, #025E44)' },
                '&:disabled': { backgroundColor: 'rgba(var(--web-primary-rgb, 37, 146, 127), 0.4)', color: 'rgba(255,255,255,0.7)' }
              }}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Registrarse'}
            </Button>

            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>¿Ya tienes una cuenta?</Typography>
              <Typography
                component={Link}
                href={loginUrl}
                sx={{ color: 'var(--web-primary, #25927F)', fontWeight: 600, '&:hover': { color: 'var(--web-dark, #025E44)' } }}
              >
                Inicia sesión
              </Typography>
            </div>

            <Divider className='gap-2'>o</Divider>

            <div className='flex justify-center items-center gap-1.5'>
              <GoogleButton onClick={handleGoogleRegister} disabled={isLoading || success} label='Registrarse con Google' />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
