'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material'

type Rect = { top: number; left: number; width: number; height: number }

type CertificateGuideSpotlightProps = {
  open: boolean
  onClose: () => void
}

const TARGET_SELECTOR = '[data-certificado-sidebar]'
const TIP_WIDTH = 280
const ARROW_SIZE = 36
const GAP = 10

const CertificateGuideSpotlight = ({ open, onClose }: CertificateGuideSpotlightProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  const tipRef = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<Rect | null>(null)
  const [tipHeight, setTipHeight] = useState(160)

  useEffect(() => {
    if (!open) {
      setRect(null)

      return
    }

    let cancelled = false
    let tries = 0

    const measure = () => {
      const el = document.querySelector(TARGET_SELECTOR) as HTMLElement | null

      if (!el) {
        tries += 1
        if (tries < 25) window.setTimeout(measure, 80)

        return
      }

      el.scrollIntoView({
        behavior: 'smooth',
        block: isMobile ? 'end' : 'center',
        inline: 'nearest',
      })

      window.setTimeout(() => {
        if (cancelled) return
        const r = el.getBoundingClientRect()

        setRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        })
      }, 320)
    }

    measure()

    const onResize = () => {
      const el = document.querySelector(TARGET_SELECTOR) as HTMLElement | null

      if (!el) return
      const r = el.getBoundingClientRect()

      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)

    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [open, isMobile])

  useLayoutEffect(() => {
    if (!open || !tipRef.current) return
    setTipHeight(tipRef.current.offsetHeight)
  }, [open, rect, isMobile])

  if (!open) return null

  const pad = 8

  const hole = rect
    ? {
        top: Math.max(8, rect.top - pad),
        left: Math.max(8, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null

  const placeAbove = isMobile || !hole || hole.left < TIP_WIDTH + 72

  let tipTop = 24
  let tipLeft = 24

  if (typeof window !== 'undefined') {
    tipLeft = Math.max(16, (window.innerWidth - Math.min(TIP_WIDTH, window.innerWidth - 32)) / 2)
  }

  if (hole && placeAbove) {
    const needed = tipHeight + ARROW_SIZE + GAP * 2

    tipTop = Math.max(12, hole.top - needed)
    tipLeft = Math.max(16, (window.innerWidth - Math.min(TIP_WIDTH, window.innerWidth - 32)) / 2)
  } else if (hole) {
    tipTop = Math.max(16, hole.top + hole.height / 2 - tipHeight / 2)
    tipLeft = Math.max(16, hole.left - TIP_WIDTH - 56)
  }

  const arrowDown = Boolean(hole && placeAbove)
  const arrowRight = Boolean(hole && !placeAbove && tipLeft + TIP_WIDTH < hole.left)

  // Flecha justo encima del botón, sin cubrirlo
  const arrowDownTop = hole && arrowDown
    ? Math.max(tipTop + tipHeight + 4, hole.top - ARROW_SIZE - GAP)
    : 0

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,

        // Clics pasan al botón resaltado; solo el tip captura eventos
        pointerEvents: 'none',
      }}
    >
      {hole ? (
        <Box
          sx={{
            position: 'fixed',
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            borderRadius: '14px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72)',
            outline: '3px solid #3AB079',
            animation: 'certPulse 1.6s ease-in-out infinite',
            pointerEvents: 'none',
            '@keyframes certPulse': {
              '0%, 100%': { outlineColor: '#3AB079', outlineOffset: 0 },
              '50%': { outlineColor: '#025E44', outlineOffset: 4 },
            },
          }}
        />
      ) : (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(15, 23, 42, 0.55)', pointerEvents: 'none' }} />
      )}

      {hole && arrowDown && (
        <Box
          sx={{
            position: 'fixed',
            top: arrowDownTop,
            left: hole.left + hole.width / 2 - ARROW_SIZE / 2,
            width: ARROW_SIZE,
            height: Math.max(ARROW_SIZE, hole.top - arrowDownTop),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            pointerEvents: 'none',
            zIndex: 1401,
            animation: 'certArrowDown 1.2s ease-in-out infinite',
            '@keyframes certArrowDown': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(5px)' },
            },
          }}
        >
          <Box
            sx={{
              width: 3,
              flex: 1,
              minHeight: 12,
              bgcolor: '#3AB079',
              borderRadius: 2,
              mb: '-2px',
            }}
          />
          <i
            className="tabler-arrow-big-down-filled"
            style={{ fontSize: '2rem', color: '#3AB079', lineHeight: 1 }}
          />
        </Box>
      )}

      {hole && arrowRight && (
        <Box
          sx={{
            position: 'fixed',
            top: hole.top + hole.height / 2 - 18,
            left: tipLeft + TIP_WIDTH,
            width: Math.max(24, hole.left - 12 - (tipLeft + TIP_WIDTH)),
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            pointerEvents: 'none',
            zIndex: 1401,
            animation: 'certArrow 1.2s ease-in-out infinite',
            '@keyframes certArrow': {
              '0%, 100%': { transform: 'translateX(0)' },
              '50%': { transform: 'translateX(6px)' },
            },
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: 3,
              bgcolor: '#3AB079',
              borderRadius: 2,
              mr: '-2px',
            }}
          />
          <i
            className="tabler-arrow-big-right-filled"
            style={{ fontSize: '2rem', color: '#3AB079', lineHeight: 1 }}
          />
        </Box>
      )}

      <Box
        ref={tipRef}
        sx={{
          position: 'fixed',
          top: tipTop,
          left: tipLeft,
          width: TIP_WIDTH,
          maxWidth: 'calc(100vw - 32px)',
          bgcolor: '#fff',
          borderRadius: '16px',
          p: 2.5,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          zIndex: 1401,
          pointerEvents: 'auto',
        }}
      >
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>
          {placeAbove ? 'Tu certificado está aquí ↓' : 'Tu certificado está aquí →'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pulsa <strong>Mi Certificado</strong>
          {placeAbove
            ? ' al final del temario para obtenerlo o descargarlo.'
            : ' al final del temario (panel derecho) para obtenerlo o descargarlo.'}
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: '#025E44',
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#014d36', boxShadow: 'none' },
          }}
        >
          Entendido
        </Button>
      </Box>
    </Box>
  )
}

export default CertificateGuideSpotlight
