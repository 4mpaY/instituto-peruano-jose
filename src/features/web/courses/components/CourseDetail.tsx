'use client'

import { Fragment, useState } from 'react'

import Link from 'next/link'

import { useRouter } from 'next/navigation'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import { CheckCircle, ChevronRight, Download, Play, XCircle } from 'lucide-react'

import { useSession } from 'next-auth/react'

import CourseThumbnail from '@/utils/components/CourseThumbnail'
import HydratedDate from '@/utils/components/HydratedDate'
import UserAvatar from '@/utils/components/UserAvatar'
import VideoPlayer from '@/features/estudiante/player/components/VideoPlayer'
import { useAuthModal } from '@/contexts/AuthModalContext'


interface Leccion {
  id: string
  titulo: string
  duracion?: number
}

interface Modulo {
  id: string
  titulo: string
  lecciones: Leccion[]
}

interface CourseDetailProps {
  course: {
    id: string
    titulo: string
    slug: string
    descripcion?: string
    miniatura?: string
    precio: number
    precio_falso: number
    moneda: string
    es_gratis: boolean
    es_comprado?: boolean
    nivel: string
    tipo_emision: string
    profesor: {
      id: string
      slug: string
      nombre: string
      apellido: string
      avatar?: string
      cargo?: string
      biografia?: string
    }
    categoria?: { nombre: string }
    video_presentacion?: string | null
    duracion?: string | null
    fecha_inicio?: string | Date | null
    fecha_fin?: string | Date | null
    creado_en?: string | Date
    modulos: Modulo[]
    objetivos?: string[]
    metodologia?: any[]
    beneficios?: any[]
    incluye?: any[]
    brochure?: string | null
  }
}

const FONT = "'Inter', 'Helvetica Neue', Arial, sans-serif"

const CourseDetail = ({ course }: CourseDetailProps) => {
  const [previewLesson, setPreviewLesson] = useState<any>(null)
  const [enrolling, setEnrolling] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { openLogin } = useAuthModal()

  const handleFreeEnroll = async () => {
    if (!session) {
      openLogin()

      return
    }

    setEnrolling(true)

    try {
      const res = await fetch('/api/estudiante/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursoId: course.id })
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/estudiante/aprender/${course.slug}`)
      } else {
        // Si ya está inscrito, igualmente redirigir
        if (res.status === 400 && data.message?.includes('Ya estás inscrito')) {
          router.push(`/estudiante/aprender/${course.slug}`)
        }
      }
    } finally {
      setEnrolling(false)
    }
  }

  const handleEnroll = () => {
    if (!session) {
      openLogin()

      return
    }

    router.push(`/checkout/${course.slug}`)
  }

  // Helper para obtener el ID de video y la URL de embebido
  const getEmbedUrl = (url?: string | null) => {
    if (!url) return null
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)

    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0&rel=0`

    const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)

    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=0`

    return null
  }

  const embedUrl = getEmbedUrl(course.video_presentacion)

  const isLive = course.tipo_emision === 'SINCRONO' || course.tipo_emision === 'MIXTO'

  const displayDate = isLive
    ? {
        label: 'Inicio',
        value: course.fecha_inicio
          ? <HydratedDate date={course.fecha_inicio} format="date" options={{ day: '2-digit', month: '2-digit', year: 'numeric' }} />
          : 'Próximamente'
      }
    : null

  const defaultBeneficios = [
    { title: 'Clase en vivo', desc: 'Clases 100% en vivo por Zoom.', icon: 'tabler-video' },
    { title: 'Seguimiento personalizado', desc: 'Apoyo y soporte de la coordinadora.', icon: 'tabler-headset' },
    { title: 'Plataforma virtual', desc: 'Acceso 24/7 durante el programa.', icon: 'tabler-device-laptop' },
    { title: 'Certificado Opcional', desc: 'Solicítalo al finalizar el curso.', icon: 'tabler-certificate' },
  ]

  const defaultMetodologia = [
    { title: 'Presentación de clase', icon: 'tabler-presentation' },
    { title: 'Material de clases y adicionales', icon: 'tabler-folder' },
    { title: 'Resolución de casos reales', icon: 'tabler-messages' },
  ]

  const defaultObjetivos = [
    'Aplicar metodologías avanzadas para transformar procesos reales.',
    'Aprender flujos de trabajo eficientes desde el inicio hasta el despliegue.',
    'Identificar causas raíz y optimizar el rendimiento con herramientas modernas.',
  ]

  const defaultIncluye = [
    { text: 'Clases en vivo', active: true },
    { text: 'Clases grabadas', active: true },
    { text: 'Comunidad del curso', active: true },
    { text: 'Materiales y adicionales', active: true },
    { text: 'Seguimiento académico', active: true },
    { text: 'Evaluación programada', active: true },
    { text: 'Evaluación en cualquier momento', active: false },
    { text: 'Recuperación de evaluación', active: false },
    { text: 'Certificado por Ecoambiental o CIP', active: false },
  ]

  return (
    <Box sx={{ pb: 10, bgcolor: '#f8fafc' }}>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative',
        background: 'linear-gradient(135deg, var(--web-dark-deep, #012d22) 0%, var(--web-dark, #025E44) 45%, var(--web-dark-mid, #0f4438) 100%)',
        pt: { xs: 4, md: 6 },
        pb: { xs: 8, md: 14 },
        minHeight: { md: '600px' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Blurred miniatura */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: course.miniatura ? `url(${course.miniatura})` : 'none',
          backgroundColor: 'var(--web-dark-deep, #012d22)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(60px)', opacity: 0.25, transform: 'scale(1.2)', zIndex: 0,
        }} />
        {/* Grid overlay */}
        <Box aria-hidden sx={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Dark overlay */}
        <Box sx={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)',
        }} />

        <Container maxWidth={false} sx={{ px: { xs: 3, md: 8, lg: 12 }, position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {[
              { label: 'Inicio', href: '/' },
              { label: 'Cursos', href: '/cursos' },
              ...(course.categoria ? [{ label: course.categoria.nombre, href: null }] : []),
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.href ? (
                  <Link href={item.href} style={{ fontFamily: FONT, fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
                    {item.label}
                  </Link>
                ) : (
                  <span style={{ fontFamily: FONT, fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>{item.label}</span>
                )}
                <ChevronRight size={12} color="rgba(255,255,255,0.3)" />
              </Box>
            ))}
            <span style={{ fontFamily: FONT, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--web-light, #BDD962)' }}>
              {course.titulo}
            </span>
          </Box>

          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            {/* Miniatura / Video */}
            <Grid item xs={12} md={6}>
              <Box sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', aspectRatio: '16/9', position: 'relative' }}>
                {embedUrl ? (
                  <iframe src={embedUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" title={course.titulo} />
                ) : (
                  <CourseThumbnail src={course.miniatura} title={course.titulo} aspectRatio="16/9" />
                )}
                {course.es_gratis && (
                  <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <Chip label="GRATUITO" sx={{ fontFamily: FONT, fontWeight: 800, fontSize: '0.7rem', bgcolor: 'var(--web-light, #BDD962)', color: '#0A0A0A' }} />
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Info */}
            <Grid item xs={12} md={6}>
              <Stack spacing={2.5}>
                {/* Chips nivel/tipo */}
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {course.es_comprado ? (
                    <Chip
                      icon={<i className="tabler-circle-check-filled" style={{ fontSize: '1rem', color: '#0A0A0A' }} />}
                      label="Tu Curso"
                      sx={{ fontFamily: FONT, fontWeight: 800, fontSize: '0.75rem', bgcolor: 'var(--web-light, #BDD962)', color: '#0A0A0A', borderRadius: '8px' }}
                    />
                  ) : (
                    <Chip label={course.nivel === 'BASICO' ? 'Básico' : course.nivel === 'INTERMEDIO' ? 'Intermedio' : 'Avanzado'}
                      sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.75rem', bgcolor: 'rgba(var(--web-light-rgb, 189,217,98),0.15)', color: 'var(--web-light, #BDD962)', borderRadius: '8px', border: '1px solid rgba(var(--web-light-rgb,189,217,98),0.3)' }} />
                  )}
                  <Chip label={course.tipo_emision === 'SINCRONO' ? 'Sincrónico' : course.tipo_emision === 'MIXTO' ? 'Mixto' : 'Grabado'}
                    sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }} />
                </Stack>

                {/* Título */}
                <Typography sx={{ fontFamily: FONT, fontWeight: 900, fontSize: { xs: '2rem', md: '2.75rem' }, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  {course.titulo}
                </Typography>

                {/* Docente + Fecha + Duración */}
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <UserAvatar src={course.profesor.avatar} name={course.profesor.nombre} apellido={course.profesor.apellido} size={44}
                        sx={{ border: '2px solid rgba(var(--web-light-rgb, 189,217,98),0.4)', bgcolor: 'rgba(255,255,255,0.08)' }} />
                      <Box>
                        <Typography sx={{ fontFamily: FONT, fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>Docente</Typography>
                        {course.profesor.slug ? (
                          <Link href={`/docentes/${course.profesor.slug}`} style={{ fontFamily: FONT, fontWeight: 800, fontSize: '0.9375rem', color: 'var(--web-light, #BDD962)', textDecoration: 'none' }}>
                            {course.profesor.nombre} {course.profesor.apellido}
                          </Link>
                        ) : (
                          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: '0.9375rem', color: 'var(--web-light, #BDD962)' }}>
                            {course.profesor.nombre} {course.profesor.apellido}
                          </span>
                        )}
                      </Box>
                    </Stack>
                  </Grid>
                  {displayDate && (
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '12px', p: 1.5, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Typography sx={{ fontFamily: FONT, fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{displayDate.label}</Typography>
                        <Typography sx={{ fontFamily: FONT, fontSize: '0.9rem', color: '#fff', fontWeight: 700, mt: 0.25 }}>{displayDate.value}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {course.duracion && (
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', width: 44, height: 44 }}>
                          <i className="tabler-clock" style={{ fontSize: '1.4rem' }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }} display="block">Duración</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>{course.duracion}</Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  )}
                  {isLive && course.fecha_fin && (
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '12px', p: 1.5, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Typography sx={{ fontFamily: FONT, fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fin</Typography>
                        <Typography sx={{ fontFamily: FONT, fontSize: '0.9rem', color: '#fff', fontWeight: 700, mt: 0.25 }}>
                          <HydratedDate date={course.fecha_fin} format="date" options={{ day: '2-digit', month: '2-digit', year: 'numeric' }} />
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {/* Precio */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 900, fontSize: { xs: '2.5rem', md: '3rem' }, color: 'var(--web-light, #BDD962)', lineHeight: 1 }}>
                    {course.es_comprado ? 'Adquirido' : course.es_gratis ? 'Gratis' : `${course.moneda} ${course.precio}`}
                  </Typography>
                  {!course.es_gratis && !course.es_comprado && (
                    <Typography sx={{ fontFamily: FONT, fontSize: '1rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>
                      {course.moneda}{' '}
                      {Number(course.precio_falso) !== 0
                        ? Number(course.precio_falso)
                        : (course.precio * 1.5).toFixed(2)}
                    </Typography>
                  )}
                </Box>

                {course.es_comprado ? (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                    component={Link}
                    href={`/estudiante/aprender/${course.slug}`}
                    sx={{ py: 2, borderRadius: '16px', fontWeight: 700, fontSize: '1.2rem', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)', textTransform: 'none' }}
                  >
                    Seguir aprendiendo
                  </Button>
                ) : course.es_gratis ? (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleFreeEnroll}
                    disabled={enrolling}
                    sx={{ py: 2, borderRadius: '16px', fontWeight: 700, fontSize: '1.2rem', textTransform: 'none' }}
                  >
                    {enrolling ? <CircularProgress size={24} color="inherit" /> : 'Inscribirme gratis'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleEnroll}
                    sx={{ py: 2, borderRadius: '16px', fontWeight: 700, fontSize: '1.2rem', boxShadow: 'var(--mui-palette-primary-darkOpacity)', textTransform: 'none' }}
                  >
                    Matricúlate
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>

          {/* Beneficios Cards */}
          <Grid container spacing={2} sx={{ mt: 6 }}>
            {(course.beneficios?.length ? course.beneficios : defaultBeneficios).map((item, i) => (
              <Grid item xs={6} sm={6} md={3} key={i}>
                <Box sx={{
                  p: { xs: 2, md: 2.5 }, borderRadius: '16px', textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'background-color 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.09)' },
                }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(var(--web-light-rgb,189,217,98),0.12)', color: 'var(--web-light, #BDD962)', mx: 'auto', mb: 1.5 }}>
                    <i className={item.icon?.startsWith('tabler-') ? item.icon : `tabler-${item.icon}`} style={{ fontSize: '1.375rem' }} />
                  </Box>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: { xs: '0.8rem', md: '0.9rem' }, color: '#fff', lineHeight: 1.3, mb: 0.5 }}>{item.title}</Typography>
                  <Typography sx={{ fontFamily: FONT, fontSize: { xs: '0.7rem', md: '0.8125rem' }, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{item.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── CONTENIDO ─────────────────────────────────────────────────────── */}
      <Container maxWidth={false} sx={{ mt: 6, px: { xs: 3, md: 8, lg: 12 } }}>
        <Grid container spacing={4}>

          {/* ── Columna principal ── */}
          <Grid item xs={12} md={8}>
            <Stack spacing={5}>

              {/* Descripción */}
              {course.descripcion && (
                <Box>
                  <SectionTitle>Acerca del curso</SectionTitle>
                  <Typography sx={{ fontFamily: FONT, fontSize: '1rem', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {course.descripcion}
                  </Typography>
                </Box>
              )}

              {/* Metodología */}
              <Box sx={{ bgcolor: '#fff', borderRadius: '20px', p: { xs: 3, md: 5 }, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <Typography sx={{ fontFamily: FONT, fontWeight: 900, fontSize: '1.5rem', color: '#0A0A0A', textAlign: 'center', mb: 0.5 }}>
                  Metodología de Aprendizaje
                </Typography>
                <Typography sx={{ fontFamily: FONT, fontSize: '0.9375rem', color: '#64748b', textAlign: 'center', mb: 4 }}>
                  Basado en la experiencia del profesional
                </Typography>
                <Grid container spacing={2}>
                  {(course.metodologia?.length ? course.metodologia : defaultMetodologia).map((m, i) => (
                    <Grid item xs={12} md={4} key={i}>
                      <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'rgba(var(--web-primary-rgb,37,146,127),0.1)', color: 'var(--web-primary, #25927F)', width: 60, height: 60 }}>
                          <i className={m.icon?.startsWith('tabler-') ? m.icon : `tabler-${m.icon}`} style={{ fontSize: '2rem' }} />
                        </Avatar>
                        <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.3 }}>{m.title}</Typography>
                        {m.desc && <Typography sx={{ fontFamily: FONT, fontSize: '0.8125rem', color: '#64748b' }}>{m.desc}</Typography>}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Objetivos */}
              <Box>
                <SectionTitle>Objetivos del curso</SectionTitle>
                <Stack spacing={1.5}>
                  {(course.objetivos?.length ? course.objetivos : defaultObjetivos).map((text, i) => (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                      <Box sx={{ mt: '2px', flexShrink: 0 }}>
                        <CheckCircle size={20} color="var(--web-primary, #25927F)" />
                      </Box>
                      <Typography sx={{ fontFamily: FONT, fontSize: '0.9375rem', color: '#334155', lineHeight: 1.6 }}>{text}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              {/* Contenido del curso */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
                  <SectionTitle sx={{ mb: 0 }}>Contenido del curso</SectionTitle>
                  {course.brochure && (
                    <Button
                      variant="outlined"
                      size="small"
                      component="a"
                      href={course.brochure}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<Download size={16} />}
                      sx={{
                        fontFamily: FONT, fontWeight: 700, fontSize: '0.8125rem', borderRadius: '10px',
                        textTransform: 'none', borderColor: 'var(--web-primary, #25927F)', color: 'var(--web-primary, #25927F)',
                        '&:hover': { borderColor: 'var(--web-dark, #025E44)', bgcolor: 'rgba(var(--web-primary-rgb,37,146,127),0.05)' },
                      }}
                    >
                      Descargar Brochure
                    </Button>
                  )}
                </Stack>

                {course.modulos.length > 0 ? (
                  <Stack spacing={1}>
                    {course.modulos
                      .filter(m => m.lecciones.some(l => (l as any).estado !== 'BORRADOR'))
                      .map((modulo, idx) => (
                        <Accordion key={modulo.id} defaultExpanded={idx === 0} sx={{ borderRadius: '14px !important', boxShadow: 'none', border: '1px solid #e2e8f0', bgcolor: 'white', '&:before': { display: 'none' } }}>
                          <AccordionSummary expandIcon={<i className="tabler-chevron-down" style={{ color: 'var(--web-primary, #25927F)' }} />} sx={{ px: 3, py: 1 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(var(--web-primary-rgb,37,146,127),0.1)', color: 'var(--web-primary, #25927F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: '0.8125rem' }}>
                                {idx + 1}
                              </Box>
                              <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.9375rem' }}>{modulo.titulo}</Typography>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 0 }}>
                            <List disablePadding>
                              {modulo.lecciones
                                .filter(l => (l as any).estado !== 'BORRADOR')
                                .map(leccion => (
                                  <Fragment key={leccion.id}>
                                    <Divider />
                                    <ListItem
                                      sx={{ py: 1.5, px: 3, cursor: (leccion as any).es_vista_previa ? 'pointer' : 'default', '&:hover': (leccion as any).es_vista_previa ? { bgcolor: 'rgba(var(--web-primary-rgb,37,146,127),0.04)' } : {} }}
                                      onClick={() => { if ((leccion as any).es_vista_previa) setPreviewLesson(leccion) }}
                                    >
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Play size={16} color={(leccion as any).es_vista_previa ? 'var(--web-primary, #25927F)' : '#cbd5e1'} />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={
                                          <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography sx={{ fontFamily: FONT, fontWeight: 600, fontSize: '0.875rem' }}>{leccion.titulo}</Typography>
                                            {(leccion as any).es_vista_previa && (
                                              <Chip size="small" label="Vista previa" sx={{ fontFamily: FONT, height: 20, fontSize: '0.625rem', fontWeight: 700, bgcolor: 'rgba(var(--web-primary-rgb,37,146,127),0.1)', color: 'var(--web-primary, #25927F)' }} />
                                            )}
                                          </Stack>
                                        }
                                      />
                                      {leccion.duracion && (
                                        <Typography sx={{ fontFamily: FONT, fontSize: '0.75rem', color: '#94a3b8' }}>{leccion.duracion} min</Typography>
                                      )}
                                    </ListItem>
                                  </Fragment>
                                ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                  </Stack>
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'white', borderRadius: '14px', border: '1px dashed #e2e8f0', boxShadow: 'none' }}>
                    <Typography sx={{ fontFamily: FONT, color: '#94a3b8', fontStyle: 'italic' }}>Aún no hay módulos publicados.</Typography>
                  </Paper>
                )}
              </Box>
            </Stack>
          </Grid>

          {/* ── Sidebar ── */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: { md: 'sticky' }, top: 100 }}>
              <Paper sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                {/* Header */}
                <Box sx={{ background: 'linear-gradient(135deg, var(--web-dark, #025E44), var(--web-primary, #25927F))', p: 3, textAlign: 'center' }}>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5 }}>
                    Programa {course.es_gratis ? 'Gratuito' : 'Premium'}
                  </Typography>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 900, fontSize: '2rem', color: 'var(--web-light, #BDD962)', lineHeight: 1 }}>
                    {course.es_comprado ? 'Adquirido' : course.es_gratis ? 'Gratis' : `${course.moneda} ${course.precio}`}
                  </Typography>
                </Box>

                {/* Incluye */}
                <Box sx={{ p: 3 }}>
                  <Stack spacing={1.25} sx={{ mb: 3 }}>
                    {(course.incluye?.length ? course.incluye : defaultIncluye).map((item, i) => (
                      <Stack key={i} direction="row" spacing={1.25} alignItems="center">
                        {item.active
                          ? <CheckCircle size={18} color="var(--web-primary, #25927F)" />
                          : <XCircle size={18} color="#cbd5e1" />}
                        <Typography sx={{ fontFamily: FONT, fontSize: '0.875rem', color: item.active ? '#1e293b' : '#94a3b8', fontWeight: item.active ? 600 : 400 }}>
                          {item.text}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  {course.es_comprado ? (
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      size="large"
                      component={Link}
                      href={`/estudiante/aprender/${course.slug}`}
                      sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)', textTransform: 'none' }}
                    >
                      Seguir aprendiendo
                    </Button>
                  ) : course.es_gratis ? (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      onClick={handleFreeEnroll}
                      disabled={enrolling}
                      sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
                    >
                      {enrolling ? <CircularProgress size={22} color="inherit" /> : 'Inscribirme gratis'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      onClick={handleEnroll}
                      sx={{ py: 1.5, borderRadius: '12px', fontWeight: 700, boxShadow: 'var(--mui-palette-primary-darkOpacity)', textTransform: 'none' }}
                    >
                      Matricúlate
                    </Button>
                  )}
                </Box>
              </Paper>
            </Box>
          </Grid>

        </Grid>
      </Container>

      {/* Dialog para la Vista Previa */}
      <Dialog
        open={Boolean(previewLesson)}
        onClose={() => setPreviewLesson(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, bgcolor: 'background.paper', overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            Vista Previa: {previewLesson?.titulo}
          </Typography>
          <IconButton onClick={() => setPreviewLesson(null)} size="small">
            <i className="tabler-x" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: 'black' }}>
          {previewLesson && <VideoPlayer url={(previewLesson as any).video_url} tipo="VIDEO" />}
        </DialogContent>
      </Dialog>

    </Box>
  )
}

// ─── Helper: título de sección ────────────────────────────────────────────────
function SectionTitle({ children, sx = {} }: { children: React.ReactNode; sx?: object }) {
  return (
    <Typography sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.375rem', color: '#0A0A0A', letterSpacing: '-0.01em', mb: 2.5, ...sx }}>
      {children}
    </Typography>
  )
}

export default CourseDetail
