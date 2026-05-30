'use client'

import { useState, useMemo, useEffect } from 'react'

import { useSearchParams } from 'next/navigation'

import {
  Box,
  Container,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  Chip,
  Fade,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  Badge,
  Fab
} from '@mui/material'

import CourseList from './CourseList'
import { useCart } from '../../cart/context/CartContext'

interface Category {
  id: string
  nombre: string
  slug: string
}

interface CourseCatalogProps {
  courses: any[]
  categories: Category[]
}

const CourseCatalog = ({ courses, categories }: CourseCatalogProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [selectedModality, setSelectedModality] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const { itemCount, setIsCartDrawerOpen } = useCart()

  const searchParams = useSearchParams()

  // Sincronizar selectedCategory con la URL
  useEffect(() => {
    const catId = searchParams.get('categoria')

    if (catId) {
      setSelectedCategory(catId)
    } else {
      setSelectedCategory('all')
    }
  }, [searchParams])

  const filteredAndSortedCourses = useMemo(() => {
    const filtered = courses.filter(course => {
      const matchesSearch = course.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.descripcion && course.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = selectedCategory === 'all' || course.categoria?.slug === selectedCategory

      const matchesLevel = selectedLevel === 'all' ||
        (selectedLevel === 'none' ? !course.nivel : course.nivel === selectedLevel)

      const matchesPrice = selectedPrice === 'all' ||
        (selectedPrice === 'free' ? course.es_gratis : !course.es_gratis)

      const matchesModality = selectedModality === 'all' || course.tipo_emision === selectedModality

      return matchesSearch && matchesCategory && matchesLevel && matchesPrice && matchesModality
    })

    // Aplicar ordenamiento
    return [...filtered].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
      } else if (sortBy === 'alphabetical') {
        return a.titulo.localeCompare(b.titulo)
      }

      return 0
    })
  }, [courses, searchTerm, selectedCategory, selectedLevel, selectedPrice, selectedModality, sortBy])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedLevel('all')
    setSelectedPrice('all')
    setSelectedModality('all')
    setSortBy('recent')
  }

  const hasFilters = searchTerm !== '' ||
    selectedCategory !== 'all' ||
    selectedLevel !== 'all' ||
    selectedPrice !== 'all' ||
    selectedModality !== 'all' ||
    sortBy !== 'recent'



  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 10 }}>
      <Container maxWidth={false} sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, sm: 4, md: 8, lg: 12 } }}>
        <Stack spacing={5}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, color: '#1e293b', letterSpacing: '-0.03em' }}>
              Nuestros Cursos
            </Typography>
            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 500, maxWidth: 600, mx: 'auto' }}>
              Aprende de expertos y potencia tu carrera profesional con nuestra selección premium.
            </Typography>
          </Box>

          <Stack spacing={4} alignItems="center">
            {/* Search Bar Premium */}
            <TextField
              fullWidth
              placeholder="Buscar por título o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ maxWidth: 800 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="tabler-search" style={{ fontSize: '1.5rem', color: 'var(--mui-palette-primary-main)' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <i className="tabler-x" style={{ fontSize: '1.2rem' }} />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '24px',
                  bgcolor: 'white',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0',
                  '&:hover': {
                    borderColor: 'var(--mui-palette-primary-main)',
                  },
                  '&.Mui-focused': {
                    borderColor: 'var(--mui-palette-primary-main)',
                    boxShadow: '0 0 0 4px rgb(var(--mui-palette-primary-mainChannel) / 0.1)',
                  },
                  transition: 'all 0.3s ease',
                  '& fieldset': { border: 'none' },
                  px: 2,
                  height: 64,
                  fontSize: '1.1rem'
                }
              }}
            />

            {/* Filter Bar Premium */}
            <Box sx={{
              position: 'relative',
              width: { xs: '100vw', md: '100%' },
              ml: { xs: 'calc(50% - 50vw)', md: 0 }
            }}>
              <Box sx={{
                width: '100%',
                display: 'flex',
                flexWrap: { xs: 'nowrap', md: 'wrap' },
                overflowX: { xs: 'auto', md: 'visible' },
                gap: { xs: 2, md: 1.5 },
                justifyContent: { xs: 'flex-start', md: 'center' },
                alignItems: 'center',
                px: { xs: 2, sm: 4, md: 2 },
                py: 2,
                bgcolor: 'white',
                borderRadius: { xs: 0, md: '28px' },
                boxShadow: '0 4px 25px rgba(0,0,0,0.03)',
                border: '1px solid #f1f5f9',
                borderInline: { xs: 'none', md: '1px solid #f1f5f9' },
                scrollPaddingLeft: { xs: '16px', sm: '32px', md: 0 },
                MsOverflowStyle: 'none',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
              }}>
                {/* Categoría */}
                <TextField
                  select
                  size="small"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="tabler-category" style={{ color: selectedCategory !== 'all' ? 'var(--mui-palette-primary-main)' : '#64748b' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '16px',
                      border: '1.5px solid',
                      borderColor: selectedCategory !== 'all' ? 'var(--mui-palette-primary-main)' : 'transparent',
                      '& fieldset': { border: 'none' },
                      bgcolor: selectedCategory !== 'all' ? 'primary.50' : '#f8fafc',
                      color: selectedCategory !== 'all' ? 'primary.main' : 'inherit',
                      fontWeight: 700,
                      transition: 'all 0.2s ease'
                    }
                  }}
                  sx={{ minWidth: 170, flexShrink: 0 }}
                >
                  <MenuItem value="all">Todas las Categorías</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.slug}>{cat.nombre}</MenuItem>
                  ))}
                </TextField>

                {/* Nivel */}
                <TextField
                  select
                  size="small"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="tabler-chart-bar" style={{ color: selectedLevel !== 'all' ? 'var(--mui-palette-primary-main)' : '#64748b' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '16px',
                      border: '1.5px solid',
                      borderColor: selectedLevel !== 'all' ? 'var(--mui-palette-primary-main)' : 'transparent',
                      '& fieldset': { border: 'none' },
                      bgcolor: selectedLevel !== 'all' ? 'primary.50' : '#f8fafc',
                      color: selectedLevel !== 'all' ? 'primary.main' : 'inherit',
                      fontWeight: 700,
                      transition: 'all 0.2s ease'
                    }
                  }}
                  sx={{ minWidth: 140, flexShrink: 0 }}
                >
                  <MenuItem value="all">Todos Niveles</MenuItem>
                  <MenuItem value="BASICO">Básico</MenuItem>
                  <MenuItem value="INTERMEDIO">Intermedio</MenuItem>
                  <MenuItem value="AVANZADO">Avanzado</MenuItem>
                  <MenuItem value="none">Sin nivel</MenuItem>
                </TextField>

                {/* Tipo/Precio */}
                <TextField
                  select
                  size="small"
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="tabler-coin" style={{ color: selectedPrice !== 'all' ? 'var(--mui-palette-primary-main)' : '#64748b' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '16px',
                      border: '1.5px solid',
                      borderColor: selectedPrice !== 'all' ? 'var(--mui-palette-primary-main)' : 'transparent',
                      '& fieldset': { border: 'none' },
                      bgcolor: selectedPrice !== 'all' ? 'primary.50' : '#f8fafc',
                      color: selectedPrice !== 'all' ? 'primary.main' : 'inherit',
                      fontWeight: 700,
                      transition: 'all 0.2s ease'
                    }
                  }}
                  sx={{ minWidth: 130, flexShrink: 0 }}
                >
                  <MenuItem value="all">Tipo / Precio</MenuItem>
                  <MenuItem value="free">Gratuito</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </TextField>

                {/* Modalidad */}
                <TextField
                  select
                  size="small"
                  value={selectedModality}
                  onChange={(e) => setSelectedModality(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="tabler-device-laptop" style={{ color: selectedModality !== 'all' ? 'var(--mui-palette-primary-main)' : '#64748b' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '16px',
                      border: '1.5px solid',
                      borderColor: selectedModality !== 'all' ? 'var(--mui-palette-primary-main)' : 'transparent',
                      '& fieldset': { border: 'none' },
                      bgcolor: selectedModality !== 'all' ? 'primary.50' : '#f8fafc',
                      color: selectedModality !== 'all' ? 'primary.main' : 'inherit',
                      fontWeight: 700,
                      transition: 'all 0.2s ease'
                    }
                  }}
                  sx={{ minWidth: 160, flexShrink: 0 }}
                >
                  <MenuItem value="all">Cualquier Modalidad</MenuItem>
                  <MenuItem value="ASINCRONO">Asincrónico</MenuItem>
                  <MenuItem value="SINCRONO">En Vivo</MenuItem>
                  <MenuItem value="MIXTO">Mixto</MenuItem>
                </TextField>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', md: 'block' } }} />

                {/* Ordenamiento */}
                <TextField
                  select
                  size="small"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="tabler-sort-ascending" style={{ color: 'var(--mui-palette-primary-main)' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      '& fieldset': { border: 'none' },
                      bgcolor: '#ffffff',
                      color: 'var(--mui-palette-primary-main)',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }
                    }
                  }}
                  sx={{ minWidth: 170, flexShrink: 0 }}
                >
                  <MenuItem value="recent">Recientes primero</MenuItem>
                  <MenuItem value="alphabetical">A - Z</MenuItem>
                </TextField>

                {hasFilters && (
                  <Tooltip title="Limpiar todos los filtros">
                    <IconButton
                      onClick={clearFilters}
                      sx={{
                        bgcolor: 'error.50',
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.100' },
                        flexShrink: 0,
                        width: 40,
                        height: 40
                      }}
                    >
                      <i className="tabler-refresh" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {/* Fading overlay on the right to indicate scroll */}
              <Box sx={{
                display: { xs: 'block', md: 'none' },
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: 48,
                background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 90%)',
                pointerEvents: 'none',
                zIndex: 2
              }} />
            </Box>
          </Stack>

          <Fade in={true} timeout={1000}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 3, px: 1 }}>
                <Chip
                  label={`${filteredAndSortedCourses.length} cursos disponibles`}
                  size="small"
                  sx={{ bgcolor: 'white', fontWeight: 700, color: 'text.secondary', border: '1px solid #e2e8f0', px: 1 }}
                />
              </Stack>
              <CourseList courses={filteredAndSortedCourses} />
            </Box>
          </Fade>
        </Stack>
      </Container>

      {/* Carrito Flotante */}
      <Fab
        color="primary"
        aria-label="cart"
        onClick={() => setIsCartDrawerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          boxShadow: '0 8px 32px rgba(var(--mui-palette-primary-mainChannel) / 0.4)',
          height: 70,
          width: 70,
          '&:hover': { transform: 'scale(1.1)' },
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        <Badge badgeContent={itemCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.9rem', height: 24, minWidth: 24, borderRadius: 12, fontWeight: 800 } }}>
          <i className="tabler-shopping-cart" style={{ fontSize: '2rem' }} />
        </Badge>
      </Fab>
    </Box>
  )
}

export default CourseCatalog
