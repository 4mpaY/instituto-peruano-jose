'use client'

import { useState, useMemo } from 'react'

import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    LinearProgress,
    Divider,
    Button,
    InputAdornment,
    Tooltip,
} from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'
import { useCourseStore } from '../store/useCourseStore'

interface CourseContentSidebarProps {
    onLessonSelect: (lessonId: string) => void
}

const CourseContentSidebar = ({ onLessonSelect }: CourseContentSidebarProps) => {
    const {
        course,
        currentLessonId,
        currentExamenId,
        progressPercentage,
        examStatus,
        examenId,
        currentView,
        setCurrentView,
        openExam
    } = useCourseStore()

    const [searchQuery, setSearchQuery] = useState('')

    const filteredModules = useMemo(() => {
        const modules = course?.modulos || []

        if (!searchQuery.trim()) return modules

        const lowerQuery = searchQuery.toLowerCase()

        return modules
            .map(module => {
                const moduleMatches = module.titulo.toLowerCase().includes(lowerQuery)

                const matchedLessons = moduleMatches
                    ? module.lecciones
                    : module.lecciones.filter((l: any) => l.titulo.toLowerCase().includes(lowerQuery))

                return matchedLessons.length > 0 ? { ...module, lecciones: matchedLessons } : null
            })
            .filter(Boolean) as any[]
    }, [course?.modulos, searchQuery])

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>

            {/* ── Header ── */}
            <Box sx={{ px: 3, pt: 3, pb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                    Contenido del curso
                </Typography>

                {/* Progress */}
                <Box sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Tu progreso
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#025E44' }}>
                            {progressPercentage}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progressPercentage}
                        sx={{
                            height: 7,
                            borderRadius: 4,
                            bgcolor: 'rgba(2,94,68,0.1)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: 'linear-gradient(90deg, #025E44 0%, #BDD962 100%)',
                            }
                        }}
                    />
                </Box>

            </Box>

            {/* ── Lesson list ── */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {filteredModules.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <i className="tabler-search-off" style={{ fontSize: '2rem', opacity: 0.3 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Sin resultados para &quot;{searchQuery}&quot;
                        </Typography>
                    </Box>
                ) : (
                    filteredModules.map((module) => (
                        <Accordion
                            key={module.id}
                            defaultExpanded
                            disableGutters
                            elevation={0}
                            sx={{ '&:before': { display: 'none' }, borderBottom: '1px solid', borderColor: 'divider' }}
                        >
                            <AccordionSummary
                                expandIcon={<i className="tabler-chevron-down" style={{ fontSize: '1rem', color: '#6b7280' }} />}
                                sx={{
                                    px: 3,
                                    py: 1.25,
                                    minHeight: 'auto',
                                    bgcolor: 'rgba(2,94,68,0.035)',
                                    '& .MuiAccordionSummary-content': { my: 0 }
                                }}
                            >
                                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#025E44', letterSpacing: '0.01em' }}>
                                    {module.titulo}
                                </Typography>
                            </AccordionSummary>

                            <AccordionDetails sx={{ p: 0 }}>
                                <List sx={{ p: 0 }}>
                                    {(() => {
                                        const allItems = [
                                            ...(module.lecciones || []).map((l: any) => ({
                                                ...l, tipo: 'leccion', orden: l.orden || 0
                                            })),
                                            ...(course?.examenes || [])
                                                .filter((ex: any) => ex.modulo_id === module.id && ex.tipo === 'INTERMEDIO')
                                                .map((ex: any) => ({
                                                    ...ex, tipo: 'examen', completada: false, orden: ex.orden || 0
                                                }))
                                        ].sort((a, b) => (a.orden || 0) - (b.orden || 0))

                                        return allItems.map((item: any) => {
                                            const isLocked = item.tipo === 'examen' && progressPercentage < (item.progreso_minimo || 0)
                                            const isLockedLesson = item.tipo === 'leccion' && item.fecha_desbloqueo && new Date(item.fecha_desbloqueo) > new Date()

                                            const isSelected = item.tipo === 'leccion'
                                                ? currentLessonId === item.id && currentView === 'lesson'
                                                : currentExamenId === item.id && currentView === 'exam'

                                            const getIcon = () => {
                                                if (isLocked || isLockedLesson) {
                                                    return (
                                                        <i className="tabler-lock" style={{ fontSize: '1rem', color: '#9ca3af' }} />
                                                    )
                                                }

                                                if (item.tipo === 'examen') {
                                                    if (item.ya_aprobado) {
                                                        return (
                                                            <i className="tabler-circle-check-filled" style={{ fontSize: '1rem', color: '#16a34a' }} />
                                                        )
                                                    }

                                                    if ((item.intentos_realizados || 0) > 0) {
                                                        return (
                                                            <i className="tabler-circle-x-filled" style={{ fontSize: '1rem', color: '#dc2626' }} />
                                                        )
                                                    }

                                                    return (
                                                        <i className="tabler-clipboard-check" style={{ fontSize: '1rem', color: '#d97706' }} />
                                                    )
                                                }

                                                if (item.completada) {
                                                    return (
                                                        <i className="tabler-circle-check-filled" style={{ fontSize: '1rem', color: '#16a34a' }} />
                                                    )
                                                }

                                                return (
                                                    <i className="tabler-player-play" style={{ fontSize: '1rem', color: isSelected ? '#025E44' : '#9ca3af' }} />
                                                )
                                            }

                                            const unlockDate = isLockedLesson && item.fecha_desbloqueo
                                                ? new Date(item.fecha_desbloqueo).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                : null

                                            return (
                                                <ListItem key={item.id} disablePadding>
                                                    <Tooltip
                                                        title={unlockDate ? `Se desbloquea: ${unlockDate}` : ''}
                                                        placement="left"
                                                        arrow
                                                    >
                                                        <ListItemButton
                                                            selected={isSelected}
                                                            onClick={() => {
                                                                if (isLockedLesson || isLocked) return
                                                                if (item.tipo === 'leccion') onLessonSelect(item.id)
                                                                else openExam(item.id)
                                                            }}
                                                            disabled={isLocked}
                                                            sx={{
                                                                px: 3,
                                                                py: 1.25,
                                                                gap: 1.5,
                                                                opacity: (isLocked || isLockedLesson) ? 0.55 : 1,
                                                                cursor: isLockedLesson ? 'not-allowed' : 'pointer',
                                                                borderLeft: isSelected ? '3px solid #025E44' : '3px solid transparent',
                                                                '&.Mui-selected': {
                                                                    bgcolor: 'rgba(2,94,68,0.06)',
                                                                    '&:hover': { bgcolor: 'rgba(2,94,68,0.09)' }
                                                                },
                                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                                                                '&.Mui-disabled': { opacity: 0.45 },
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 'auto', color: 'inherit' }}>
                                                                {getIcon()}
                                                            </ListItemIcon>
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontWeight: isSelected ? 700 : 500,
                                                                        color: isSelected ? '#025E44' : 'text.primary',
                                                                        fontSize: '0.82rem',
                                                                        lineHeight: 1.35,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                >
                                                                    {item.titulo}
                                                                </Typography>
                                                                {unlockDate && (
                                                                    <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                                        <i className="tabler-clock" style={{ fontSize: '0.7rem' }} />
                                                                        Se desbloquea: {unlockDate}
                                                                    </Typography>
                                                                )}
                                                            </Box>

                                                            {/* Fechas al lado derecho */}
                                                            {item.tipo === 'examen' && (item.fecha_inicio || item.fecha_fin) && (
                                                                <Box sx={{ flexShrink: 0, textAlign: 'right', ml: 1 }}>
                                                                    {item.fecha_inicio && (
                                                                        <Typography variant="caption" sx={{
                                                                            fontSize: '0.65rem', color: '#2563eb', fontWeight: 600,
                                                                            display: 'flex', alignItems: 'center', gap: 0.4,
                                                                            justifyContent: 'flex-end', whiteSpace: 'nowrap'
                                                                        }}>
                                                                            <i className="tabler-calendar-up" style={{ fontSize: '0.65rem' }} />
                                                                            {new Date(item.fecha_inicio).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                        </Typography>
                                                                    )}
                                                                    {item.fecha_fin && (
                                                                        <Typography variant="caption" sx={{
                                                                            fontSize: '0.65rem', color: '#dc2626', fontWeight: 600,
                                                                            display: 'flex', alignItems: 'center', gap: 0.4,
                                                                            justifyContent: 'flex-end', whiteSpace: 'nowrap', mt: 0.3
                                                                        }}>
                                                                            <i className="tabler-calendar-down" style={{ fontSize: '0.65rem' }} />
                                                                            {new Date(item.fecha_fin).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            )}
                                                            {/* Fecha clase en vivo */}
                                                            {item.tipo === 'leccion' && item.es_en_vivo && item.fecha_programada && (
                                                                <Box sx={{ flexShrink: 0, textAlign: 'right', ml: 1 }}>
                                                                    <Typography variant="caption" sx={{
                                                                        fontSize: '0.65rem', color: '#7c3aed', fontWeight: 600,
                                                                        display: 'flex', alignItems: 'center', gap: 0.4,
                                                                        justifyContent: 'flex-end', whiteSpace: 'nowrap'
                                                                    }}>
                                                                        <i className="tabler-video" style={{ fontSize: '0.65rem' }} />
                                                                        {new Date(item.fecha_programada).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </ListItemButton>
                                                    </Tooltip>
                                                </ListItem>
                                            )
                                        })
                                    })()}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    ))
                )}

                {/* ── Final exam (solo si existe examen final) ── */}
                {examenId && (
                    <>
                        <Divider />
                        <Box sx={{ p: 3 }}>
                            {examStatus === 'locked' && (
                                <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'action.hover', textAlign: 'center' }}>
                                    <i className="tabler-lock" style={{ fontSize: '1.5rem', opacity: 0.4 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 600, fontSize: '0.82rem' }}>
                                        Completa las lecciones para acceder al examen final
                                    </Typography>
                                </Box>
                            )}
                            {(examStatus === 'available' || examStatus === 'failed') && (
                                <Button
                                    fullWidth
                                    variant={currentView === 'exam' && currentExamenId === examenId ? 'contained' : 'outlined'}
                                    color="warning"
                                    startIcon={<i className="tabler-clipboard-text" />}
                                    onClick={() => openExam(examenId)}
                                    sx={{ borderRadius: '10px', py: 1.25, fontWeight: 700, textTransform: 'none', fontSize: '0.875rem' }}
                                >
                                    Realizar Examen Final
                                </Button>
                            )}
                    </Box>
            </>
                )}

            {/* ── Certificado — siempre visible ── */}
            {course && (
                <>
                    <Divider />
                    <Box sx={{ p: 3 }}>
                        <Button
                            fullWidth
                            variant={currentView === 'certificate' ? 'contained' : 'outlined'}
                            startIcon={<i className="tabler-certificate" />}
                            onClick={() => setCurrentView('certificate')}
                            sx={{
                                borderRadius: '10px',
                                py: 1.25,
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '0.875rem',
                                ...(currentView === 'certificate'
                                    ? { bgcolor: '#025E44', '&:hover': { bgcolor: '#014d36' }, boxShadow: 'none' }
                                    : { borderColor: '#025E44', color: '#025E44', '&:hover': { bgcolor: 'rgba(2,94,68,0.05)' } }
                                )
                            }}
                        >
                            Mi Certificado
                        </Button>
                    </Box>
                </>
            )}
        </Box>
        </Box>
    )
}

export default CourseContentSidebar
