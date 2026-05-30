'use client'

import { useState, useEffect } from 'react'

import { Box, Typography, Button, Paper, Stack, alpha } from '@mui/material'

interface LiveLessonPlaceholderProps {
  titulo: string
  fechaProgramada?: string | Date | null
  fechaFin?: string | Date | null
  enlaceReunion?: string | null
  esEnVivo: boolean
}

function formatShortDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'pm' : 'am'

  hours = hours % 12 || 12

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`
}

const LiveLessonPlaceholder = ({
  titulo,
  fechaProgramada,
  fechaFin,
  enlaceReunion,
  esEnVivo
}: LiveLessonPlaceholderProps) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isEnded, setIsEnded] = useState(false)

  useEffect(() => {
    if (!fechaProgramada || !esEnVivo) return

    const tick = () => {
      const now = new Date().getTime()
      const start = new Date(fechaProgramada).getTime()
      const end = fechaFin ? new Date(fechaFin).getTime() : null

      if (end && now >= end) {
        setIsEnded(true)
        setIsLive(false)
        setTimeLeft(null)
      } else if (now >= start) {
        setIsEnded(false)
        setIsLive(true)
        setTimeLeft(null)
      } else {
        setIsEnded(false)
        setIsLive(false)
        setTimeLeft({
          days: Math.floor((start - now) / (1000 * 60 * 60 * 24)),
          hours: Math.floor(((start - now) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor(((start - now) % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor(((start - now) % (1000 * 60)) / 1000)
        })
      }
    }

    tick()
    const timer = setInterval(tick, 1000)

    return () => clearInterval(timer)
  }, [fechaProgramada, fechaFin, esEnVivo])

  return (
    <Paper
      sx={{
        width: '100%',
        aspectRatio: '16/9',
        bgcolor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: { xs: 0, md: '16px' },
        overflow: 'hidden',
        position: 'relative',
        color: 'white',
        textAlign: 'center',
        p: { xs: 3, sm: 4 },
        border: '1px solid',
        borderColor: alpha(isEnded ? '#64748b' : isLive ? '#ef4444' : '#3b82f6', 0.2)
      }}
    >
      {/* Background glow */}
      <Box sx={{
        position: 'absolute', top: -100, right: -100,
        width: 300, height: 300,
        bgcolor: alpha(isEnded ? '#64748b' : isLive ? '#ef4444' : '#3b82f6', 0.08),
        borderRadius: '50%', filter: 'blur(80px)'
      }} />
      <Box sx={{
        position: 'absolute', bottom: -100, left: -100,
        width: 300, height: 300,
        bgcolor: alpha('#8b5cf6', 0.08),
        borderRadius: '50%', filter: 'blur(80px)'
      }} />

      <Stack spacing={2.5} alignItems="center" sx={{ position: 'relative', zIndex: 1, maxWidth: 560, width: '100%' }}>

        {/* Badge */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 1,
          px: 2, py: 0.5, borderRadius: '100px',
          bgcolor: isEnded ? alpha('#64748b', 0.12) : isLive ? alpha('#ef4444', 0.12) : alpha('#3b82f6', 0.12),
          border: '1px solid',
          borderColor: isEnded ? alpha('#64748b', 0.5) : isLive ? alpha('#ef4444', 0.5) : alpha('#3b82f6', 0.5),
          color: isEnded ? '#94a3b8' : isLive ? '#f87171' : '#60a5fa'
        }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%',
            bgcolor: isEnded ? '#64748b' : isLive ? '#ef4444' : '#3b82f6',
            animation: isLive ? 'livePulse 2s infinite' : 'none'
          }} />
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: 'inherit', fontSize: '0.7rem' }}>
            {isEnded ? 'Sesión Finalizada' : isLive ? 'Transmisión en Vivo' : 'Próximamente'}
          </Typography>
        </Box>

        {/* Title */}
        <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.2, color: 'common.white', fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>
          {titulo}
        </Typography>

        {/* ── ENDED STATE ── */}
        {isEnded && (
          <>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
              La sesión ha finalizado
            </Typography>
            {(fechaProgramada || fechaFin) && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.5, sm: 0 }}
                alignItems="center"
                divider={
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, mx: 2.5, color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>|</Box>
                }
              >
                {fechaProgramada && (
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '1rem' }}>
                    Inicio:&nbsp;{formatShortDate(fechaProgramada)}
                  </Typography>
                )}
                {fechaFin && (
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '1rem' }}>
                    Fin:&nbsp;{formatShortDate(fechaFin)}
                  </Typography>
                )}
              </Stack>
            )}
          </>
        )}

        {/* ── UPCOMING STATE ── */}
        {!isLive && !isEnded && (
          <>
            {/* Dates row */}
            {(fechaProgramada || fechaFin) && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.5, sm: 0 }}
                alignItems="center"
                divider={
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, mx: 2.5, color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>|</Box>
                }
              >
                {fechaProgramada && (
                  <Typography variant="body2" sx={{ color: '#4ade80', fontWeight: 600, fontSize: '1rem' }}>
                    Inicio:&nbsp;{formatShortDate(fechaProgramada)}
                  </Typography>
                )}
                {fechaFin && (
                  <Typography variant="body2" sx={{ color: '#4ade80', fontWeight: 600, fontSize: '1rem' }}>
                    Fin:&nbsp;{formatShortDate(fechaFin)}
                  </Typography>
                )}
              </Stack>
            )}

            {/* Countdown */}
            {timeLeft && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1.5, color: 'rgba(255,255,255,0.6)' }}>
                  La clase iniciará en:
                </Typography>
                <Stack direction="row" spacing={{ xs: 1.5, sm: 2.5 }} justifyContent="center">
                  {[
                    { label: 'DÍAS', value: timeLeft.days },
                    { label: 'HRS', value: timeLeft.hours },
                    { label: 'MIN', value: timeLeft.minutes },
                    { label: 'SEG', value: timeLeft.seconds }
                  ].map((item) => (
                    <Box key={item.label} sx={{ minWidth: { xs: 52, sm: 64 } }}>
                      <Typography sx={{ fontWeight: 800, color: 'common.white', fontSize: { xs: '1.8rem', sm: '2.2rem' }, lineHeight: 1 }}>
                        {String(item.value).padStart(2, '0')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', letterSpacing: 1, fontSize: '0.65rem' }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}

        {/* ── LIVE STATE ── */}
        {isLive && !isEnded && (
          <>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem' }}>
              La sesión ha comenzado, aún puedes participar
            </Typography>

            {fechaFin && (
              <Typography variant="body2" sx={{ color: '#4ade80', fontWeight: 600, fontSize: '1rem' }}>
                Finaliza:&nbsp;{formatShortDate(fechaFin)}
              </Typography>
            )}

            <Button
              variant="contained"
              size="large"
              href={enlaceReunion || '#'}
              target="_blank"
              startIcon={<i className="tabler-external-link" />}
              sx={{
                mt: 0.5,
                py: 1.5,
                px: 5,
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: '#025E44',
                boxShadow: '0 8px 20px rgba(2,94,68,0.35)',
                '&:hover': {
                  bgcolor: '#014d36',
                  boxShadow: '0 12px 28px rgba(2,94,68,0.45)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.25s'
              }}
            >
              Unirse a la Clase en Vivo
            </Button>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mt: -0.5 }}>
              Haz clic arriba para unirte a la reunión en vivo
            </Typography>
          </>
        )}
      </Stack>

      <style>{`
        @keyframes livePulse {
          0%   { transform: scale(1);   opacity: 1; }
          50%  { transform: scale(1.6); opacity: 0.4; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </Paper>
  )
}

export default LiveLessonPlaceholder
