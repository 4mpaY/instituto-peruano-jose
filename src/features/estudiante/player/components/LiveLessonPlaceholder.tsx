'use client'

import { useState, useEffect } from 'react'

import { Box, Typography, Button, Paper, Stack, alpha, Chip } from '@mui/material'

// ─── Detección de plataforma ────────────────────────────────────────────────

type Platform = 'zoom' | 'youtube' | 'facebook' | 'meet' | 'teams' | 'webex' | 'other'

interface PlatformInfo {
  name: string
  color: string
  hoverColor: string
  icon: React.ReactNode
  joinLabel: string
  upcomingLabel: string
}

function detectPlatform(url: string | null | undefined): Platform {
  if (!url) return 'other'
  const lower = url.toLowerCase()

  if (lower.includes('zoom.us') || lower.includes('zoom.com')) return 'zoom'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('facebook.com') || lower.includes('fb.com') || lower.includes('fb.watch')) return 'facebook'
  if (lower.includes('meet.google.com')) return 'meet'
  if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return 'teams'
  if (lower.includes('webex.com')) return 'webex'

  return 'other'
}

// SVG icons inline (no dependency on icon packs)
const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.5 8.25C4.5 7.007 5.507 6 6.75 6h10.5C18.493 6 19.5 7.007 19.5 8.25v7.5C19.5 16.993 18.493 18 17.25 18H6.75C5.507 18 4.5 16.993 4.5 15.75v-7.5zm15 1.5l3 -1.5v7.5l-3 -1.5V9.75z"/>
  </svg>
)

const YouTubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.947-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.941.266 1.684 1.037 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const MeetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.18 3H3.82C2.82 3 2 3.82 2 4.82v14.36C2 20.18 2.82 21 3.82 21h16.36c1 0 1.82-.82 1.82-1.82V4.82C22 3.82 21.18 3 20.18 3zm-1.18 13l-4-3v3H7V8h8v3l4-3v8z"/>
  </svg>
)

const TeamsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v8h-2V7H10V5h8v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/>
  </svg>
)

const WebexIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5h-9v-2h9v2zm-9-4v-2h9v2h-9z"/>
  </svg>
)

const ExternalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

const PLATFORM_INFO: Record<Platform, PlatformInfo> = {
  zoom: {
    name: 'Zoom',
    color: '#2D8CFF',
    hoverColor: '#1a7aee',
    icon: <ZoomIcon />,
    joinLabel: 'Unirse a Zoom',
    upcomingLabel: 'Ver en Zoom',
  },
  youtube: {
    name: 'YouTube Live',
    color: '#FF0000',
    hoverColor: '#cc0000',
    icon: <YouTubeIcon />,
    joinLabel: 'Ver en YouTube',
    upcomingLabel: 'Ver en YouTube',
  },
  facebook: {
    name: 'Facebook Live',
    color: '#1877F2',
    hoverColor: '#1564d3',
    icon: <FacebookIcon />,
    joinLabel: 'Ver en Facebook',
    upcomingLabel: 'Ver en Facebook',
  },
  meet: {
    name: 'Google Meet',
    color: '#00897B',
    hoverColor: '#00766A',
    icon: <MeetIcon />,
    joinLabel: 'Unirse a Meet',
    upcomingLabel: 'Abrir Meet',
  },
  teams: {
    name: 'Microsoft Teams',
    color: '#5059C9',
    hoverColor: '#3d45b0',
    icon: <TeamsIcon />,
    joinLabel: 'Unirse a Teams',
    upcomingLabel: 'Abrir Teams',
  },
  webex: {
    name: 'Webex',
    color: '#00BEF2',
    hoverColor: '#00a8d8',
    icon: <WebexIcon />,
    joinLabel: 'Unirse a Webex',
    upcomingLabel: 'Abrir Webex',
  },
  other: {
    name: 'Clase en Vivo',
    color: '#025E44',
    hoverColor: '#014d36',
    icon: <ExternalIcon />,
    joinLabel: 'Unirse a la Clase',
    upcomingLabel: 'Ver enlace',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Platform badge shown near the button ────────────────────────────────────

function PlatformBadge({ platform, info }: { platform: Platform; info: PlatformInfo }) {
  if (platform === 'other') return null

  return (
    <Chip
      size="small"
      icon={
        <Box sx={{ display: 'flex', alignItems: 'center', color: info.color, ml: '6px !important' }}>
          {info.icon}
        </Box>
      }
      label={info.name}
      sx={{
        bgcolor: alpha(info.color, 0.12),
        color: info.color,
        fontWeight: 700,
        fontSize: '0.7rem',
        border: `1px solid ${alpha(info.color, 0.3)}`,
        '& .MuiChip-icon': { color: info.color },
      }}
    />
  )
}

// ─── Join Button ─────────────────────────────────────────────────────────────

function JoinButton({
  enlaceReunion,
  isLive,
  isEnded,
  platform,
  info,
}: {
  enlaceReunion: string
  isLive: boolean
  isEnded: boolean
  platform: Platform
  info: PlatformInfo
}) {
  const label = isLive ? info.joinLabel : (isEnded ? info.upcomingLabel : info.upcomingLabel)
  const isLivePulse = isLive

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Button
        variant="contained"
        size="large"
        href={enlaceReunion}
        target="_blank"
        rel="noopener noreferrer"
        startIcon={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {info.icon}
          </Box>
        }
        sx={{
          py: 1.5,
          px: 5,
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 800,
          textTransform: 'none',
          bgcolor: info.color,
          boxShadow: `0 8px 20px ${alpha(info.color, 0.4)}`,
          position: 'relative',
          overflow: 'visible',
          '&:hover': {
            bgcolor: info.hoverColor,
            boxShadow: `0 12px 28px ${alpha(info.color, 0.55)}`,
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.25s',
          ...(isLivePulse && {
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: -3,
              borderRadius: '14px',
              border: `2px solid ${alpha(info.color, 0.5)}`,
              animation: 'buttonPulse 2s infinite',
            },
          }),
        }}
      >
        {label}
      </Button>

      {isLive && (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          La sesión está en curso · haz clic para unirte
        </Typography>
      )}
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LiveLessonPlaceholderProps {
  titulo: string
  fechaProgramada?: string | Date | null
  fechaFin?: string | Date | null
  enlaceReunion?: string | null
  esEnVivo: boolean
}

const LiveLessonPlaceholder = ({
  titulo,
  fechaProgramada,
  fechaFin,
  enlaceReunion,
  esEnVivo,
}: LiveLessonPlaceholderProps) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isEnded, setIsEnded] = useState(false)

  const platform = detectPlatform(enlaceReunion)
  const platformInfo = PLATFORM_INFO[platform]

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
          seconds: Math.floor(((start - now) % (1000 * 60)) / 1000),
        })
      }
    }

    tick()
    const timer = setInterval(tick, 1000)

    return () => clearInterval(timer)
  }, [fechaProgramada, fechaFin, esEnVivo])

  // Badge color by state
  const stateColor = isEnded ? '#64748b' : isLive ? '#ef4444' : '#3b82f6'
  const stateLabel = isEnded ? 'Sesión Finalizada' : isLive ? 'Transmisión en Vivo' : 'Próximamente'

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
        borderColor: alpha(stateColor, 0.2),
      }}
    >
      {/* Background glows */}
      <Box sx={{
        position: 'absolute', top: -100, right: -100,
        width: 300, height: 300,
        bgcolor: alpha(isLive ? platformInfo.color : stateColor, 0.08),
        borderRadius: '50%', filter: 'blur(80px)',
      }} />
      <Box sx={{
        position: 'absolute', bottom: -100, left: -100,
        width: 300, height: 300,
        bgcolor: alpha('#8b5cf6', 0.08),
        borderRadius: '50%', filter: 'blur(80px)',
      }} />

      <Stack spacing={2.5} alignItems="center" sx={{ position: 'relative', zIndex: 1, maxWidth: 560, width: '100%' }}>

        {/* Status badge */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 1,
          px: 2, py: 0.5, borderRadius: '100px',
          bgcolor: alpha(stateColor, 0.12),
          border: '1px solid',
          borderColor: alpha(stateColor, 0.5),
          color: isEnded ? '#94a3b8' : isLive ? '#f87171' : '#60a5fa',
        }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%',
            bgcolor: stateColor,
            animation: isLive ? 'livePulse 2s infinite' : 'none',
          }} />
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: 'inherit', fontSize: '0.7rem' }}>
            {stateLabel}
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 0 }} alignItems="center"
                divider={<Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, mx: 2.5, color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>|</Box>}
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

            {/* Join button (ended) */}
            {enlaceReunion && (
              <Stack spacing={1} alignItems="center">
                <PlatformBadge platform={platform} info={platformInfo} />
                <JoinButton
                  enlaceReunion={enlaceReunion}
                  isLive={false}
                  isEnded={true}
                  platform={platform}
                  info={platformInfo}
                />
              </Stack>
            )}
          </>
        )}

        {/* ── UPCOMING STATE ── */}
        {!isLive && !isEnded && (
          <>
            {/* Dates */}
            {(fechaProgramada || fechaFin) && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 0 }} alignItems="center"
                divider={<Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, mx: 2.5, color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>|</Box>}
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
                    { label: 'SEG', value: timeLeft.seconds },
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

            {/* Join button (upcoming) */}
            {enlaceReunion && (
              <Stack spacing={1} alignItems="center">
                <PlatformBadge platform={platform} info={platformInfo} />
                <JoinButton
                  enlaceReunion={enlaceReunion}
                  isLive={false}
                  isEnded={false}
                  platform={platform}
                  info={platformInfo}
                />
              </Stack>
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

            {enlaceReunion && (
              <Stack spacing={1.5} alignItems="center">
                <PlatformBadge platform={platform} info={platformInfo} />
                <JoinButton
                  enlaceReunion={enlaceReunion}
                  isLive={true}
                  isEnded={false}
                  platform={platform}
                  info={platformInfo}
                />
              </Stack>
            )}
          </>
        )}
      </Stack>

      <style>{`
        @keyframes livePulse {
          0%   { transform: scale(1);   opacity: 1; }
          50%  { transform: scale(1.6); opacity: 0.4; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes buttonPulse {
          0%   { opacity: 0.8; transform: scale(1); }
          50%  { opacity: 0.2; transform: scale(1.06); }
          100% { opacity: 0.8; transform: scale(1); }
        }
      `}</style>
    </Paper>
  )
}

export default LiveLessonPlaceholder
