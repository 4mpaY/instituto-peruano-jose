'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { signIn } from 'next-auth/react'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Type Imports
import type { SystemMode } from '@core/types'
import { loginSchema, type LoginDto } from '@/schemas/auth.schema'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Config Imports

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import Logo from '@components/layout/shared/Logo'
import Link from '@components/Link'

// Styled Custom Components
const LoginIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 680,
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

const LoginV2 = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [registerUrl, setRegisterUrl] = useState('/register')

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  useEffect(() => {
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')

    if (callbackUrl) {
      setRegisterUrl(`/register?callbackUrl=${callbackUrl}`)
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
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correo: '',
      contrasena: ''
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const onSubmit = async (data: LoginDto) => {
    try {
      setIsLoading(true)
      setError('')

      const result = await signIn('credentials', {
        redirect: false,
        correo: data.correo,
        contrasena: data.contrasena
      })

      // Verificar si hubo error
      if (result?.error) {
        console.error('❌ Error en login:', result.error)

        if (result.error === 'CredentialsSignin') {
          setError('Correo o contraseña incorrectos')
        } else if (result.error.includes('desactivada')) {
          setError('Tu cuenta ha sido desactivada. Contacta al administrador.')
        } else {
          setError('Error al iniciar sesión. Intenta nuevamente.')
        }
      }

      // Verificar que el login fue exitoso
      if (!result?.ok) {
        console.error('❌ Login no exitoso, result.ok =', result?.ok)
        setError('Error al iniciar sesión. Intenta nuevamente.')

        return
      }

      // Redirigir a la URL solicitada o al dashboard genérico
      const urlParams = new URLSearchParams(window.location.search)
      let callbackUrl = urlParams.get('callbackUrl')

      // Prevenir redirecciones a dominios externos por seguridad
      if (callbackUrl && !callbackUrl.startsWith(window.location.origin) && callbackUrl.startsWith('http')) {
        callbackUrl = '/dashboard'
      }

      // Usar href para forzar la recarga y asegurar que el middleware recoja la cookie fresca de NextAuth
      window.location.href = callbackUrl || '/dashboard'
    } catch (err) {
      console.error('💥 Error en login:', err)
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
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
          'google-login',
          `width=${width},height=${height},left=${left},top=${top}`
        )

        const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup)

            const urlParams = new URLSearchParams(window.location.search)
            let callbackUrl = urlParams.get('callbackUrl')

            if (callbackUrl && !callbackUrl.startsWith(window.location.origin) && callbackUrl.startsWith('http')) {
              callbackUrl = '/dashboard'
            }

            window.location.href = callbackUrl || '/dashboard'
          }
        }, 1000)
      } else {
        setError('No se pudo obtener la URL de autenticación de Google.')
      }
    } catch (err) {
      console.error('Error al iniciar login con Google:', err)
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
        <LoginIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && (
          <MaskImg
            alt='mask'
            src={authBackground}
            className={classnames({ 'scale-x-[-1]': theme.direction === 'rtl' })}
          />
        )}
      </div>
      <div className='flex justify-center items-center bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Bienvenido! 👋🏻`}</Typography>
            <Typography>Inicia sesión en tu cuenta para continuar</Typography>
          </div>

          {error && (
            <Alert severity='error' className='mb-4'>
              {error}
            </Alert>
          )}

          <form
            noValidate
            autoComplete='off'
            onSubmit={handleSubmit(onSubmit)}
            className='flex flex-col gap-5'
          >
            <Controller
              name='correo'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
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
                          onClick={handleClickShowPassword}
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

            <div className='flex justify-end'>
              <Typography
                component={Link}
                href='/forgot-password'
                variant='body2'
                sx={{ color: 'var(--web-primary, #25927F)', '&:hover': { color: 'var(--web-dark, #025E44)' } }}
              >
                ¿Olvidaste tu contraseña?
              </Typography>
            </div>

            <Button
              fullWidth
              variant='contained'
              type='submit'
              disabled={isLoading}
              sx={{
                backgroundColor: 'var(--web-primary, #25927F)',
                '&:hover': { backgroundColor: 'var(--web-dark, #025E44)' },
                '&:disabled': { backgroundColor: 'rgba(var(--web-primary-rgb, 37, 146, 127), 0.4)', color: 'rgba(255,255,255,0.7)' }
              }}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Iniciar Sesión'}
            </Button>

            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>¿No tienes una cuenta?</Typography>
              <Typography
                component={Link}
                href={registerUrl}
                sx={{ color: 'var(--web-primary, #25927F)', fontWeight: 600, '&:hover': { color: 'var(--web-dark, #025E44)' } }}
              >
                Regístrate
              </Typography>
            </div>

            <Divider className='gap-2'>o</Divider>

            <div className='flex justify-center items-center gap-1.5'>
              <Button
                fullWidth
                variant='outlined'
                color='secondary'
                startIcon={<i className='tabler-brand-google-filled' />}
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                Continuar con Google
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginV2
