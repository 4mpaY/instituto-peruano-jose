'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Grid,
  Divider,
  InputAdornment
} from '@mui/material'
import { signIn } from 'next-auth/react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { loginSchema, type LoginDto, registerSchema, type RegisterDto, forgotPasswordSchema, type ForgotPasswordDto, resetPasswordSchema, type ResetPasswordDto } from '@/schemas/auth.schema'
import CustomTextField from '@core/components/mui/TextField'
import Logo from '@components/layout/shared/Logo'
import GoogleButton from './GoogleButton'

export type Mode = 'login' | 'register' | 'forgot-password' | 'reset-password'

interface AuthModalProps {
  open: boolean
  mode: Mode
  callbackUrl?: string
  onClose: () => void
  onSwitchMode: (mode: Mode) => void
}

const AuthModal = ({ open, mode, callbackUrl, onClose, onSwitchMode }: AuthModalProps) => {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const router = useRouter()

  const loginForm = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: '', contrasena: '' }
  })

  const registerForm = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      correo: '',
      numero_documento: '',
      celular: '',
      contrasena: '',
      confirmarContrasena: ''
    }
  })

  const forgotForm = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { correo: '' }
  })

  const resetForm = useForm<ResetPasswordDto>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { correo: '', codigo: '', nuevaContrasena: '', confirmarNuevaContrasena: '' }
  })

  useEffect(() => {
    if (!open) {
      setError('')
      setIsLoading(false)
      setRegisterSuccess(false)
      setForgotSuccess(false)
      setIsPasswordShown(false)
      setIsConfirmPasswordShown(false)
      loginForm.reset()
      registerForm.reset()
      forgotForm.reset()
      resetForm.reset()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoginSuccess = () => {
    onClose()

    if (callbackUrl) {
      window.location.href = callbackUrl
    } else {
      router.refresh()
    }
  }

  const onLoginSubmit = async (data: LoginDto) => {
    try {
      setIsLoading(true)
      setError('')

      const result = await signIn('credentials', {
        redirect: false,
        correo: data.correo,
        contrasena: data.contrasena
      })

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Correo o contraseña incorrectos')
        } else if (result.error.includes('desactivada')) {
          setError('Tu cuenta ha sido desactivada. Contacta al administrador.')
        } else {
          setError('Error al iniciar sesión. Intenta nuevamente.')
        }

        return
      }

      if (result?.ok) {
        handleLoginSuccess()
      }
    } catch {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const onRegisterSubmit = async (data: RegisterDto) => {
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

      setRegisterSuccess(true)

      // Auto-login tras registro exitoso
      const loginResult = await signIn('credentials', {
        redirect: false,
        correo: data.correo,
        contrasena: data.contrasena
      })

      if (loginResult?.ok) {
        handleLoginSuccess()
      } else {
        // Si falla el auto-login, llevamos al modo login con mensaje de éxito
        onSwitchMode('login')
        setRegisterSuccess(false)
        setError('')
        loginForm.setValue('correo', data.correo)
      }
    } catch {
      setError('Ocurrió un error al registrar el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Usamos el redireccionamiento estándar de NextAuth.
      // Esto es más robusto que usar ventanas emergentes (popups) que pueden ser bloqueadas.
      await signIn('google', {
        callbackUrl: callbackUrl || window.location.href
      })
    } catch (error) {
      console.error('Error al conectar con Google:', error)
      setError('Ocurrió un error al conectar con Google.')
      setIsLoading(false)
    }
  }

  const onForgotSubmit = async (data: ForgotPasswordDto) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Error al solicitar recuperación')
      }

      // Pasar al modo reset-password y prellenar el correo
      resetForm.setValue('correo', data.correo)
      setError('')
      setRegisterSuccess(false)
      setForgotSuccess(false)
      onSwitchMode('reset-password')
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setIsLoading(false)
    }
  }

  const onResetSubmit = async (data: ResetPasswordDto) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Error al restablecer contraseña')
      }

      setForgotSuccess(true)

      // Limpiar el formulario de reset
      resetForm.reset()
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitch = (next: Mode) => {
    setError('')
    setRegisterSuccess(false)
    setForgotSuccess(false)
    forgotForm.reset()
    resetForm.reset()
    onSwitchMode(next)
  }

  return (
    <Dialog
      open={open}
      onClose={() => !isLoading && onClose()}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: { xs: '16px', sm: '24px' },
          p: 2,
          overflowX: 'hidden',
          maxHeight: { xs: '92dvh', sm: '90vh' },
          mx: { xs: 2, sm: 'auto' }
        }
      }}
    >
      <Box sx={{ position: 'absolute', right: 16, top: 16, zIndex: 1 }}>
        <IconButton onClick={onClose} disabled={isLoading}>
          <i className="tabler-x" />
        </IconButton>
      </Box>

      <DialogContent sx={{ overflowX: 'hidden', overflowY: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Box sx={{ transform: 'scale(1.5)', transformOrigin: 'center', display: 'inline-block' }}>
              <Logo />
            </Box>
          </Box>
          <Typography variant="h5" sx={{ mt: 4, fontWeight: 800 }}>
            {mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Crear Cuenta' : '¿Olvidaste tu contraseña?'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mode === 'login'
              ? 'Ingresa tus datos para continuar'
              : mode === 'register'
                ? 'Completa tus datos para registrarte'
                : mode === 'forgot-password'
                  ? 'Te enviaremos un código para restablecer tu contraseña'
                  : 'Ingresa el código que recibiste y tu nueva contraseña'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {registerSuccess && <Alert severity="success" sx={{ mb: 2 }}>¡Registro exitoso! Iniciando sesión...</Alert>}

        {mode === 'login' ? (
          <form key="login-form" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
            <Stack spacing={3}>
              <Controller
                name="correo"
                control={loginForm.control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Correo electrónico"
                    placeholder="correo@ejemplo.com"
                    type="email"
                    error={!!loginForm.formState.errors.correo}
                    helperText={loginForm.formState.errors.correo?.message}
                    disabled={isLoading}
                  />
                )}
              />
              <Controller
                name="contrasena"
                control={loginForm.control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Contraseña"
                    placeholder="············"
                    type={isPasswordShown ? 'text' : 'password'}
                    error={!!loginForm.formState.errors.contrasena}
                    helperText={loginForm.formState.errors.contrasena?.message}
                    disabled={isLoading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() => setIsPasswordShown(v => !v)}
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

              <Box sx={{ textAlign: 'right', mt: -1 }}>
                <Typography
                  variant="body2"
                  component="button"
                  type="button"
                  onClick={() => handleSwitch('forgot-password')}
                  sx={{ color: 'primary.main', border: 'none', bgcolor: 'transparent', cursor: 'pointer', p: 0, '&:hover': { textDecoration: 'underline' } }}
                >
                  ¿Olvidaste tu contraseña?
                </Typography>
              </Box>

              <Button fullWidth variant="contained" type="submit" size="large" disabled={isLoading} sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700 }}>
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
              </Button>

              <Divider>o</Divider>

              <GoogleButton onClick={handleGoogleAuth} disabled={isLoading} label='Continuar con Google' />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" component="span">¿No tienes cuenta? </Typography>
                <Typography
                  variant="body2"
                  component="button"
                  type="button"
                  onClick={() => handleSwitch('register')}
                  sx={{ color: 'primary.main', fontWeight: 700, border: 'none', bgcolor: 'transparent', cursor: 'pointer', p: 0 }}
                >
                  Regístrate aquí
                </Typography>
              </Box>
            </Stack>
          </form>
        ) : mode === 'register' ? (
          <form key="register-form" onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="nombre"
                  control={registerForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Nombres"
                      placeholder="Juan"
                      error={!!registerForm.formState.errors.nombre}
                      helperText={registerForm.formState.errors.nombre?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="apellido"
                  control={registerForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Apellidos"
                      placeholder="Pérez"
                      error={!!registerForm.formState.errors.apellido}
                      helperText={registerForm.formState.errors.apellido?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="numero_documento"
                  control={registerForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="DNI"
                      placeholder="12345678"
                      error={!!registerForm.formState.errors.numero_documento}
                      helperText={registerForm.formState.errors.numero_documento?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="celular"
                  control={registerForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Celular (opcional)"
                      placeholder="987654321"
                      error={!!registerForm.formState.errors.celular}
                      helperText={registerForm.formState.errors.celular?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="correo"
                  control={registerForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Correo electrónico"
                      placeholder="correo@ejemplo.com"
                      type="email"
                      error={!!registerForm.formState.errors.correo}
                      helperText={registerForm.formState.errors.correo?.message}
                      disabled={isLoading}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="contrasena"
                  control={registerForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Contraseña"
                      placeholder="············"
                      type={isPasswordShown ? 'text' : 'password'}
                      error={!!registerForm.formState.errors.contrasena}
                      helperText={registerForm.formState.errors.contrasena?.message}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={() => setIsPasswordShown(v => !v)}
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
                  name="confirmarContrasena"
                  control={registerForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Confirmar Contraseña"
                      placeholder="············"
                      type={isConfirmPasswordShown ? 'text' : 'password'}
                      error={!!registerForm.formState.errors.confirmarContrasena}
                      helperText={registerForm.formState.errors.confirmarContrasena?.message}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={() => setIsConfirmPasswordShown(v => !v)}
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

              <Grid item xs={12}>
                <Button fullWidth variant="contained" type="submit" size="large" disabled={isLoading || registerSuccess} sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700 }}>
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Registrarse'}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Divider>o</Divider>
              </Grid>

              <Grid item xs={12}>
                <GoogleButton onClick={handleGoogleAuth} disabled={isLoading || registerSuccess} label='Registrarse con Google' />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" component="span">¿Ya tienes cuenta? </Typography>
                  <Typography
                    variant="body2"
                    component="button"
                    type="button"
                    onClick={() => handleSwitch('login')}
                    sx={{ color: 'primary.main', fontWeight: 700, border: 'none', bgcolor: 'transparent', cursor: 'pointer', p: 0 }}
                  >
                    Inicia sesión
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </form>
        ) : mode === 'forgot-password' ? (
          <form key="forgot-password-form" onSubmit={forgotForm.handleSubmit(onForgotSubmit)}>
            <Stack spacing={3}>
              <Controller
                name="correo"
                control={forgotForm.control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label="Correo electrónico"
                    placeholder="correo@ejemplo.com"
                    type="email"
                    error={!!forgotForm.formState.errors.correo}
                    helperText={forgotForm.formState.errors.correo?.message}
                    disabled={isLoading}
                  />
                )}
              />

              <Button fullWidth variant="contained" type="submit" size="large" disabled={isLoading} sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700 }}>
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Enviar código'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  component="button"
                  type="button"
                  onClick={() => handleSwitch('login')}
                  sx={{ color: 'primary.main', fontWeight: 700, border: 'none', bgcolor: 'transparent', cursor: 'pointer', p: 0, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                >
                  <i className="tabler-chevron-left" style={{ fontSize: '1rem' }} />
                  Volver al inicio de sesión
                </Typography>
              </Box>
            </Stack>
          </form>
        ) : mode === 'reset-password' ? (
          forgotSuccess ? (
            <Stack key="reset-success" spacing={3} sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ fontSize: '3rem' }}>✅</Box>
              <Typography variant="h6" fontWeight={700}>¡Contraseña Restablecida!</Typography>
              <Typography variant="body2" color="text.secondary">
                Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => handleSwitch('login')}
                sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700 }}
              >
                Ir al inicio de sesión
              </Button>
            </Stack>
          ) : (
            <form key="reset-password-form" onSubmit={resetForm.handleSubmit(onResetSubmit)}>
              <Stack spacing={3}>
                <Alert severity="info">
                  Hemos enviado un código de 6 dígitos a tu correo. Por favor, ingrésalo a continuación.
                </Alert>

                <Controller
                  name="codigo"
                  control={resetForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      autoFocus
                      label="Código de verificación (OTP)"
                      placeholder="123456"
                      error={!!resetForm.formState.errors.codigo}
                      helperText={resetForm.formState.errors.codigo?.message}
                      disabled={isLoading}
                    />
                  )}
                />

                <Controller
                  name="nuevaContrasena"
                  control={resetForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Nueva contraseña"
                      placeholder="············"
                      type={isPasswordShown ? 'text' : 'password'}
                      error={!!resetForm.formState.errors.nuevaContrasena}
                      helperText={resetForm.formState.errors.nuevaContrasena?.message}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={() => setIsPasswordShown(v => !v)}
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

                <Controller
                  name="confirmarNuevaContrasena"
                  control={resetForm.control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Confirmar nueva contraseña"
                      placeholder="············"
                      type={isConfirmPasswordShown ? 'text' : 'password'}
                      error={!!resetForm.formState.errors.confirmarNuevaContrasena}
                      helperText={resetForm.formState.errors.confirmarNuevaContrasena?.message}
                      disabled={isLoading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={() => setIsConfirmPasswordShown(v => !v)}
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

                <Button fullWidth variant="contained" type="submit" size="large" disabled={isLoading} sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700 }}>
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Restablecer contraseña'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    component="button"
                    type="button"
                    onClick={() => handleSwitch('login')}
                    sx={{ color: 'primary.main', fontWeight: 700, border: 'none', bgcolor: 'transparent', cursor: 'pointer', p: 0, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <i className="tabler-chevron-left" style={{ fontSize: '1rem' }} />
                    Volver al inicio de sesión
                  </Typography>
                </Box>
              </Stack>
            </form>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default AuthModal
