'use client'

import React, { useState, useRef } from 'react'

import { useRouter } from 'next/navigation'

import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
  InputAdornment
} from '@mui/material'
import { toast } from 'react-toastify'
import axios from 'axios'
import { getSession, useSession } from 'next-auth/react'

import { MuiTelInput } from 'mui-tel-input'

import UserAvatar from '@/utils/components/UserAvatar'

import { AxiosPerfil } from '../http/axiosPerfil'
import type { Perfil } from '../entity/Perfil'
import SignatureUpload from '../../admin/usuarios/components/SignatureUpload'
import ProfesorBioEditor from './ProfesorBioEditor'

interface Props {
  user: Perfil
}

export default function UserProfileForm({ user }: Props) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    celular: user.celular || '',
    numero_documento: user.numero_documento || '',
    biografia: user.biografia || '',
    cargo: user.cargo || '',
    firma: user.firma || '',
    contrasena: '',
    confirmarContrasena: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      setSelectedFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.contrasena && formData.contrasena !== formData.confirmarContrasena) {
      toast.error('Las contraseñas nuevas no coinciden')

      return
    }

    setLoading(true)

    try {
      let avatarUrl = user.avatar

      // Si hay un archivo seleccionado, lo subimos primero
      if (selectedFile) {
        const mediaData = new FormData()

        mediaData.append('file', selectedFile)

        const uploadResponse = await axios.post('/api/media', mediaData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (uploadResponse.data.status) {
          avatarUrl = uploadResponse.data.result.url
        }
      }

      const getAuthToken = async () => {
        const s = await getSession()

        return s?.user?.accessToken ?? null
      }

      const axiosPerfil = new AxiosPerfil({ getAuthToken })

      const resultData = await axiosPerfil.update({
        ...formData,
        avatar: avatarUrl
      })

      if (resultData) {
        toast.success('Perfil actualizado correctamente')

        // Refrescar la sesión de NextAuth para que el header muestre el nuevo avatar
        await updateSession()

        router.refresh()

        // Limpiamos los campos de contraseña
        setFormData(prev => ({ ...prev, contrasena: '', confirmarContrasena: '' }))
        setSelectedFile(null)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error de servidor')
    } finally {
      setLoading(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 4, borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 25px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <Badge
              overlap='circular'
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Tooltip title='Cambiar foto de perfil'>
                  <IconButton
                    size='small'
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                      border: '2px solid white'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className='tabler-camera text-sm' />
                  </IconButton>
                </Tooltip>
              }
            >
              <UserAvatar
                src={avatarPreview}
                name={user.nombre}
                apellido={user.apellido}
                size={120}
                sx={{ cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              />
            </Badge>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {user.nombre} {user.apellido}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {user.rol}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Stack spacing={2} textAlign="left">
            <Box>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>CORREO</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.correo}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>DOCUMENTO</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.numero_documento}</Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={8}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: '24px', boxShadow: '0 4px 25px rgba(0,0,0,0.05)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 4 }}>
            Editar Perfil
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Documento de Identidad"
                  name="numero_documento"
                  value={formData.numero_documento}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MuiTelInput
                  fullWidth
                  label="Celular"
                  name="celular"
                  defaultCountry="PE"
                  forceCallingCode
                  value={formData.celular}
                  onChange={(newValue) => setFormData(prev => ({ ...prev, celular: newValue }))}
                />
              </Grid>

              {/* Editor de biografía: estructurado para profesores, libre para estudiantes */}
              {(user.rol === 'PROFESOR' || user.rol === 'ADMIN') ? (
                <Grid item xs={12}>
                  <ProfesorBioEditor
                    value={formData.biografia}
                    onChange={(html) => setFormData(prev => ({ ...prev, biografia: html }))}
                    rol={user.rol}
                  />
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Acerca de mí"
                    name="biografia"
                    value={formData.biografia}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    placeholder="Cuéntanos un poco sobre ti..."
                  />
                </Grid>
              )}

              {(user.rol === 'ADMIN' || user.rol === 'PROFESOR') && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>Información de Firma</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Utilizada para firmar los certificados de los cursos que dictas.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cargo / Título"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                      placeholder="Ej: Instructor de Desarrollo Web"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Imagen de Firma</Typography>
                    <SignatureUpload
                      value={formData.firma || ''}
                      onChange={(url) => setFormData(prev => ({ ...prev, firma: url }))}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>Cambio de Contraseña</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Si no deseas cambiar tu contraseña actual, deja estos campos en blanco.
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  name="contrasena"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.contrasena}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} style={{ fontSize: '1.25rem' }} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Nueva Contraseña"
                  name="confirmarContrasena"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmarContrasena}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} style={{ fontSize: '1.25rem' }} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ py: 1.5, px: 4, borderRadius: '12px', fontWeight: 600 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Guardar Cambios'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Grid>
    </Grid>
  )
}
