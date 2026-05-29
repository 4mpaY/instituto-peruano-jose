'use client'

import { useState, useEffect, useMemo } from 'react'

import axios from 'axios'
import { toast } from 'react-toastify'
import {
    Box, Grid, useMediaQuery, useTheme,
    Tabs, Tab, Button, Stack, Typography, Chip, Tooltip
} from '@mui/material'

import VideoPlayer from './VideoPlayer'
import CourseContentSidebar from './CourseContentSidebar'
import LessonContent from './LessonContent'
import CommentsSection from './CommentsSection'
import ExamSection from './ExamSection'
import CertificateSection from './CertificateSection'
import CompletionSummary from './CompletionSummary'
import LiveLessonPlaceholder from './LiveLessonPlaceholder'
import RatingModal from './RatingModal'

import { useCourseStore } from '../store/useCourseStore'
import { useConfig } from '@/contexts/ConfigContext'

interface CoursePlayerViewProps {
    course: {
        id: string
        slug: string
        titulo: string
        modulos: any[]
        examenes?: any[]
    }
    initialLessonId?: string
}

const CoursePlayerView = ({ course, initialLessonId }: CoursePlayerViewProps) => {
    const configs = useConfig()
    const waNumber = configs.WHATSAPP_NUMERO || '51959436827'
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
    const [activeTab, setActiveTab] = useState(0)
    const [ratingModalOpen, setRatingModalOpen] = useState(false)

    const {
        course: storeCourse,
        currentLessonId,
        currentView,
        examenId,
        currentExamenId,
        progressPercentage,
        setCourse,
        setCurrentLessonId,
        updateLessonProgress,
        setExamenId,
        setExamStatus,
        openExam
    } = useCourseStore()

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        if (course) {
            setCourse(course)

            const examenFinal = course.examenes?.find((e: any) => e.tipo === 'FINAL' && e.esta_publicado)

            if (examenFinal) setExamenId(examenFinal.id)

            if ((course as any).inscripcion?.estado_nota === 'APROBADO') setExamStatus('passed')
        }
    }, [course, setCourse, setExamenId, setExamStatus])

    useEffect(() => {
        const checkExamStatus = async () => {
            if (!examenId || !storeCourse) return

            try {
                const res = await axios.get(`/api/estudiante/examen/${examenId}`)

                if (res.data.status && res.data.result.yaAprobado) setExamStatus('passed')
            } catch { /* silenced */ }
        }

        if (mounted) checkExamStatus()
    }, [examenId, storeCourse, setExamStatus, mounted])

    useEffect(() => {
        if (initialLessonId && mounted) setCurrentLessonId(initialLessonId)
    }, [initialLessonId, setCurrentLessonId, mounted])

    const flatLessons = useMemo(
        () => storeCourse?.modulos.flatMap(m => m.lecciones) || [],
        [storeCourse?.modulos]
    )


    const currentIndex = useMemo(
        () => flatLessons.findIndex(l => l.id === currentLessonId),
        [flatLessons, currentLessonId]
    )

    const currentLesson = currentIndex >= 0 ? flatLessons[currentIndex] : undefined
    const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : undefined
    const nextLesson = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : undefined

    useEffect(() => {
        if (!mounted) return
        setSidebarOpen(!isMobile)
    }, [isMobile, mounted])

    const handleLessonSelect = (lessonId: string) => {
        setCurrentLessonId(lessonId)
        if (isMobile) setActiveTab(0)
    }

    const handleLessonComplete = async (lessonId: string, completed: boolean = true) => {
        updateLessonProgress(lessonId, completed)

        try {
            const { goToNextLesson: storeGoToNextLesson } = useCourseStore.getState()
            const response = await axios.post('/api/estudiante/progreso', { leccionId: lessonId, estaCompletado: completed })

            if (response.data.status) {
                if (response.data.result?.porcentaje !== undefined) {
                    updateLessonProgress(lessonId, completed, response.data.result.porcentaje)
                }


                if (completed) {
                    toast.success('¡Lección completada!', { position: 'bottom-right', autoClose: 2000, hideProgressBar: true })

                    const isLastLesson = flatLessons.length > 0 && flatLessons[flatLessons.length - 1].id === lessonId

                    if (isLastLesson) {
                        setTimeout(() => setRatingModalOpen(true), 2000)
                    } else {
                        setTimeout(() => storeGoToNextLesson(), 1500)
                    }
                }
            } else {
                updateLessonProgress(lessonId, !completed)
                toast.error('No se pudo actualizar el progreso')
            }
        } catch (error) {
            updateLessonProgress(lessonId, !completed)
            toast.error('Error de conexión al actualizar progreso')
        }
    }

    const handleVideoEnded = () => {
        if (currentLesson && !currentLesson.completada) handleLessonComplete(currentLesson.id, true)
    }

    const handleExamPassed = () => {
        if (currentExamenId === examenId) setExamStatus('passed')
    }

    const handleContinueAfterExam = () => {
        if (!storeCourse || !currentExamenId) return

        const allItems: any[] = []

        storeCourse.modulos.forEach(module => {
            const moduleItems = [
                ...module.lecciones.map((l: any) => ({ ...l, tipo: 'leccion' })),
                ...(storeCourse.examenes || [])
                    .filter((ex: any) => ex.modulo_id === module.id && ex.tipo === 'INTERMEDIO')
                    .map((ex: any) => ({ ...ex, tipo: 'examen' }))
            ].sort((a, b) => (a.orden || 0) - (b.orden || 0))

            allItems.push(...moduleItems)
        })

        const idx = allItems.findIndex(item => item.id === currentExamenId)

        if (idx !== -1 && idx < allItems.length - 1) {
            const nextItem = allItems[idx + 1]

            if (nextItem.tipo === 'leccion') setCurrentLessonId(nextItem.id)
            else openExam(nextItem.id)
        } else {
            const firstLesson = storeCourse.modulos[0]?.lecciones[0]

            if (firstLesson) setCurrentLessonId(firstLesson.id)
        }
    }

    const TABS = ['Sobre el curso', 'Evaluaciones', 'Materiales', 'Certificación', 'Comentarios', ...(isMobile ? ['Temario'] : [])]

    const renderMainContent = () => {
        if (currentView === 'exam' && currentExamenId) {
            return (
                <Grid item xs={12} key="exam-section">
                    <ExamSection
                        examenId={currentExamenId}
                        onExamPassed={handleExamPassed}
                        isFinalExam={currentExamenId === examenId}
                        onContinue={handleContinueAfterExam}
                    />
                </Grid>
            )
        }

        if (currentView === 'completion' && storeCourse) {
            return (
                <Grid item xs={12} key="completion-section">
                    <CompletionSummary cursoId={storeCourse.id} />
                </Grid>
            )
        }

        if (currentView === 'certificate' && storeCourse) {
            return (
                <Grid item xs={12} key="certificate-section">
                    <CertificateSection
                                        cursoId={storeCourse.id}
                                        completarAutomatico={(course as any).completar_automatico ?? false}
                                        onAllLessonsCompleted={() => {
                                            const allLessons = storeCourse.modulos?.flatMap((m: any) => m.lecciones) ?? []

                                            allLessons.forEach((l: any) => updateLessonProgress(l.id, true, 100))
                                        }}
                                    />
                </Grid>
            )
        }

        return (
            <>
                {/* ── Lesson info row ── */}
                {currentLesson && (
                    <Grid item xs={12}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            gap: 1.5,
                            mb: 2,
                        }}>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                                    <Chip
                                        size="small"
                                        label={`Lección ${currentLesson.orden || 1}`}
                                        sx={{
                                            bgcolor: 'rgba(2,94,68,0.08)',
                                            color: '#025E44',
                                            fontWeight: 700,
                                            fontSize: '0.7rem',
                                            height: '22px',
                                            borderRadius: '6px',
                                        }}
                                    />
                                    {currentLesson.completada && (
                                        <Chip
                                            size="small"
                                            icon={<i className="tabler-circle-check-filled" style={{ fontSize: '0.85rem', color: '#2e7d32' }} />}
                                            label="Completada"
                                            sx={{
                                                bgcolor: 'rgba(46,125,50,0.08)',
                                                color: '#2e7d32',
                                                fontWeight: 700,
                                                fontSize: '0.7rem',
                                                height: '22px',
                                                borderRadius: '6px',
                                            }}
                                        />
                                    )}
                                </Stack>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.25, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                                    {currentLesson.titulo}
                                </Typography>
                            </Box>

                            {/* {currentLesson.recursos && currentLesson.recursos.length > 0 && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<i className="tabler-download text-sm" />}
                                    href={currentLesson.recursos[0].url}
                                    target="_blank"
                                    download
                                    sx={{
                                        flexShrink: 0,
                                        bgcolor: '#BDD962',
                                        color: '#0A0A0A',
                                        borderRadius: '20px',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        px: 2.5,
                                        py: 0.75,
                                        boxShadow: 'none',
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: '#adc952', boxShadow: 'none' }
                                    }}
                                >
                                    Descargar material
                                </Button>
                            )} */}
                        </Box>
                    </Grid>
                )}

                {/* ── Video player ── */}
                <Grid item xs={12} key={`video-${currentLesson?.id || 'none'}`}>
                    <Box sx={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        bgcolor: '#0A0A0A',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        position: { xs: 'sticky', md: 'relative' },
                        top: 0,
                        zIndex: 6,
                    }}>
                        {currentLesson?.es_en_vivo ? (
                            <LiveLessonPlaceholder
                                titulo={currentLesson.titulo}
                                esEnVivo={true}
                                fechaProgramada={currentLesson.fecha_programada}
                                enlaceReunion={currentLesson.enlace_reunion}
                            />
                        ) : (
                            <VideoPlayer url={currentLesson?.video_url || undefined} tipo="VIDEO" onEnded={handleVideoEnded} />
                        )}
                    </Box>
                </Grid>

                {/* ── Navigation bar ── */}
                <Grid item xs={12}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1.5,
                        mt: 1,
                        borderTop: '1px solid',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}>
                        <Tooltip title={prevLesson ? prevLesson.titulo : ''}>
                            <span>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={!prevLesson}
                                    onClick={() => prevLesson && handleLessonSelect(prevLesson.id)}
                                    startIcon={<i className="tabler-chevron-left text-base" />}
                                    sx={{
                                        borderRadius: '10px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        px: { xs: 1.5, sm: 2 },
                                        flexShrink: 0,
                                        borderColor: 'divider',
                                        color: 'text.secondary',
                                        '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                                    }}
                                >
                                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Anterior</Box>
                                </Button>
                            </span>
                        </Tooltip>

                        {currentLesson && (
                            <Button
                                fullWidth
                                variant={currentLesson.completada ? 'outlined' : 'contained'}
                                size="small"
                                onClick={() => handleLessonComplete(currentLesson.id, !currentLesson.completada)}
                                startIcon={
                                    <i className={currentLesson.completada
                                        ? 'tabler-circle-check-filled text-base'
                                        : 'tabler-circle-check text-base'
                                    } />
                                }
                                sx={{
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    py: 0.75,
                                    ...(currentLesson.completada
                                        ? { borderColor: 'success.main', color: 'success.main', '&:hover': { bgcolor: 'rgba(46,125,50,0.05)' } }
                                        : { bgcolor: '#025E44', '&:hover': { bgcolor: '#014d36' }, boxShadow: 'none' }
                                    )
                                }}
                            >
                                {currentLesson.completada ? 'Completado' : 'Marcar como completado'}
                            </Button>
                        )}

                        <Tooltip title={nextLesson ? nextLesson.titulo : ''}>
                            <span>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    disabled={!nextLesson}
                                    onClick={() => nextLesson && handleLessonSelect(nextLesson.id)}
                                    endIcon={<i className="tabler-chevron-right text-base" />}
                                    sx={{
                                        borderRadius: '10px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        px: { xs: 1.5, sm: 2 },
                                        flexShrink: 0,
                                        borderColor: 'divider',
                                        color: 'text.secondary',
                                        '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                                    }}
                                >
                                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Siguiente</Box>
                                </Button>
                            </span>
                        </Tooltip>
                    </Box>
                </Grid>

                {/* ── Tabs ── */}
                <Grid item xs={12} sx={{ position: { xs: 'sticky', md: 'relative' }, top: { xs: 'calc((100vw * 9)/16)', md: 0 }, zIndex: 5, bgcolor: 'background.paper' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                minHeight: '48px',
                                px: { xs: 2, sm: 3 },
                                color: 'text.secondary',
                                '&.Mui-selected': { color: '#025E44', fontWeight: 700 }
                            },
                            '& .MuiTabs-indicator': { bgcolor: '#025E44', height: '2.5px', borderRadius: '2px 2px 0 0' }
                        }}
                    >
                        {TABS.map((label) => <Tab key={label} label={label} />)}
                    </Tabs>
                </Grid>

                {/* ── Tab content ── */}
                <Grid item xs={12} sx={{ pt: 2, pb: { xs: 10, md: 4 }, px: { xs: 1, sm: 0 } }}>

                    {/* Sobre el curso */}
                    {activeTab === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {(course as any).descripcion && (
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Descripción del curso</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                                        {(course as any).descripcion}
                                    </Typography>
                                </Box>
                            )}
                            {(course as any).que_aprenderas && (
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>¿Qué aprenderás?</Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                                        {(course as any).que_aprenderas.split('\n').filter(Boolean).map((item: string, i: number) => (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <i className="tabler-circle-check-filled" style={{ color: '#025E44', fontSize: '1rem', marginTop: '2px', flexShrink: 0 }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.trim()}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                            {(course as any).a_quien_va_dirigido && (
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>¿A quién va dirigido?</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                                        {(course as any).a_quien_va_dirigido}
                                    </Typography>
                                </Box>
                            )}
                            {currentLesson?.contenido && (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <Box sx={{ width: 3, height: 18, bgcolor: '#025E44', borderRadius: 2 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Contenido de esta lección</Typography>
                                    </Box>
                                    <LessonContent titulo="" descripcion={currentLesson.contenido} recursos={[]} />
                                </Box>
                            )}
                            {!(course as any).descripcion && !(course as any).que_aprenderas && !currentLesson?.contenido && (
                                <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: '16px' }}>
                                    <i className="tabler-book-off text-3xl" style={{ opacity: 0.3 }} />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>No hay información disponible para este curso.</Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Evaluaciones */}
                    {activeTab === 1 && (() => {
                        const allExams = storeCourse?.examenes || []

                        if (allExams.length === 0) {
                            return (
                                <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: '16px' }}>
                                    <i className="tabler-clipboard-off text-3xl" style={{ opacity: 0.3 }} />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>No hay evaluaciones disponibles.</Typography>
                                </Box>
                            )
                        }

                        const byModule: Record<string, any[]> = {}
                        const finals: any[] = []

                        allExams.forEach((ex: any) => {
                            if (ex.tipo === 'FINAL') {
                                finals.push(ex)

                                return
                            }

                            const key = ex.modulo_id || '__'

                            if (!byModule[key]) byModule[key] = []

                            byModule[key].push(ex)
                        })

                        const fmtDate = (val: any) => {
                            if (!val) return ''

                            return new Date(val).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        }

                        const ExamCard = ({ ex }: { ex: any }) => {
                            const ahora = new Date()
                            const lockedProgress = progressPercentage < (ex.progreso_minimo || 0)
                            const lockedFuture = ex.fecha_inicio && ahora < new Date(ex.fecha_inicio)
                            const lockedExpired = ex.fecha_fin && ahora > new Date(ex.fecha_fin)
                            const approved = !!ex.ya_aprobado
                            const attempted = (ex.intentos_realizados || 0) > 0
                            const failed = attempted && !approved
                            const exhausted = !approved && (ex.intentos_realizados || 0) >= (ex.intentos_maximos || 1)
                            const expiredWithAttempts = !!lockedExpired && attempted
                            const isActive = currentExamenId === ex.id && currentView === 'exam'
                            const isLocked = lockedProgress || (lockedFuture && !expiredWithAttempts) || (lockedExpired && !expiredWithAttempts) || exhausted

                            const modName = storeCourse?.modulos.find((m: any) => m.id === ex.modulo_id)?.titulo

                            const btnConfig = (() => {
                                if (approved) return { label: 'Ver resultado', bg: '#16a34a' }
                                if (exhausted) return { label: 'Ver resultado', bg: '#ea580c' }
                                if (isActive) return { label: 'En curso', bg: '#d97706' }
                                if (expiredWithAttempts) return { label: 'Ver resultado', bg: '#64748b' }
                                if (lockedFuture) return { label: 'Próximamente', bg: '#3b82f6' }
                                if (lockedExpired) return { label: 'Expirado', bg: '#dc2626' }
                                if (lockedProgress) return { label: 'Bloqueado', bg: '#94a3b8' }

                                return { label: failed ? 'Reintentar' : 'Iniciar', bg: failed ? '#dc2626' : '#025E44' }
                            })()

                            // Colores según resultado
                            const cardBorderColor = approved ? '#16a34a40' : failed ? '#dc262640' : isActive ? '#025E44' : 'divider'
                            const cardBg = approved ? 'rgba(22,163,74,0.04)' : failed ? 'rgba(220,38,38,0.03)' : isActive ? 'rgba(2,94,68,0.04)' : 'background.paper'
                            const iconBg = approved ? 'rgba(22,163,74,0.12)' : failed ? 'rgba(220,38,38,0.1)' : ex.tipo === 'FINAL' ? 'rgba(2,94,68,0.1)' : 'rgba(217,119,6,0.1)'
                            const iconClass = approved ? 'tabler-circle-check-filled' : failed ? 'tabler-circle-x-filled' : ex.tipo === 'FINAL' ? 'tabler-trophy' : 'tabler-clipboard-check'
                            const iconColor = approved ? '#16a34a' : failed ? '#dc2626' : ex.tipo === 'FINAL' ? '#025E44' : '#d97706'

                            return (
                                <Box sx={{
                                    p: 2, borderRadius: '12px', border: '1.5px solid', display: 'flex', alignItems: 'center', gap: 2,
                                    borderColor: cardBorderColor,
                                    bgcolor: cardBg,
                                    opacity: (isLocked && !approved && !failed) ? 0.65 : 1,
                                }}>
                                    {/* Ícono con resultado */}
                                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                                        <Box sx={{ width: 42, height: 42, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: iconBg }}>
                                            <i className={iconClass} style={{ fontSize: '1.2rem', color: iconColor }} />
                                        </Box>
                                        {/* Badge de resultado */}
                                        {(approved || failed) && (
                                            <Box sx={{
                                                position: 'absolute', bottom: -4, right: -4,
                                                width: 18, height: 18, borderRadius: '50%',
                                                bgcolor: approved ? '#16a34a' : '#dc2626',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '2px solid', borderColor: 'background.paper'
                                            }}>
                                                <i className={approved ? 'tabler-check' : 'tabler-x'} style={{ fontSize: '0.6rem', color: '#fff' }} />
                                            </Box>
                                        )}
                                    </Box>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{ex.titulo}</Typography>
                                            <Chip size="small" label={ex.tipo === 'FINAL' ? 'Examen Final' : 'Evaluación'}
                                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: ex.tipo === 'FINAL' ? 'rgba(2,94,68,0.1)' : 'rgba(217,119,6,0.1)', color: ex.tipo === 'FINAL' ? '#025E44' : '#d97706' }} />
                                            {approved && (
                                                <Chip size="small" label="Aprobado" icon={<i className="tabler-check" style={{ fontSize: '0.65rem' }} />}
                                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(22,163,74,0.12)', color: '#16a34a' }} />
                                            )}
                                            {failed && !exhausted && (
                                                <Chip size="small" label="Reprobado" icon={<i className="tabler-x" style={{ fontSize: '0.65rem' }} />}
                                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(220,38,38,0.1)', color: '#dc2626' }} />
                                            )}
                                        </Box>
                                        <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                            {modName && <Typography variant="caption" color="text.secondary"><i className="tabler-folders" style={{ marginRight: 3 }} />{modName}</Typography>}
                                            {ex.puntaje_aprobacion && <Typography variant="caption" color="text.secondary"><i className="tabler-award" style={{ marginRight: 3 }} />Aprobación: {Math.round((ex.puntaje_aprobacion / 100) * 20)}/20</Typography>}
                                            {ex.mejor_puntaje != null && attempted && (
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: approved ? '#16a34a' : '#dc2626' }}>
                                                    <i className="tabler-star" style={{ marginRight: 3 }} />
                                                    Tu nota: {Math.round((ex.mejor_puntaje / 100) * 20 * 10) / 10}/20
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary"><i className="tabler-refresh" style={{ marginRight: 3 }} />{ex.intentos_realizados || 0}/{ex.intentos_maximos} intentos</Typography>
                                            {ex.progreso_minimo > 0 && <Typography variant="caption" color="text.secondary"><i className="tabler-lock" style={{ marginRight: 3 }} />Requiere {ex.progreso_minimo}% avance</Typography>}
                                        </Stack>
                                        {(ex.fecha_inicio || ex.fecha_fin) && (
                                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                                <i className="tabler-calendar-time" style={{ fontSize: '0.78rem', color: '#64748b' }} />
                                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                                                    {ex.fecha_inicio ? `Desde ${fmtDate(ex.fecha_inicio)}` : ''}
                                                    {ex.fecha_inicio && ex.fecha_fin ? '  ·  ' : ''}
                                                    {ex.fecha_fin ? `Hasta ${fmtDate(ex.fecha_fin)}` : ''}
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Box>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => openExam(ex.id)}
                                        sx={{
                                            flexShrink: 0, borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 2, minWidth: 90, boxShadow: 'none',
                                            bgcolor: btnConfig.bg, '&:hover': { bgcolor: btnConfig.bg, filter: 'brightness(0.9)' },
                                            '&.Mui-disabled': { bgcolor: `${btnConfig.bg}88`, color: '#fff' }
                                        }}
                                    >
                                        {btnConfig.label}
                                    </Button>
                                </Box>
                            )
                        }

                        return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                {storeCourse?.modulos.map((mod: any) => {
                                    const exams = byModule[mod.id] || []

                                    if (!exams.length) {
                                        return null
                                    }

                                    return (
                                        <Box key={mod.id}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#025E44', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>{mod.titulo}</Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>{exams.map((ex: any) => <ExamCard key={ex.id} ex={ex} />)}</Box>
                                        </Box>
                                    )
                                })}
                                {finals.length > 0 && (
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#025E44', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>Examen Final</Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>{finals.map((ex: any) => <ExamCard key={ex.id} ex={ex} />)}</Box>
                                    </Box>
                                )}
                            </Box>
                        )
                    })()}

                    {/* Materiales */}
                    {activeTab === 2 && (() => {
                        const modulosConRecursos = (storeCourse?.modulos || []).map(mod => ({
                            ...mod,
                            lecciones: mod.lecciones.filter((l: any) => l.recursos && l.recursos.length > 0)
                        })).filter(mod => mod.lecciones.length > 0)

                        const totalRecursos = modulosConRecursos.reduce(
                            (acc, mod) => acc + mod.lecciones.reduce((a: number, l: any) => a + l.recursos.length, 0), 0
                        )

                        if (totalRecursos === 0) {
                            return (
                                <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: '16px' }}>
                                    <i className="tabler-file-off text-3xl" style={{ opacity: 0.3 }} />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>No hay materiales disponibles en este curso.</Typography>
                                </Box>
                            )
                        }

                        return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {modulosConRecursos.map(mod => (
                                    <Box key={mod.id}>
                                        {/* Cabecera de módulo */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            <Box sx={{ width: 3, height: 16, bgcolor: '#025E44', borderRadius: 2, flexShrink: 0 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#025E44', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                {mod.titulo}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {mod.lecciones.map((l: any) => (
                                                <Box key={l.id}>
                                                    {/* Etiqueta de lección */}
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1, pl: 0.5 }}>
                                                        <i className="tabler-player-play" style={{ fontSize: '0.75rem', marginRight: 4 }} />
                                                        {l.titulo}
                                                    </Typography>
                                                    <LessonContent titulo="" recursos={l.recursos} />
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )
                    })()}

                    {/* Certificación */}
                    {activeTab === 3 && storeCourse && (
                        <CertificateSection
                                        cursoId={storeCourse.id}
                                        completarAutomatico={(course as any).completar_automatico ?? false}
                                        onAllLessonsCompleted={() => {
                                            const allLessons = storeCourse.modulos?.flatMap((m: any) => m.lecciones) ?? []

                                            allLessons.forEach((l: any) => updateLessonProgress(l.id, true, 100))
                                        }}
                                    />
                    )}

                    {/* Comentarios */}
                    {activeTab === 4 && currentLesson && (
                        <Box>
                            <CommentsSection leccionId={currentLesson.id} />
                        </Box>
                    )}

                    {/* Temario (mobile only) */}
                    {isMobile && activeTab === 5 && (
                        <Box sx={{ mt: 0 }}>
                            <CourseContentSidebar onLessonSelect={handleLessonSelect} />
                        </Box>
                    )}
                </Grid>
            </>
        )
    }

    if (!mounted) return null

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100dvh - 64px)',
            overflow: 'hidden',
            position: 'relative',
            ml: { xs: 'calc(50% - 50vw)', md: 0 },
            mr: { xs: 'calc(50% - 50vw)', md: 0 },
            mt: { xs: -3, md: 0 },
            width: { xs: '100vw', md: '100%' },
            bgcolor: '#f8fafc',
        }}>
            <style>{`footer { display: none !important; }`}</style>

            {/* ── Top header bar ── */}
            {storeCourse && (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: { xs: 2, md: 3 },
                    py: { xs: 2, md: 3 }
                }}>
                    <Typography
                        variant="h4"
                        noWrap
                        sx={{ fontWeight: 700, color: 'text.primary', maxWidth: { xs: '55%', md: '65%' } }}
                    >
                        {storeCourse.titulo}
                    </Typography>

                    <Stack direction="row" spacing={1} flexShrink={0}>
                        <Button
                            variant="outlined"
                            onClick={() => setRatingModalOpen(true)}
                            sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2,
                                borderColor: 'divider',
                                color: 'text.secondary',
                                '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'rgba(2,94,68,0.04)' }
                            }}
                        >
                            ⭐ Califica este Curso
                        </Button>
                        <Button
                            variant="contained"
                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Hola, necesito ayuda académica con el curso: ' + storeCourse.titulo)}`}
                            target="_blank"
                            sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2,
                                color: 'white',
                                boxShadow: 'none',
                            }}
                        >
                            <i className="tabler-brand-whatsapp text-base" style={{ color: 'white', fontSize: 20, marginRight: 2 }} />
                            Contactar al asesor académico
                        </Button>
                    </Stack>
                </Box>
            )}

            {/* ── Content + Sidebar ── */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'relative' }}>

                {/* Main scrollable area */}
                <Box sx={{
                    flexGrow: 1,
                    overflowY: { xs: 'auto', md: 'scroll' },
                    overflowX: 'hidden',
                    transition: 'margin 0.3s',
                    mr: sidebarOpen && !isMobile ? '380px' : 0,
                }}>
                    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 2, md: 3 }, pb: 2 }}>
                        <Grid container spacing={0}>
                            {renderMainContent()}
                        </Grid>
                    </Box>
                </Box>

                {/* Desktop sidebar */}
                {!isMobile && (
                    <Box sx={{
                        width: 380,
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        height: '100%',
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.3s',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <CourseContentSidebar onLessonSelect={handleLessonSelect} />
                    </Box>
                )}
            </Box>
            {/* ── Rating Modal ── */}
            {storeCourse && (
                <RatingModal
                    open={ratingModalOpen}
                    handleClose={() => setRatingModalOpen(false)}
                    cursoSlug={storeCourse.slug}
                    cursoTitulo={storeCourse.titulo}
                />
            )}
        </Box>
    )
}

export default CoursePlayerView
