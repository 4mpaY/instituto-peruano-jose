'use client'

import type { MouseEvent } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material'
import { styled } from '@mui/material/styles'

import { useCart } from '../../cart/context/CartContext'
import HydratedDate from '@/utils/components/HydratedDate'
import UserAvatar from '@/utils/components/UserAvatar'
import CourseThumbnail from '@/utils/components/CourseThumbnail'

interface CourseCardProps {
  id: string
  titulo: string
  slug: string
  descripcion?: string
  miniatura?: string
  precio: number
  moneda: string
  es_gratis: boolean
  profesor: {
    id?: string
    slug?: string
    nombre: string
    apellido: string
    avatar?: string
  }
  categoria?: {
    nombre: string
  }
  nivel?: string
  tipo_emision?: string
  fecha_inicio?: string | Date | null
  creado_en?: string | Date
  duracion?: string | null
  es_comprado?: boolean
  video_presentacion?: string | null
}

const StyledCard = styled(Card)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '16px',
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
  position: 'relative',
  border: 'none',
  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)'
  }
}))

const CourseCard = ({
  id,
  titulo,
  slug,
  miniatura,
  precio,
  moneda,
  es_gratis,
  profesor,
  categoria,
  nivel,
  tipo_emision,
  fecha_inicio,
  duracion,
  es_comprado,
  video_presentacion
}: CourseCardProps) => {
  const router = useRouter()
  const { addToCart, isInCart } = useCart()

  const inCart = isInCart(id)

  const handleAddToCart = (e: MouseEvent) => {
    e.stopPropagation()
    addToCart({ id, titulo, slug, miniatura, precio, moneda })
  }

  // Formatear nivel para mostrar texto amigable
  const getNivelLabel = (n?: string) => {
    if (n === 'BASICO') return 'Básico'
    if (n === 'INTERMEDIO') return 'Intermedio'
    if (n === 'AVANZADO') return 'Avanzado'

    return n || 'General'
  }

  // Color para el tipo de emisión
  const getTipoColor = (t?: string) => {
    if (t === 'SINCRONO') return '#ef4444' // Rojo para Vivo

    return '#3b82f6' // Azul para otros
  }

  // Solo mostrar fecha para cursos síncronos y mixtos (los asíncronos no tienen fecha relevante)
  const getDisplayDate = () => {
    if (tipo_emision !== 'SINCRONO' && tipo_emision !== 'MIXTO') return null

    if (!fecha_inicio) return null

    const date = new Date(fecha_inicio)

    return (
      <HydratedDate
        date={date}
        format="date"
        options={{
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }}
      />
    )
  }

  const displayDate = getDisplayDate()

  return (
    <StyledCard
      sx={{ border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}
      onClick={() => router.push(`/cursos/${slug}`)}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CourseThumbnail
          src={miniatura}
          title={titulo}
          videoUrl={video_presentacion}
          aspectRatio="16/10.5"
          sx={{ display: 'block' }}
        />

        {/* Badges superiores */}
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
          <Chip
            label={tipo_emision === 'SINCRONO' ? 'Vivo' : 'Asíncrono'}
            sx={{
              bgcolor: getTipoColor(tipo_emision),
              color: 'white',
              fontWeight: 700,
              borderRadius: '12px',
              height: '28px',
              px: 1
            }}
          />
        </Box>

        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
          {es_comprado ? (
            <Chip
              icon={<i className="tabler-circle-check-filled" style={{ fontSize: '1.2rem', color: 'white' }} />}
              label="TU CURSO"
              sx={{
                bgcolor: '#10b981', // green / success
                color: 'white',
                fontWeight: 800,
                borderRadius: '12px',
                height: '28px',
                pl: 0.5,
                pr: 1,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            />
          ) : (
            <Chip
              label={getNivelLabel(nivel)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 700,
                borderRadius: '12px',
                height: '28px',
                px: 1,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
            />
          )}
        </Box>

      </Box>

      <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box>
          {categoria && (
            <Chip
              label={categoria.nombre}
              size="small"
              sx={{
                bgcolor: 'primary.50',
                color: 'primary.main',
                fontWeight: 700,
                mb: 1,
                borderRadius: '6px',
                fontSize: '0.65rem',
                textTransform: 'uppercase'
              }}
            />
          )}
          <Typography
            variant="h6"
            component={Link}
            href={`/cursos/${slug}`}
            sx={{
              fontWeight: 800,
              lineHeight: 1.2,
              mb: 0.5,
              color: '#1e293b',
              textDecoration: 'none',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '1.1rem',
              minHeight: '44px',
              transition: 'color 0.2s',
              '&:hover': { color: 'primary.main' }
            }}
          >
            {titulo}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              mb: 2,
              zIndex: 10,
              '&:hover': {
                '& .profesor-name': { color: 'primary.main' },
                '& .profesor-avatar': { transform: 'scale(1.1)' }
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (profesor.slug) router.push(`/docentes/${profesor.slug}`)
            }}
          >
            <UserAvatar
              src={profesor.avatar}
              name={profesor.nombre}
              apellido={profesor.apellido}
              size={24}
              className="profesor-avatar"
              sx={{
                border: '1px solid #e2e8f0',
                transition: 'transform 0.2s'
              }}
            />
            <Typography
              variant="body2"
              className="profesor-name"
              sx={{
                color: '#334155',
                fontWeight: 700,
                transition: 'color 0.2s'
              }}
            >
              Por {profesor.nombre} {profesor.apellido}
            </Typography>
          </Stack>

          {(displayDate || duracion) && (
            <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
              {displayDate && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <i className="tabler-calendar" style={{ fontSize: '1.2rem', color: '#10b981' }} />
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                    {displayDate}
                  </Typography>
                </Stack>
              )}
              {duracion && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <i className="tabler-clock" style={{ fontSize: '1.2rem', color: '#10b981' }} />
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                    {duracion}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}

          <Typography variant="h5" sx={{ fontWeight: 800, color: es_comprado ? '#10b981' : 'primary.main', mb: 0 }}>
            {es_comprado ? 'Adquirido' : (es_gratis ? 'Gratis' : `${moneda} ${precio}`)}
          </Typography>
        </Box>

        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            component={Link}
            href={es_comprado ? `/estudiante/aprender/${slug}` : `/cursos/${slug}`}
            variant="contained"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1.5,
              height: 50,
              bgcolor: 'primary.main',
              boxShadow: '0 4px 14px 0 rgba(var(--mui-palette-primary-mainChannel) / 0.39)',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: '0 6px 20px rgba(var(--mui-palette-primary-mainChannel) / 0.23)'
              },
              flexGrow: 1
            }}
          >
            {es_comprado ? 'Seguir aprendiendo' : 'Ir a matricularse'}
          </Button>

          {!es_comprado && (
            <Tooltip title={inCart ? 'En el carrito' : 'Añadir al carrito'}>
              <IconButton
                onClick={handleAddToCart}
                disabled={inCart}
                sx={{
                  borderRadius: '12px',
                  bgcolor: inCart ? 'success.50' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)',
                  color: inCart ? 'success.main' : 'primary.main',
                  width: 50,
                  height: 50,
                  border: '1px solid',
                  borderColor: inCart ? 'success.200' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: inCart ? 'success.100' : 'rgba(var(--mui-palette-primary-mainChannel) / 0.15)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  },
                  '& .tabler-shopping-cart-plus, & .tabler-shopping-cart-check': {
                    fontSize: '1.4rem'
                  }
                }}
              >
                <i className={inCart ? 'tabler-shopping-cart-check' : 'tabler-shopping-cart-plus'} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </StyledCard>
  )
}

export default CourseCard
