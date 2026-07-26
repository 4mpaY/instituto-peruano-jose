'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import axios from 'axios'
import { toast } from 'react-toastify'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import CompleteProfileModal from './CompleteProfileModal'
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    CircularProgress,
    Chip,
    Stack,
    LinearProgress,
    Divider
} from '@mui/material'

interface Opcion {
    id: string
    texto: string
    orden: number
}

interface Pregunta {
    id: string
    texto: string
    tipo: string
    puntos: number
    opciones: Opcion[]
}

interface ExamenData {
    id: string
    titulo: string
    descripcion?: string
    fecha_fin?: string | null
    puntaje_aprobacion: number
    mezclar_preguntas: boolean
    preguntas: Pregunta[]
}

interface ExamSectionProps {
    examenId: string
    onExamPassed: () => void
    isFinalExam?: boolean
    onContinue?: () => void
    contactoUrl?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const toVeinte = (pct: number) => Math.round((pct / 100) * 20)

const fmtFecha = (val: string) =>
    new Date(val).toLocaleString('es-PE', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })

const isExamenExpirado = (fechaFin?: string | null) =>
    !!fechaFin && new Date(fechaFin).getTime() < Date.now()

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

const ScoreRing = ({ puntaje, aprobado }: { puntaje: number; aprobado: boolean }) => {
    const color = aprobado ? '#16a34a' : '#dc2626'
    const nota = toVeinte(puntaje)

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex', my: 1 }}>
            <CircularProgress
                variant="determinate"
                value={100}
                size={148}
                thickness={5}
                sx={{ color: 'rgba(0,0,0,0.07)', position: 'absolute', top: 0, left: 0 }}
            />
            <CircularProgress
                variant="determinate"
                value={puntaje}
                size={148}
                thickness={5}
                sx={{ color }}
            />
            <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
            }}>
                <Typography variant="h3" fontWeight={900} lineHeight={1} sx={{ color }}>
                    {nota}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>/20</Typography>
            </Box>
        </Box>
    )
}

// ─── State Card Shell ─────────────────────────────────────────────────────────

interface StateCardProps {
    icon: string
    iconColor: string
    bgColor: string
    borderColor: string
    title: string
    subtitle?: string
    action?: React.ReactNode
    children?: React.ReactNode
}

const StateCard = ({ icon, iconColor, bgColor, borderColor, title, subtitle, action, children }: StateCardProps) => (
    <Card variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden', borderColor, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 5, bgcolor: bgColor, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <Box sx={{
                width: 72, height: 72, borderRadius: '50%',
                bgcolor: `${iconColor}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2
            }}>
                <i className={icon} style={{ fontSize: '2rem', color: iconColor }} />
            </Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">{title}</Typography>
            {subtitle && (
                <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 380, fontSize: '0.9rem' }}>
                    {subtitle}
                </Typography>
            )}
            {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
        </Box>
        {children}
    </Card>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const ExamSection = ({ examenId, onExamPassed, isFinalExam = true, onContinue, contactoUrl }: ExamSectionProps) => {
    const queryClient = useQueryClient()
    const { data: session } = useSession()
    const [submitting, setSubmitting] = useState(false)
    const [respuestas, setRespuestas] = useState<Record<string, string>>({})
    const [resultado, setResultado] = useState<any>(null)
    const [yaAprobado, setYaAprobado] = useState(false)
    const [intentosRestantes, setIntentosRestantes] = useState(0)
    const [tiempoRestante, setTiempoRestante] = useState<number | null>(null)
    const [examenIniciado, setExamenIniciado] = useState(false)
    const [showProfileModal, setShowProfileModal] = useState(false)

    // Refs para evitar stale closure en efectos
    const resultadoRef = useRef<any>(null)
    const examenIniciadoRef = useRef(false)

    const { data: queryData, isLoading: loading, error: queryError } = useQuery<{
        examen: ExamenData
        yaAprobado: boolean
        intentosRestantes: number
        resultadoAnterior?: any
    }>({
        queryKey: ['examen', 'estudiante', examenId],
        queryFn: async () => {
            const res = await axios.get(`/api/estudiante/examen/${examenId}`)

            if (!res.data.status) throw new Error('Error al cargar el examen')

            return res.data.result
        },
        enabled: !!examenId,
        staleTime: 60_000,
        retry: false
    })

    const examen = queryData?.examen ?? null

    const errorMsg: string | null = queryError
        ? (queryError as any).response?.data?.message || (queryError as Error).message
        : null

    // Sincronizar refs con estado para evitar stale closure
    useEffect(() => { resultadoRef.current = resultado }, [resultado])
    useEffect(() => { examenIniciadoRef.current = examenIniciado }, [examenIniciado])

    useEffect(() => {
        setResultado(null)
        setRespuestas({})
        setExamenIniciado(false)
        setTiempoRestante(null)
        resultadoRef.current = null
        examenIniciadoRef.current = false
    }, [examenId])

    useEffect(() => {
        if (!queryData) return

        setYaAprobado(queryData.yaAprobado)
        setIntentosRestantes(queryData.intentosRestantes)

        const expirado = isExamenExpirado(queryData.examen?.fecha_fin)

        if (expirado) {
            setExamenIniciado(false)
            examenIniciadoRef.current = false
        }

        if (queryData.resultadoAnterior && !examenIniciadoRef.current) {
            setResultado(queryData.resultadoAnterior)
            resultadoRef.current = queryData.resultadoAnterior
        }
    }, [queryData])

    useEffect(() => {
        if (!examenIniciado || tiempoRestante === null || tiempoRestante <= 0) return

        const timer = setInterval(() => {
            setTiempoRestante(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer)
                    handleSubmit()

                    return 0
                }

                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examenIniciado, tiempoRestante])

    const startExamTimer = () => {
        examenIniciadoRef.current = true
        resultadoRef.current = null
        setExamenIniciado(true)
        setResultado(null)
        setRespuestas({})
        setTiempoRestante(null)

        if (examen?.fecha_fin) {
            const secsLeft = Math.floor((new Date(examen.fecha_fin).getTime() - Date.now()) / 1000)

            if (secsLeft > 0) setTiempoRestante(secsLeft)
        }
    }

    const handleStartExam = () => {
        if (isExamenExpirado(examen?.fecha_fin)) {
            toast.error('El período de evaluación ha finalizado')

            return
        }

        if (!session?.user?.celular || session.user.celular.trim() === '' || session.user.celular === 'null') {
            setShowProfileModal(true)

            return
        }

        startExamTimer()
    }

    const handleRespuesta = (preguntaId: string, opcionId: string) => {
        setRespuestas(prev => ({ ...prev, [preguntaId]: opcionId }))
    }

    const handleSubmit = useCallback(async () => {
        if (!examen) return

        const respuestasArray = Object.entries(respuestas).map(([preguntaId, opcionId]) => ({
            preguntaId,
            opcionId
        }))

        if (respuestasArray.length < examen.preguntas.length) {
            toast.warning('Por favor, responde todas las preguntas antes de enviar')

            return
        }

        setSubmitting(true)

        try {
            const res = await axios.post(`/api/estudiante/examen/${examenId}/enviar`, {
                respuestas: respuestasArray
            })

            if (res.data.status) {
                examenIniciadoRef.current = false
                resultadoRef.current = res.data.result
                setExamenIniciado(false)
                setResultado(res.data.result)
                setIntentosRestantes(res.data.result.intentosRestantes)
                queryClient.invalidateQueries({ queryKey: ['examen', 'estudiante', examenId] })

                if (res.data.result.aprobado) {
                    setYaAprobado(true)
                    toast.success('¡Felicidades! Has aprobado el examen')
                    onExamPassed()
                } else {
                    toast.error('No alcanzaste el puntaje mínimo. ¡Sigue intentando!')
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al enviar el examen')
        } finally {
            setSubmitting(false)
        }
    }, [examen, respuestas, examenId, onExamPassed, queryClient])

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
                <CircularProgress sx={{ color: '#025E44' }} />
                <Typography color="text.secondary" variant="body2">Cargando evaluación…</Typography>
            </Box>
        )
    }

    // ── Error states ─────────────────────────────────────────────────────────
    if (errorMsg) {
        const isExpired = errorMsg.toLowerCase().includes('finalizado')
        const isFuture = errorMsg.toLowerCase().includes('disponible desde')
        const isProgress = errorMsg.toLowerCase().includes('progreso')
        const isEnrolment = errorMsg.toLowerCase().includes('inscrito')

        const dateMatch = isFuture ? errorMsg.match(/desde el (.+)/) : null
        const fechaStr = dateMatch ? dateMatch[1] : ''

        if (isExpired) {
            return (
                <StateCard
                    icon="tabler-calendar-x"
                    iconColor="#64748b"
                    bgColor="rgba(100,116,139,0.06)"
                    borderColor="rgba(100,116,139,0.25)"
                    title="Período de evaluación cerrado"
                    subtitle="El tiempo para rendir este examen ha concluido y no registras ningún intento."
                    action={contactoUrl ? (
                        <Button
                            variant="contained"
                            href={contactoUrl}
                            target="_blank"
                            startIcon={<i className="tabler-brand-whatsapp" />}
                            sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                boxShadow: 'none'
                            }}
                        >
                            Contactar con asesor
                        </Button>
                    ) : undefined}
                />
            )
        }

        if (isFuture) {
            return (
                <StateCard
                    icon="tabler-calendar-clock"
                    iconColor="#2563eb"
                    bgColor="rgba(37,99,235,0.06)"
                    borderColor="rgba(37,99,235,0.25)"
                    title="Aún no está disponible"
                    subtitle={fechaStr ? `Este examen se habilitará el ${fechaStr}.` : errorMsg}
                >
                    <Box sx={{ px: 4, pb: 4, textAlign: 'center' }}>
                        <Chip
                            icon={<i className="tabler-clock" />}
                            label={fechaStr || 'Próximamente'}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                </StateCard>
            )
        }

        if (isProgress) {
            const pctMatch = errorMsg.match(/(\d+)%/)
            const pct = pctMatch ? pctMatch[1] : null

            return (
                <StateCard
                    icon="tabler-lock"
                    iconColor="#d97706"
                    bgColor="rgba(217,119,6,0.06)"
                    borderColor="rgba(217,119,6,0.25)"
                    title="Avance insuficiente"
                    subtitle={pct
                        ? `Debes completar al menos el ${pct}% del curso antes de acceder a este examen.`
                        : errorMsg}
                >
                    {pct && (
                        <Box sx={{ px: 4, pb: 4 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                                <Typography variant="caption" color="text.secondary">Tu avance actual</Typography>
                                <Typography variant="caption" fontWeight={700} color="warning.main">{pct}% requerido</Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={0}
                                sx={{
                                    height: 8, borderRadius: 4, bgcolor: 'rgba(217,119,6,0.15)',
                                    '& .MuiLinearProgress-bar': { bgcolor: '#d97706' }
                                }}
                            />
                        </Box>
                    )}
                </StateCard>
            )
        }

        if (isEnrolment) {
            return (
                <StateCard
                    icon="tabler-user-x"
                    iconColor="#dc2626"
                    bgColor="rgba(220,38,38,0.05)"
                    borderColor="rgba(220,38,38,0.2)"
                    title="Sin acceso al curso"
                    subtitle="No estás inscrito o tu matrícula no está activa en este curso."
                />
            )
        }

        return (
            <StateCard
                icon="tabler-alert-circle"
                iconColor="#dc2626"
                bgColor="rgba(220,38,38,0.05)"
                borderColor="rgba(220,38,38,0.2)"
                title="No se pudo cargar el examen"
                subtitle={errorMsg}
            />
        )
    }

    if (!examen) {
        return (
            <StateCard
                icon="tabler-clipboard-off"
                iconColor="#94a3b8"
                bgColor="rgba(148,163,184,0.06)"
                borderColor="rgba(148,163,184,0.25)"
                title="Sin evaluación disponible"
                subtitle="No hay ningún examen configurado para esta sección."
            />
        )
    }

    const examenExpirado = isExamenExpirado(examen.fecha_fin)

    if (examenExpirado && !resultado && !yaAprobado && !queryData?.resultadoAnterior) {
        return (
            <StateCard
                icon="tabler-calendar-x"
                iconColor="#64748b"
                bgColor="rgba(100,116,139,0.06)"
                borderColor="rgba(100,116,139,0.25)"
                title="Período de evaluación cerrado"
                subtitle="El tiempo para rendir este examen ha concluido y no registras ningún intento."
                action={contactoUrl ? (
                    <Button
                        variant="contained"
                        href={contactoUrl}
                        target="_blank"
                        startIcon={<i className="tabler-brand-whatsapp" />}
                        sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            boxShadow: 'none'
                        }}
                    >
                        Contactar con asesor
                    </Button>
                ) : undefined}
            />
        )
    }

    if (examenExpirado && examenIniciado) {
        return (
            <StateCard
                icon="tabler-calendar-x"
                iconColor="#64748b"
                bgColor="rgba(100,116,139,0.06)"
                borderColor="rgba(100,116,139,0.25)"
                title="Período de evaluación cerrado"
                subtitle="El tiempo para rendir este examen ha concluido."
            />
        )
    }

    // ── Already approved (no recent result) ──────────────────────────────────
    if (yaAprobado && !resultado) {
        return (
            <StateCard
                icon="tabler-trophy"
                iconColor="#16a34a"
                bgColor="rgba(22,163,74,0.06)"
                borderColor="rgba(22,163,74,0.3)"
                title="¡Evaluación aprobada!"
                subtitle={isFinalExam
                    ? 'Has superado este examen. Ya puedes obtener tu certificado.'
                    : 'Completaste esta evaluación. Continúa avanzando en el curso.'}
            >
                {!isFinalExam && onContinue && (
                    <Box sx={{ px: 4, pb: 4, textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            onClick={onContinue}
                            startIcon={<i className="tabler-arrow-right" />}
                            sx={{
                                borderRadius: '10px', fontWeight: 700, bgcolor: '#16a34a',
                                '&:hover': { bgcolor: '#15803d' }, boxShadow: 'none'
                            }}
                        >
                            Continuar curso
                        </Button>
                    </Box>
                )}
            </StateCard>
        )
    }

    // ── Result screen ─────────────────────────────────────────────────────────
    if (resultado) {
        const nota = toVeinte(resultado.puntaje)
        const notaMinima = toVeinte(resultado.puntajeAprobacion)
        const aprobado = resultado.aprobado
        const puedeVerRespuestas = resultado.intentosRestantes <= 0 || aprobado
        const color = aprobado ? '#16a34a' : '#dc2626'
        const bgColor = aprobado ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.05)'
        const borderColor = aprobado ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.25)'

        return (
            <>
            <Card variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden', borderColor }}>
                {/* Header resultado */}
                <Box sx={{ p: 4, pb: 3, bgcolor: bgColor, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Chip
                        icon={<i className={aprobado ? 'tabler-circle-check' : 'tabler-circle-x'} style={{ fontSize: '1rem' }} />}
                        label={aprobado ? 'APROBADO' : 'NO APROBADO'}
                        sx={{
                            mb: 2, fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em',
                            bgcolor: color, color: '#fff', border: 'none',
                            '& .MuiChip-icon': { color: '#fff' }
                        }}
                    />

                    <ScoreRing puntaje={resultado.puntaje} aprobado={aprobado} />

                    {/* Stats row */}
                    <Stack direction="row" spacing={3} mt={2.5} justifyContent="center" flexWrap="wrap">
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                {resultado.respuestasCorrectas}/{resultado.totalPreguntas}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Respuestas correctas</Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={800} sx={{ color }}>
                                {nota}/20
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Tu nota</Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={800} color="text.secondary">
                                {notaMinima}/20
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Nota mínima</Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* Actions */}
                <Box sx={{ px: 4, py: 3, textAlign: 'center' }}>
                    {aprobado ? (
                        isFinalExam ? (
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}
                                sx={{ p: 2, bgcolor: 'rgba(22,163,74,0.08)', borderRadius: '12px' }}>
                                <i className="tabler-certificate" style={{ fontSize: '1.5rem', color: '#16a34a' }} />
                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography fontWeight={700} color="success.main" variant="body2">
                                        ¡Excelente trabajo!
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Ya puedes descargar tu certificado de aprobación.
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Stack spacing={1.5} alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                    Esta nota contribuye a tu calificación final del curso.
                                </Typography>
                                {onContinue && (
                                    <Button
                                        variant="contained"
                                        onClick={onContinue}
                                        startIcon={<i className="tabler-arrow-right" />}
                                        sx={{
                                            borderRadius: '10px', fontWeight: 700, bgcolor: '#16a34a',
                                            '&:hover': { bgcolor: '#15803d' }, boxShadow: 'none'
                                        }}
                                    >
                                        Continuar curso
                                    </Button>
                                )}
                            </Stack>
                        )
                    ) : (
                        resultado.intentosRestantes > 0 && !examenExpirado ? (
                            <Stack spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                    Te quedan <strong>{resultado.intentosRestantes}</strong> intento{resultado.intentosRestantes !== 1 ? 's' : ''}.
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleStartExam}
                                    startIcon={<i className="tabler-refresh" />}
                                    sx={{
                                        borderRadius: '10px', fontWeight: 700, bgcolor: '#025E44',
                                        '&:hover': { bgcolor: '#014d36' }, boxShadow: 'none'
                                    }}
                                >
                                    Volver a intentar
                                </Button>
                            </Stack>
                        ) : (
                            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}
                                sx={{ p: 2, bgcolor: 'rgba(234,88,12,0.08)', borderRadius: '12px' }}>
                                <i className="tabler-alert-triangle" style={{ fontSize: '1.4rem', color: '#ea580c' }} />
                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography fontWeight={700} color="#ea580c" variant="body2">
                                        Intentos agotados
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        No tienes más intentos disponibles para este examen.
                                    </Typography>
                                </Box>
                            </Stack>
                        )
                    )}
                </Box>

                {/* Resumen de respuestas */}
                {resultado.detallesRespuestas && examen && (
                    <>
                        <Divider />
                        <Box sx={{ p: 4 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={3}>
                                <i className="tabler-list-details" style={{ fontSize: '1.2rem', color: '#64748b' }} />
                                <Typography variant="subtitle1" fontWeight={800}>Revisión de respuestas</Typography>
                            </Stack>
                            <Stack spacing={2}>
                                {examen.preguntas.map((pregunta, index) => {
                                    const detalle = resultado.detallesRespuestas.find((d: any) => d.preguntaId === pregunta.id)

                                    if (!detalle) return null

                                    const opcionSeleccionada = pregunta.opciones.find(o => o.id === detalle.opcionSeleccionadaId)
                                    const opcionCorrecta = pregunta.opciones.find(o => o.id === detalle.opcionCorrectaId)
                                    const esCorrecta = detalle.esCorrecta

                                    return (
                                        <Box key={pregunta.id} sx={{
                                            p: 2.5, borderRadius: '12px',
                                            border: '1px solid',
                                            borderColor: esCorrecta ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.25)',
                                            bgcolor: esCorrecta ? 'rgba(22,163,74,0.04)' : 'rgba(220,38,38,0.04)'
                                        }}>
                                            <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
                                                <Box sx={{
                                                    mt: '2px', flexShrink: 0,
                                                    width: 22, height: 22, borderRadius: '50%',
                                                    bgcolor: esCorrecta ? '#16a34a' : '#dc2626',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <i
                                                        className={esCorrecta ? 'tabler-check' : 'tabler-x'}
                                                        style={{ fontSize: '0.8rem', color: '#fff' }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" fontWeight={700} color="text.primary">
                                                    {index + 1}. {pregunta.texto}
                                                </Typography>
                                            </Stack>

                                            <Stack spacing={1} sx={{ pl: 4 }}>
                                                <Box sx={{
                                                    px: 2, py: 1, borderRadius: '8px',
                                                    bgcolor: esCorrecta ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)',
                                                    border: '1px solid',
                                                    borderColor: esCorrecta ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.15)'
                                                }}>
                                                    <Typography variant="caption" color="text.disabled" display="block" fontWeight={700} sx={{ mb: 0.25 }}>
                                                        TU RESPUESTA
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={600}
                                                        color={esCorrecta ? 'success.main' : 'error.main'}>
                                                        {opcionSeleccionada?.texto || 'No respondida'}
                                                    </Typography>
                                                </Box>

                                                {!esCorrecta && puedeVerRespuestas && (
                                                    <Box sx={{
                                                        px: 2, py: 1, borderRadius: '8px',
                                                        bgcolor: 'rgba(22,163,74,0.08)',
                                                        border: '1px solid rgba(22,163,74,0.2)'
                                                    }}>
                                                        <Typography variant="caption" color="text.disabled" display="block" fontWeight={700} sx={{ mb: 0.25 }}>
                                                            RESPUESTA CORRECTA
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={600} color="success.main">
                                                            {opcionCorrecta?.texto || 'No disponible'}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Box>
                                    )
                                })}
                            </Stack>

                            {!puedeVerRespuestas && (
                                <Box sx={{
                                    mt: 3, p: 2.5, borderRadius: '12px', textAlign: 'center',
                                    bgcolor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)'
                                }}>
                                    <i className="tabler-eye-off" style={{ fontSize: '1.4rem', color: '#2563eb', display: 'block', marginBottom: 6 }} />
                                    <Typography variant="body2" fontWeight={700} color="#2563eb">
                                        Respuestas ocultas
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Las respuestas correctas se revelan cuando agotes todos tus intentos.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </>
                )}
            </Card>
            <CompleteProfileModal
                open={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                requireDocument={false}
                requireCelular={true}
                onSuccess={() => {
                    setShowProfileModal(false)
                    startExamTimer()
                }}
            />
            </>
        )
    }

    // ── Exam start screen ─────────────────────────────────────────────────────
    if (!examenIniciado) {
        const puntajeMin = toVeinte(examen.puntaje_aprobacion)

        return (
            <>
            <Card variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden', borderColor: 'divider' }}>
                <Box sx={{ p: 4, bgcolor: 'rgba(2,94,68,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '50%', mb: 2,
                        bgcolor: 'rgba(2,94,68,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <i className="tabler-clipboard-text" style={{ fontSize: '2rem', color: '#025E44' }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>{examen.titulo}</Typography>
                    {examen.descripcion && (
                        <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 400, fontSize: '0.9rem' }}>
                            {examen.descripcion}
                        </Typography>
                    )}
                </Box>

                <CardContent sx={{ p: 4 }}>
                    <Stack spacing={3}>
                        {/* Info chips */}
                        <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                            <Chip
                                icon={<i className="tabler-list-numbers" style={{ fontSize: '1rem' }} />}
                                label={`${examen.preguntas.length} preguntas`}
                                variant="outlined" size="small"
                            />
                            <Chip
                                icon={<i className="tabler-target" style={{ fontSize: '1rem' }} />}
                                label={`Nota mínima: ${puntajeMin}/20`}
                                variant="outlined" size="small" color="primary"
                            />
                            {examen.fecha_fin && (
                                <Chip
                                    icon={<i className="tabler-clock-stop" style={{ fontSize: '1rem' }} />}
                                    label={`Cierra: ${fmtFecha(examen.fecha_fin)}`}
                                    variant="outlined" size="small" color="warning"
                                />
                            )}
                        </Stack>

                        {intentosRestantes <= 0 ? (
                            <Box sx={{
                                p: 2.5, borderRadius: '12px', textAlign: 'center',
                                bgcolor: 'rgba(234,88,12,0.07)', border: '1px solid rgba(234,88,12,0.2)'
                            }}>
                                <i className="tabler-alert-triangle" style={{ fontSize: '1.5rem', color: '#ea580c', display: 'block', marginBottom: 8 }} />
                                <Typography fontWeight={700} color="#ea580c" variant="body2">Intentos agotados</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    No tienes más intentos disponibles para este examen.
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={1.5}>
                                <Box sx={{
                                    p: 2, borderRadius: '10px', textAlign: 'center',
                                    bgcolor: 'rgba(2,94,68,0.05)', border: '1px solid rgba(2,94,68,0.15)'
                                }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Tienes{' '}
                                        <Typography component="span" fontWeight={800} color="#025E44">
                                            {intentosRestantes} intento{intentosRestantes !== 1 ? 's' : ''}
                                        </Typography>
                                        {' '}disponible{intentosRestantes !== 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleStartExam}
                                    fullWidth
                                    startIcon={<i className="tabler-player-play" />}
                                    sx={{
                                        borderRadius: '12px', py: 1.5, fontWeight: 800, fontSize: '1rem',
                                        bgcolor: '#025E44', '&:hover': { bgcolor: '#014d36' }, boxShadow: 'none'
                                    }}
                                >
                                    Comenzar Examen
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </CardContent>
            </Card>
            <CompleteProfileModal
                open={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                requireDocument={false}
                requireCelular={true}
                onSuccess={() => {
                    setShowProfileModal(false)
                    startExamTimer()
                }}
            />
            </>
        )
    }

    // ── Exam in progress ──────────────────────────────────────────────────────
    const preguntasRespondidas = Object.keys(respuestas).length
    const progreso = (preguntasRespondidas / examen.preguntas.length) * 100
    const timerUrgente = tiempoRestante !== null && tiempoRestante < 120

    return (
        <Box>
            {/* Sticky header */}
            <Card variant="outlined" sx={{
                borderRadius: '12px', mb: 3,
                position: 'sticky', top: 0, zIndex: 5,
                borderColor: timerUrgente ? 'rgba(220,38,38,0.5)' : 'divider'
            }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ maxWidth: '60%' }}>
                            {examen.titulo}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                                icon={<i className="tabler-check" style={{ fontSize: '0.85rem' }} />}
                                label={`${preguntasRespondidas}/${examen.preguntas.length}`}
                                color="primary" size="small" variant="outlined"
                            />
                            {tiempoRestante !== null && (
                                <Chip
                                    icon={<i className="tabler-clock" style={{ fontSize: '0.85rem' }} />}
                                    label={formatTime(tiempoRestante)}
                                    color={timerUrgente ? 'error' : 'default'}
                                    size="small"
                                    sx={timerUrgente ? { fontWeight: 800, animation: 'pulse 1s infinite' } : {}}
                                />
                            )}
                        </Stack>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={progreso}
                        sx={{
                            mt: 1.5, height: 5, borderRadius: 4,
                            bgcolor: 'rgba(2,94,68,0.1)',
                            '& .MuiLinearProgress-bar': { bgcolor: '#025E44', borderRadius: 4 }
                        }}
                    />
                </CardContent>
            </Card>

            {/* Questions */}
            <Stack spacing={2.5}>
                {examen.preguntas.map((pregunta, index) => {
                    const respondida = !!respuestas[pregunta.id]

                    return (
                        <Card key={pregunta.id} variant="outlined" sx={{
                            borderRadius: '12px',
                            borderColor: respondida ? 'rgba(2,94,68,0.4)' : 'divider',
                            transition: 'border-color 0.2s'
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <FormControl component="fieldset" fullWidth>
                                    <FormLabel component="legend" sx={{ mb: 2 }}>
                                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                            <Chip
                                                label={index + 1}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800, flexShrink: 0, mt: '2px',
                                                    bgcolor: respondida ? '#025E44' : 'rgba(0,0,0,0.08)',
                                                    color: respondida ? '#fff' : 'text.secondary',
                                                    transition: 'all 0.2s'
                                                }}
                                            />
                                            <Box>
                                                <Typography fontWeight={700} color="text.primary" variant="body1">
                                                    {pregunta.texto}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled">
                                                    {pregunta.puntos} {pregunta.puntos === 1 ? 'punto' : 'puntos'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </FormLabel>
                                    <RadioGroup
                                        value={respuestas[pregunta.id] || ''}
                                        onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                                    >
                                        {pregunta.opciones.map((opcion) => {
                                            const selected = respuestas[pregunta.id] === opcion.id

                                            return (
                                                <FormControlLabel
                                                    key={opcion.id}
                                                    value={opcion.id}
                                                    control={<Radio size="small" sx={{
                                                        color: selected ? '#025E44' : undefined,
                                                        '&.Mui-checked': { color: '#025E44' }
                                                    }} />}
                                                    label={opcion.texto}
                                                    sx={{
                                                        py: 0.75, px: 2, mx: 0, mb: 0.5, borderRadius: '8px',
                                                        border: '1px solid',
                                                        borderColor: selected ? 'rgba(2,94,68,0.35)' : 'transparent',
                                                        bgcolor: selected ? 'rgba(2,94,68,0.06)' : 'transparent',
                                                        transition: 'all 0.15s',
                                                        '&:hover': { bgcolor: 'rgba(2,94,68,0.04)', borderColor: 'rgba(2,94,68,0.2)' }
                                                    }}
                                                />
                                            )
                                        })}
                                    </RadioGroup>
                                </FormControl>
                            </CardContent>
                        </Card>
                    )
                })}
            </Stack>

            <Divider sx={{ my: 4 }} />

            <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSubmit}
                disabled={submitting || preguntasRespondidas < examen.preguntas.length}
                sx={{
                    borderRadius: '12px', py: 1.75, fontWeight: 800, fontSize: '1rem',
                    bgcolor: '#025E44', '&:hover': { bgcolor: '#014d36' }, boxShadow: 'none',
                    '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.3)' }
                }}
            >
                {submitting ? (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <CircularProgress size={20} color="inherit" />
                        <span>Enviando…</span>
                    </Stack>
                ) : (
                    `Enviar examen (${preguntasRespondidas}/${examen.preguntas.length} respondidas)`
                )}
            </Button>
        </Box>
    )
}

export default ExamSection
