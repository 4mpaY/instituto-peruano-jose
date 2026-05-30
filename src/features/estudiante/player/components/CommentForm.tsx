'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import { Box, TextField, Button, Avatar, Stack, CircularProgress, Alert } from '@mui/material'
import { useSession } from 'next-auth/react'

interface CommentFormProps {
  leccionId: string
  respuestaAId?: string
  onSuccess: () => void
  placeholder?: string
  autoFocus?: boolean
}

const CommentForm = ({
  leccionId,
  respuestaAId,
  onSuccess,
  placeholder = "Escribe un comentario o pregunta...",
  autoFocus = false
}: CommentFormProps) => {
  const { data: session } = useSession()
  const [contenido, setContenido] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pendiente, setPendiente] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!contenido.trim()) return

    setIsSubmitting(true)
    setError('')
    setPendiente(false)

    try {
      const response = await fetch(`/api/lecciones/${leccionId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido, respuesta_a_id: respuestaAId }),
      })

      if (!response.ok) {
        const data = await response.json()

        throw new Error(data.error || 'Error al enviar el comentario')
      }

      const data = await response.json()

      setContenido('')

      if (data.estado === 'PENDIENTE') {
        setPendiente(true)
      } else {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) return null

  if (pendiente) {
    return (
      <Alert
        severity="info"
        icon={<i className="tabler-clock" style={{ fontSize: '1.1rem' }} />}
        action={
          <Button size="small" onClick={() => setPendiente(false)}>
            Otro comentario
          </Button>
        }
        sx={{ borderRadius: '12px' }}
      >
        Tu comentario está pendiente de aprobación y será visible una vez revisado.
      </Alert>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar
          src={session.user.image || undefined}
          alt={session.user.name || 'User'}
          sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}
        >
          {session.user.name?.charAt(0)}
        </Avatar>

        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            placeholder={placeholder}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            disabled={isSubmitting}
            autoFocus={autoFocus}
            error={!!error}
            helperText={error}
            variant="outlined"
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused fieldset': { borderWidth: '2px' }
              }
            }}
          />

          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!contenido.trim() || isSubmitting}
              sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 600 }}
              endIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <i className="tabler-send" style={{ fontSize: '1.2rem' }} />}
            >
              {isSubmitting ? 'Publicando...' : (respuestaAId ? 'Responder' : 'Comentar')}
            </Button>
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}

export default CommentForm
