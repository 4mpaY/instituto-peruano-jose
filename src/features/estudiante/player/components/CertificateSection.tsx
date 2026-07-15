'use client'

import { useState, useEffect, useRef } from 'react'

import axios from 'axios'
import { toast } from 'react-toastify'
import {
    Box, Typography, Button, CircularProgress, LinearProgress, Chip, Divider
} from '@mui/material'

import HydratedDate from '@/utils/components/HydratedDate'
import AppModal from '@/utils/components/AppModal'

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

interface PlantillaPreview {
    id: string
    nombre: string
    thumbnail: string
    habilitado: boolean
    certificadoId?: string | null
    codigoVerificacion?: string | null
    emitidoEn?: string | null
}

const CertificadoPreviewGrid = ({
    plantillas,
    onDownload,
    downloadingPlantilla,
    onCardClick,
}: {
    plantillas: PlantillaPreview[]
    onDownload?: (plantillaId: string) => void
    downloadingPlantilla?: string | null
    onCardClick?: (plantilla: PlantillaPreview) => void
}) => {
    const habilitadas = plantillas.filter(p => p.habilitado)

    if (habilitadas.length === 0) return null

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1.5 }}>
                Certificados habilitados
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: habilitadas.length > 1 ? '1fr 1fr' : '1fr' }, gap: 2 }}>
                {habilitadas.map((p) => (
                    <Box
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onCardClick?.(p)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') onCardClick?.(p)
                        }}
                        sx={{
                            position: 'relative',
                            aspectRatio: '297 / 210',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '2px solid',
                            borderColor: p.id === 'colegio_ingenieros' ? 'error.light' : 'success.light',
                            boxShadow: 1,
                            cursor: onCardClick ? 'pointer' : 'default',
                            backgroundImage: `url(${p.thumbnail})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': onCardClick ? { transform: 'translateY(-2px)', boxShadow: 4 } : undefined,
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                background: p.id === 'colegio_ingenieros'
                                    ? 'linear-gradient(to top, rgba(220,38,38,0.82) 0%, rgba(220,38,38,0.28) 42%, rgba(0,0,0,0.04) 100%)'
                                    : 'linear-gradient(to top, rgba(22,163,74,0.82) 0%, rgba(22,163,74,0.28) 42%, rgba(0,0,0,0.04) 100%)',
                            }}
                        />
                        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: 1.5, zIndex: 1 }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: '#fff', display: 'block', mb: onDownload ? 1 : 0 }}>
                                {p.nombre}
                            </Typography>
                            {onDownload && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDownload(p.id)
                                    }}
                                    disabled={downloadingPlantilla === p.id}
                                    startIcon={downloadingPlantilla === p.id
                                        ? <CircularProgress size={12} color="inherit" />
                                        : <i className="tabler-download" />
                                    }
                                    sx={{
                                        bgcolor: '#fff',
                                        color: p.id === 'colegio_ingenieros' ? 'error.main' : 'success.dark',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.68rem',
                                        py: 0.25,
                                        boxShadow: 'none',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)', boxShadow: 'none' },
                                    }}
                                >
                                    {downloadingPlantilla === p.id ? 'Descargando...' : 'Descargar PDF'}
                                </Button>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}

const CertificadoPreviewModal = ({
    open,
    onClose,
    plantilla,
    certificadoId,
    onDownload,
    downloading,
}: {
    open: boolean
    onClose: () => void
    plantilla: PlantillaPreview | null
    certificadoId?: string
    onDownload?: (plantillaId: string) => void
    downloading?: boolean
}) => {
    const [previewLoading, setPreviewLoading] = useState(false)

    const previewSrc =
        open && plantilla && certificadoId
            ? `/api/estudiante/certificado/${certificadoId}/pdf?preview=true`
            : null

    useEffect(() => {
        if (previewSrc) setPreviewLoading(true)
    }, [previewSrc])

    const handleClose = () => {
        onClose()
    }

    if (!plantilla) return null

    const accentColor = plantilla.id === 'colegio_ingenieros' ? 'error.main' : 'success.main'

    return (
        <AppModal open={open} handleClose={handleClose} sx={{ maxWidth: 960, width: 'calc(100% - 32px)', p: { xs: 3, sm: 4 } }}>
            <Box sx={{ pr: 4, mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                    {plantilla.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Vista previa del certificado
                </Typography>
            </Box>

            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '297 / 210',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {previewLoading && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, position: 'absolute' }}>
                        <CircularProgress size={36} />
                        <Typography variant="body2" color="text.secondary">
                            Generando vista previa...
                        </Typography>
                    </Box>
                )}
                {previewSrc ? (
                    <iframe
                        src={previewSrc}
                        title={`Vista previa ${plantilla.nombre}`}
                        style={{ width: '100%', height: '100%', border: 'none', display: previewLoading ? 'none' : 'block' }}
                        onLoad={() => setPreviewLoading(false)}
                    />
                ) : (
                    <Box
                        component="img"
                        src={plantilla.thumbnail}
                        alt={plantilla.nombre}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                )}
            </Box>

            {certificadoId && onDownload && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
                    <Button
                        variant="contained"
                        onClick={() => onDownload(plantilla.id)}
                        disabled={downloading}
                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <i className="tabler-download" />}
                        sx={{
                            bgcolor: accentColor,
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 700,
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 'none', opacity: 0.9 },
                        }}
                    >
                        {downloading ? 'Descargando...' : 'Descargar PDF'}
                    </Button>
                </Box>
            )}
        </AppModal>
    )
}

interface CertificateSectionProps {
    cursoId: string
    completarAutomatico?: boolean
    onAllLessonsCompleted?: () => void
    phoneNumberProfesor?: string
}

const ScoreRing = ({ value, min, label }: { value: number; min: number; label: string }) => {
    const nota = Math.round((value / 100) * 20 * 10) / 10
    const notaMin = Math.round((min / 100) * 20 * 10) / 10
    const pct = Math.min(100, Math.round(value))
    const approved = value >= min
    const color = approved ? '#16a34a' : value >= min * 0.6 ? '#d97706' : '#dc2626'

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: 'center', gap: 1 }}>
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
            <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textAlign: { xs: 'left', sm: 'center' }, fontSize: '0.68rem', display: 'block' }}>
                    {label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', display: 'block', textAlign: { xs: 'left', sm: 'center' } }}>
                    Mín. {notaMin}/20
                </Typography>
            </Box>
        </Box>
    )
}

const CertificateSection = ({ cursoId, completarAutomatico, onAllLessonsCompleted, phoneNumberProfesor }: CertificateSectionProps) => {
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [completandoTodo, setCompletandoTodo] = useState(false)
    const [certificado, setCertificado] = useState<CertificateData | null>(null)
    const [elegibilidad, setElegibilidad] = useState<Elegibilidad | null>(null)
    const [fetchError, setFetchError] = useState(false)
    const [pagoPendiente, setPagoPendiente] = useState(false)
    const [plantillasPreview, setPlantillasPreview] = useState<PlantillaPreview[]>([])
    const [downloadingPlantilla, setDownloadingPlantilla] = useState<string | null>(null)
    const [previewPlantilla, setPreviewPlantilla] = useState<PlantillaPreview | null>(null)
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
                    setPlantillasPreview(res.data.result.plantillasPreview ?? [])
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
                .catch(() => { })
                .finally(() => setGenerating(false))
        }
    }, [loading, certificado, pagoPendiente, elegibilidad, cursoId])

    const handleCompletarTodo = async () => {
        setCompletandoTodo(true)

        try {
            await axios.post('/api/estudiante/progreso/completar-todo', { cursoId })
            toast.success('¡Todas las lecciones completadas!')
            onAllLessonsCompleted?.()
            const res = await axios.get(`/api/estudiante/certificado?cursoId=${cursoId}`)

            if (res.data.status) {
                setElegibilidad(res.data.result.elegibilidad ?? null)
                setPagoPendiente(res.data.result.pagoPendiente ?? false)
                setPlantillasPreview(res.data.result.plantillasPreview ?? [])
                setCertificado(res.data.result.certificado ?? null)
                autoGeneradoRef.current = false
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al completar las lecciones')
        } finally {
            setCompletandoTodo(false)
        }
    }

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

    const buildPdfDownloadUrl = (certificadoId: string) => {
        const params = new URLSearchParams({ _t: String(Date.now()) })

        return `/api/estudiante/certificado/${certificadoId}/pdf?${params.toString()}`
    }

    const handleDescargar = async (plantillaId?: string) => {
        let targetCertId = certificado?.id
        let codigoParaArchivo = certificado?.codigoVerificacion

        if (plantillaId) {
            const item = plantillasPreview.find(p => p.id === plantillaId)

            targetCertId = item?.certificadoId ?? undefined

            if (!targetCertId && item?.habilitado) {
                setDownloadingPlantilla(plantillaId)

                try {
                    const tipo = plantillaId === 'colegio_ingenieros' ? 'CIP' : 'IPG'
                    const res = await axios.post('/api/estudiante/certificado', { cursoId, tipo })

                    if (res.data.status) {
                        targetCertId = res.data.result.certificado.id
                        codigoParaArchivo = res.data.result.certificado.codigoVerificacion
                        setPlantillasPreview(prev => prev.map(p => (p.id === plantillaId
                            ? { ...p, certificadoId: targetCertId, codigoVerificacion: res.data.result.certificado.codigoVerificacion, emitidoEn: res.data.result.certificado.emitidoEn }
                            : p)))
                    }
                } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Error al generar el certificado')
                    setDownloadingPlantilla(null)

                    return
                }
            }
        }

        if (!targetCertId) return

        setDownloading(true)
        if (plantillaId) setDownloadingPlantilla(plantillaId)

        const suffix = plantillaId === 'colegio_ingenieros' ? '-cip' : plantillaId === 'minimalista' ? '-ipg' : ''
        const url = buildPdfDownloadUrl(targetCertId)
        const filename = `certificado${suffix}-${codigoParaArchivo ?? targetCertId}.pdf`

        const link = document.createElement('a')

        link.href = url
        link.setAttribute('download', filename)
        link.rel = 'noopener'
        document.body.appendChild(link)
        link.click()
        link.remove()

        toast.success('Descarga iniciada')

        window.setTimeout(() => {
            setDownloading(false)
            setDownloadingPlantilla(null)
        }, 1200)
    }

    const tienePreviewsHabilitados = plantillasPreview.some(p => p.habilitado)

    const previewModal = (
        <CertificadoPreviewModal
            open={!!previewPlantilla}
            onClose={() => setPreviewPlantilla(null)}
            plantilla={previewPlantilla}
            certificadoId={previewPlantilla?.certificadoId ?? undefined}
            onDownload={handleDescargar}
            downloading={downloadingPlantilla === previewPlantilla?.id}
        />
    )

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

    // ── Certificado con costo pendiente de pago (antes que certificado emitido) ──
    if (pagoPendiente && elegibilidad?.isEligible) {
        const phone = (phoneNumberProfesor || whatsappNumero || '').replace(/\D/g, '')

        const waUrl = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, quiero obtener mi certificado del curso "${cursoTitulo || ''}". Por favor, indícame los pasos para realizar el pago.`)}`
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
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                            Has completado el curso. Para solicitar la emisión de tu certificado, es necesario haber aprobado satisfactoriamente el curso y realizar el pago correspondiente. Posteriormente, deberás comunicarte con nosotros para habilitar la descarga de tu certificado.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
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
                                    Ver más detalles
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Wrapper>
        )
    }

    // ── Ya tiene certificado ────────────────────────────────────────
    if (certificado && elegibilidad?.isEligible) {
        const obtenidas = tienePreviewsHabilitados
            ? plantillasPreview.filter(p => p.habilitado)
            : [{ id: '', nombre: '', thumbnail: '', habilitado: true, certificadoId: certificado.id, codigoVerificacion: certificado.codigoVerificacion, emitidoEn: certificado.emitidoEn }]

        return (
            <>
                <Wrapper>
                    {obtenidas.map((p, idx) => {
                        const esCip = p.id === 'colegio_ingenieros'
                        const accentDark = esCip ? '#b91c1c' : '#025E44'

                        const gradient = esCip
                            ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                            : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'

                        return (
                            <Box
                                key={p.id || 'principal'}
                                sx={{
                                    display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 3,
                                    ...(idx > 0 ? { mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' } : {})
                                }}
                            >
                                <Box sx={{
                                    width: 80, height: 80, borderRadius: '20px', flexShrink: 0,
                                    background: gradient,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <i className="tabler-award" style={{ fontSize: '2.2rem', color: '#fff' }} />
                                </Box>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: esCip ? 'error.dark' : 'success.dark', mb: 0.5 }}>
                                        ¡Felicidades!{p.nombre ? ` — ${p.nombre}` : ''}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                        {p.emitidoEn
                                            ? <>{certificado.nombreCompleto} · Emitido el{' '}
                                                <HydratedDate date={p.emitidoEn} options={{ day: '2-digit', month: 'long', year: 'numeric' }} /></>
                                            : 'Certificado disponible para descargar'}
                                    </Typography>
                                    {p.codigoVerificacion && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
                                            <i className="tabler-fingerprint" style={{ fontSize: '0.85rem', color: '#64748b' }} />
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', fontSize: '0.72rem' }}>
                                                {p.codigoVerificacion}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => handleDescargar(p.id || undefined)}
                                            disabled={p.id ? downloadingPlantilla === p.id : downloading}
                                            startIcon={(p.id ? downloadingPlantilla === p.id : downloading)
                                                ? <CircularProgress size={14} color="inherit" />
                                                : <i className="tabler-download" />
                                            }
                                            sx={{ bgcolor: accentDark, borderRadius: '10px', textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { bgcolor: accentDark, opacity: 0.9, boxShadow: 'none' } }}
                                        >
                                            {(p.id ? downloadingPlantilla === p.id : downloading) ? 'Descargando...' : 'Descargar PDF'}
                                        </Button>
                                        {p.codigoVerificacion && (
                                            <Button
                                                component="a"
                                                href={`/verificar-certificado/${p.codigoVerificacion}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                variant="outlined"
                                                size="small"
                                                color={esCip ? 'error' : 'success'}
                                                startIcon={<i className="tabler-shield-check" />}
                                                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                                            >
                                                Verificar
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        )
                    })}
                </Wrapper>
                {previewModal}
            </>
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
        <>
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

                    {/* Botón de completado automático */}
                    {completarAutomatico && el.progreso < 100 && (
                        <Box sx={{ mt: 2.5 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleCompletarTodo}
                                disabled={completandoTodo}
                                startIcon={completandoTodo
                                    ? <CircularProgress size={18} color="inherit" />
                                    : <i className="tabler-checks" />
                                }
                                sx={{
                                    bgcolor: '#025E44', borderRadius: '12px', textTransform: 'none',
                                    fontWeight: 700, boxShadow: 'none',
                                    '&:hover': { bgcolor: '#014d36', boxShadow: 'none' }
                                }}
                            >
                                {completandoTodo ? 'Completando...' : 'Completar todas las lecciones'}
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
            </Wrapper>
            {el.isEligible && tienePreviewsHabilitados && (
                <CertificadoPreviewGrid
                    plantillas={plantillasPreview}
                    onDownload={handleDescargar}
                    downloadingPlantilla={downloadingPlantilla}
                    onCardClick={setPreviewPlantilla}
                />
            )}
            {previewModal}
        </>
    )
}

export default CertificateSection
