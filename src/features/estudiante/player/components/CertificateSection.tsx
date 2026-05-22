'use client'

import { useState, useEffect, useRef } from 'react'

import axios from 'axios'
import { toast } from 'react-toastify'
import {
    Box, Typography, Button, CircularProgress, LinearProgress, Chip, Divider
} from '@mui/material'

import HydratedDate from '@/utils/components/HydratedDate'

interface CertificateData {
    id: string
    codigoVerificacion: string
    emitidoEn: string
    cursoTitulo: string
    nombreCompleto: string
}

interface Elegibilidad {
    progreso: number
    promedioScore: number
    promedioMinimo: number
    isEligible: boolean
    totalExamenes: number
}

interface CertificateSectionProps {
    cursoId: string
}

const ScoreRing = ({ value, min, label }: { value: number; min: number; label: string }) => {
    const nota = Math.round((value / 100) * 20 * 10) / 10
    const notaMin = Math.round((min / 100) * 20 * 10) / 10
    const pct = Math.min(100, Math.round(value))
    const approved = value >= min
    const color = approved ? '#16a34a' : value >= min * 0.6 ? '#d97706' : '#dc2626'

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ position: 'relative', width: 72, height: 72 }}>
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={72}
                    thickness={5}
                    sx={{ color: 'action.hover', position: 'absolute' }}
                />
                <CircularProgress
                    variant="determinate"
                    value={pct}
                    size={72}
                    thickness={5}
                    sx={{ color, position: 'absolute' }}
                />
                <Box sx={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1, color }}>
                        {nota}
                    </Typography>
                    <Typography sx={{ fontSize: '0.55rem', color: 'text.disabled', lineHeight: 1 }}>
                        /20
                    </Typography>
                </Box>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textAlign: 'center', fontSize: '0.68rem' }}>
                {label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem' }}>
                Mín. {notaMin}/20
            </Typography>
        </Box>
    )
}

const CertificateSection = ({ cursoId }: CertificateSectionProps) => {
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [certificado, setCertificado] = useState<CertificateData | null>(null)
    const [elegibilidad, setElegibilidad] = useState<Elegibilidad | null>(null)
    const [fetchError, setFetchError] = useState(false)
    const [pagoPendiente, setPagoPendiente] = useState(false)
    const [precioCertificado, setPrecioCertificado] = useState<number | null>(null)
    const [cursoTitulo, setCursoTitulo] = useState<string | null>(null)
    const [whatsappNumero, setWhatsappNumero] = useState<string | null>(null)
    const autoGeneradoRef = useRef(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setFetchError(false)

                const [res, resPago] = await Promise.all([
                    axios.get(`/api/estudiante/certificado?cursoId=${cursoId}`),
                    axios.get('/api/metodos-pago').catch(() => null)
                ])

                if (res.data.status) {
                    setCertificado(res.data.result.certificado ?? null)
                    setElegibilidad(res.data.result.elegibilidad ?? null)
                    setPagoPendiente(res.data.result.pagoPendiente ?? false)
                    setPrecioCertificado(res.data.result.precioCertificado ?? null)
                    setCursoTitulo(res.data.result.cursoTitulo ?? null)
                    setWhatsappNumero(resPago?.data?.result?.whatsapp_numero || null)
                } else {
                    setFetchError(true)
                }
            } catch {
                setFetchError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [cursoId])

    // Auto-generar si no hay evaluaciones, está al 100% y no hay pago pendiente
    useEffect(() => {
        if (
            !loading &&
            !certificado &&
            !pagoPendiente &&
            elegibilidad?.isEligible &&
            elegibilidad?.totalExamenes === 0 &&
            !autoGeneradoRef.current
        ) {
            autoGeneradoRef.current = true
            setGenerating(true)
            axios.post('/api/estudiante/certificado', { cursoId })
                .then(res => {
                    if (res.data.status) setCertificado(res.data.result.certificado)
                })
                .catch(() => {})
                .finally(() => setGenerating(false))
        }
    }, [loading, certificado, pagoPendiente, elegibilidad, cursoId])

    const handleGenerar = async () => {
        setGenerating(true)

        try {
            const res = await axios.post('/api/estudiante/certificado', { cursoId })

            if (res.data.status) {
                setCertificado(res.data.result.certificado)
                toast.success('🎓 ¡Certificado generado exitosamente!')
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al generar el certificado')
        } finally {
            setGenerating(false)
        }
    }

    const handleDescargar = async () => {
        if (!certificado) return

        setDownloading(true)

        try {
            const res = await axios.get(`/api/estudiante/certificado/${certificado.id}/pdf`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')

            link.href = url
            link.setAttribute('download', `certificado-${certificado.codigoVerificacion}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Certificado descargado correctamente')
        } catch {
            toast.error('Error al descargar el certificado')
        } finally {
            setDownloading(false)
        }
    }

    // ── Wrapper visual ──────────────────────────────────────────────
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        const hasPago = pagoPendiente && !certificado

        const borderColor = certificado
            ? 'success.light'
            : hasPago
                ? '#f59e0b'
                : elegibilidad?.isEligible
                    ? 'primary.light'
                    : 'divider'

        const headerBg = certificado
            ? 'rgba(22,163,74,0.06)'
            : hasPago
                ? 'rgba(245,158,11,0.06)'
                : elegibilidad?.isEligible
                    ? 'rgba(2,94,68,0.06)'
                    : 'rgba(0,0,0,0.02)'

        const iconBg = certificado
            ? 'rgba(22,163,74,0.12)'
            : hasPago
                ? 'rgba(245,158,11,0.12)'
                : 'rgba(2,94,68,0.1)'

        const iconColor = certificado ? '#16a34a' : hasPago ? '#d97706' : '#025E44'

        const subtitle = certificado
            ? 'Certificado de finalización obtenido'
            : hasPago
                ? 'Requiere pago para obtenerlo'
                : elegibilidad?.isEligible
                    ? '¡Puedes obtener tu certificado!'
                    : 'Completa el curso para obtenerlo'

        return (
            <Box sx={{
                mt: 3,
                borderRadius: '16px',
                border: '1.5px solid',
                borderColor,
                overflow: 'hidden',
            }}>
                {/* Header band */}
                <Box sx={{
                    px: 3, py: 1.5,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: headerBg,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: iconBg
                    }}>
                        <i className="tabler-certificate" style={{ fontSize: '1.25rem', color: iconColor }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Tu Certificado
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </Box>
                    {certificado && (
                        <Chip
                            size="small"
                            icon={<i className="tabler-circle-check-filled" style={{ fontSize: '0.85rem' }} />}
                            label="Obtenido"
                            color="success"
                            sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.72rem' }}
                        />
                    )}
                    {hasPago && (
                        <Chip
                            size="small"
                            icon={<i className="tabler-lock" style={{ fontSize: '0.85rem' }} />}
                            label="Pago requerido"
                            color="warning"
                            sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.72rem' }}
                        />
                    )}
                </Box>

                {/* Body */}
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            </Box>
        )
    }

    // ── Loading ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ mt: 3, borderRadius: '16px', border: '1.5px solid', borderColor: 'divider', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">Verificando certificado...</Typography>
            </Box>
        )
    }

    // ── Error de red ─────────────────────────────────────────────────
    if (fetchError) {
        return (
            <Box sx={{ mt: 3, borderRadius: '16px', border: '1.5px solid', borderColor: 'divider', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="tabler-certificate" style={{ fontSize: '1.1rem', color: '#94a3b8' }} />
                </Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Tu Certificado</Typography>
                    <Typography variant="caption" color="text.secondary">
                        No se pudo verificar el estado. <span style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--mui-palette-primary-main)' }} onClick={() => window.location.reload()}>Recargar</span>
                    </Typography>
                </Box>
            </Box>
        )
    }

    // ── Ya tiene certificado ────────────────────────────────────────
    if (certificado) {
        return (
            <Wrapper>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 3 }}>
                    {/* Ícono decorativo */}
                    <Box sx={{
                        width: 80, height: 80, borderRadius: '20px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <i className="tabler-award" style={{ fontSize: '2.2rem', color: '#fff' }} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.dark', mb: 0.5 }}>
                            ¡Felicidades!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {certificado.nombreCompleto} · Emitido el{' '}
                            <HydratedDate date={certificado.emitidoEn} options={{ day: '2-digit', month: 'long', year: 'numeric' }} />
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
                            <i className="tabler-fingerprint" style={{ fontSize: '0.85rem', color: '#64748b' }} />
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', fontSize: '0.72rem' }}>
                                {certificado.codigoVerificacion}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleDescargar}
                                disabled={downloading}
                                startIcon={downloading ? <CircularProgress size={14} color="inherit" /> : <i className="tabler-download" />}
                                sx={{ bgcolor: '#025E44', borderRadius: '10px', textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: '#014d36', boxShadow: 'none' } }}
                            >
                                {downloading ? 'Descargando...' : 'Descargar PDF'}
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                href={`/verificar-certificado/${certificado.codigoVerificacion}`}
                                target="_blank"
                                startIcon={<i className="tabler-external-link" />}
                                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                            >
                                Verificar
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Wrapper>
        )
    }

    // ── Certificado con costo pendiente de pago ─────────────────────
    if (pagoPendiente) {
        const moneda = 'S/'
        const precioFmt = precioCertificado ? `${moneda} ${Number(precioCertificado).toFixed(2)}` : ''

        const waUrl = whatsappNumero
            ? `https://wa.me/${whatsappNumero.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, quiero obtener mi certificado del curso "${cursoTitulo || ''}"${precioFmt ? ` (${precioFmt})` : ''}. Por favor, indícame los pasos para realizar el pago.`)}`
            : null

        return (
            <Wrapper>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 3 }}>
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '18px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <i className="tabler-lock" style={{ fontSize: '2rem', color: '#fff' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#d97706' }}>
                                Certificado disponible
                            </Typography>
                            {precioFmt && (
                                <Chip
                                    size="small"
                                    label={precioFmt}
                                    sx={{
                                        bgcolor: 'rgba(245,158,11,0.12)',
                                        color: '#d97706',
                                        fontWeight: 800,
                                        fontSize: '0.8rem'
                                    }}
                                />
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Has completado el curso. Para obtener tu certificado, realiza el pago
                            {precioFmt ? ` de ${precioFmt}` : ''} y comunícate con nosotros para que habilitemos tu descarga.
                        </Typography>
                        {waUrl && (
                            <Button
                                component="a"
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="contained"
                                size="small"
                                startIcon={<i className="tabler-brand-whatsapp" />}
                                sx={{
                                    bgcolor: '#d97706',
                                    color: '#fff',
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#b45309', boxShadow: 'none' }
                                }}
                            >
                                Contactar asesor
                            </Button>
                        )}
                    </Box>
                </Box>
            </Wrapper>
        )
    }

    // ── No tiene certificado — mostrar estado de elegibilidad ───────
    const el = elegibilidad

    // Si no hay datos de elegibilidad, mostrar estado neutro
    if (!el) {
        return (
            <Wrapper>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <i className="tabler-certificate" style={{ fontSize: '1.5rem', color: '#94a3b8' }} />
                    <Typography variant="body2" color="text.secondary">
                        Completa todas las lecciones y evaluaciones del curso para obtener tu certificado.
                    </Typography>
                </Box>
            </Wrapper>
        )
    }

    const progresoColor = el.progreso >= 100 ? '#16a34a' : '#d97706'

    return (
        <Wrapper>
            {el.isEligible ? (

                /* Elegible */
                <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2,
                        background: 'linear-gradient(135deg, #025E44 0%, #3AB079 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {generating
                            ? <CircularProgress size={32} sx={{ color: '#fff' }} />
                            : <i className="tabler-award" style={{ fontSize: '2rem', color: '#fff' }} />
                        }
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                        {generating ? 'Preparando tu certificado...' : '¡Lo lograste! Obtén tu certificado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {generating
                            ? 'Estamos generando tu certificado automáticamente.'
                            : 'Has completado todas las lecciones y alcanzado el promedio requerido.'
                        }
                    </Typography>
                    {/* Sin exámenes → auto-generado, no se muestra el botón */}
                    {el.totalExamenes > 0 && (
                        <Button
                            variant="contained"
                            onClick={handleGenerar}
                            disabled={generating}
                            startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <i className="tabler-certificate" />}
                            sx={{
                                bgcolor: '#025E44', borderRadius: '12px', textTransform: 'none',
                                fontWeight: 700, fontSize: '0.95rem', px: 4, py: 1.25,
                                boxShadow: 'none', '&:hover': { bgcolor: '#014d36', boxShadow: 'none' }
                            }}
                        >
                            {generating ? 'Generando certificado...' : 'Obtener mi Certificado'}
                        </Button>
                    )}
                </Box>
            ) : (

                /* No elegible → mostrar progreso */
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        Para obtener el certificado debes completar todas las lecciones
                        {el.totalExamenes > 0 ? ' y alcanzar el promedio mínimo en las evaluaciones.' : '.'}
                    </Typography>

                    {/* Progreso de lecciones */}
                    <Box sx={{ mb: el.totalExamenes > 0 ? 2 : 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                {el.progreso >= 100
                                    ? <i className="tabler-circle-check-filled" style={{ fontSize: '1rem', color: '#16a34a' }} />
                                    : <i className="tabler-circle" style={{ fontSize: '1rem', color: '#94a3b8' }} />
                                }
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Lecciones completadas</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: progresoColor }}>
                                {el.progreso}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={el.progreso}
                            sx={{
                                height: 7, borderRadius: 4,
                                bgcolor: 'action.hover',
                                '& .MuiLinearProgress-bar': { bgcolor: progresoColor, borderRadius: 4 }
                            }}
                        />
                    </Box>

                    {/* Evaluaciones */}
                    {el.totalExamenes > 0 && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                        {el.promedioScore >= el.promedioMinimo
                                            ? <i className="tabler-circle-check-filled" style={{ fontSize: '1rem', color: '#16a34a' }} />
                                            : <i className="tabler-circle" style={{ fontSize: '1rem', color: '#94a3b8' }} />
                                        }
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                            Promedio de evaluaciones
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Las evaluaciones no realizadas cuentan como 0.{' '} Usted tiene {' '}
                                        <span style={{ fontWeight: 700 }}>
                                            {el.totalExamenes} evaluaci{el.totalExamenes !== 1 ? 'ones' : 'ón'}
                                        </span> registradas en total.
                                    </Typography>
                                </Box>
                                <ScoreRing
                                    value={el.promedioScore}
                                    min={el.promedioMinimo}
                                    label="Tu promedio"
                                />
                            </Box>
                        </>
                    )}
                </Box>
            )}
        </Wrapper>
    )
}

export default CertificateSection
