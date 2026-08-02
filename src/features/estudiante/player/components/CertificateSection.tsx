'use client'

import { useState, useEffect, useRef } from 'react'

import axios from 'axios'
import { toast } from 'react-toastify'
import {
    Box, Typography, Button, CircularProgress, LinearProgress, Chip, Divider
} from '@mui/material'

import HydratedDate from '@/utils/components/HydratedDate'
import AppModal from '@/utils/components/AppModal'
import CompleteProfileModal from './CompleteProfileModal'
import TramiteCertificadoFlow, { type TramiteCertificadoCursoInfo } from './TramiteCertificadoFlow'

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
    puedeTramitar?: boolean
    evaluacionesOk?: boolean
    totalExamenes: number
}

interface PlantillaPreview {
    id: string
    nombre: string
    thumbnail: string
    habilitado: boolean
    enEspera?: boolean
    disponibleDesde?: string | Date | null
    mensajeEspera?: string | null
    certificadoId?: string | null
    codigoVerificacion?: string | null
    emitidoEn?: string | null
}

interface SolicitudCertPendiente {
    pedidoId: string
    numeroPedido: number
    certificadoTipo: 'IPG' | 'CIP' | string
    total: number
    creadoEn?: string | Date
    tieneComprobante?: boolean
    etiquetaEntrega?: string
    disponibleDesde?: string | Date | null
    nombreTipo?: string
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
    const enEspera = plantillas.filter(p => p.enEspera && !p.habilitado)

    if (habilitadas.length === 0 && enEspera.length === 0) return null

    return (
        <Box sx={{ mt: 3 }}>
            {enEspera.length > 0 && (
                <Box sx={{ mb: habilitadas.length > 0 ? 2.5 : 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1.5 }}>
                        Certificados en espera
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                        {enEspera.map(p => (
                            <Box
                                key={`espera-${p.id}`}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'warning.light',
                                    bgcolor: 'rgba(245,158,11,0.06)',
                                    display: 'flex',
                                    gap: 1.5,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <i className="tabler-clock" style={{ fontSize: '1.25rem', color: '#d97706', marginTop: 2 }} />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700}>{p.nombre}</Typography>
                                    {p.disponibleDesde ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Disponible desde{' '}
                                            <HydratedDate
                                                date={p.disponibleDesde}
                                                options={{
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }}
                                            />
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            {p.mensajeEspera || 'Tu certificado aún no está disponible.'}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {habilitadas.length > 0 && (
            <>
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
            </>
            )}
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
    const [documentoCompleto, setDocumentoCompleto] = useState(false)
    const [tramitarDisponible, setTramitarDisponible] = useState(false)

    const [tiposTramitables, setTiposTramitables] = useState<{ ipg: boolean; cip: boolean }>({
        ipg: false,
        cip: false,
    })

    const [cursoCertificacion, setCursoCertificacion] = useState<TramiteCertificadoCursoInfo | null>(null)
    const [showTramite, setShowTramite] = useState(false)
    const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudCertPendiente[]>([])
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
                    setDocumentoCompleto(res.data.result.documentoCompleto ?? false)
                    setTramitarDisponible(!!res.data.result.tramitarDisponible)
                    setTiposTramitables({
                        ipg: !!res.data.result.tiposTramitables?.ipg,
                        cip: !!res.data.result.tiposTramitables?.cip,
                    })
                    setCursoCertificacion(res.data.result.cursoCertificacion ?? null)
                    setSolicitudesPendientes(res.data.result.solicitudesPendientes ?? [])
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

    const plantillasEnEspera = plantillasPreview.filter(p => p.enEspera && !p.habilitado)
    const plantillasHabilitadas = plantillasPreview.filter(p => p.habilitado)
    const hayEsperaActiva = plantillasEnEspera.length > 0

    const refreshCertificadoState = async () => {
        const res = await axios.get(`/api/estudiante/certificado?cursoId=${cursoId}`)

        if (res.data.status) {
            setCertificado(res.data.result.certificado ?? null)
            setElegibilidad(res.data.result.elegibilidad ?? null)
            setPagoPendiente(res.data.result.pagoPendiente ?? false)
            setPlantillasPreview(res.data.result.plantillasPreview ?? [])
            setCursoTitulo(res.data.result.cursoTitulo ?? null)
            setDocumentoCompleto(res.data.result.documentoCompleto ?? false)
            setTramitarDisponible(!!res.data.result.tramitarDisponible)
            setTiposTramitables({
                ipg: !!res.data.result.tiposTramitables?.ipg,
                cip: !!res.data.result.tiposTramitables?.cip,
            })
            setCursoCertificacion(res.data.result.cursoCertificacion ?? null)
            setSolicitudesPendientes(res.data.result.solicitudesPendientes ?? [])
        }

        return res
    }

    // Auto-generar si no hay evaluaciones, está al 100% y no hay pago/espera pendiente
    useEffect(() => {
        if (
            !loading &&
            !certificado &&
            !pagoPendiente &&
            !hayEsperaActiva &&
            elegibilidad?.isEligible &&
            elegibilidad?.totalExamenes === 0 &&
            !autoGeneradoRef.current
        ) {
            autoGeneradoRef.current = true
            setGenerating(true)
            axios.post('/api/estudiante/certificado', { cursoId })
                .then(async res => {
                    if (res.data.status) await refreshCertificadoState()
                })
                .catch(() => { })
                .finally(() => setGenerating(false))
        }
    }, [loading, certificado, pagoPendiente, hayEsperaActiva, elegibilidad, cursoId])

    const handleCompletarTodo = async () => {
        setCompletandoTodo(true)

        try {
            await axios.post('/api/estudiante/progreso/completar-todo', { cursoId })
            toast.success('¡Todas las lecciones completadas!')
            onAllLessonsCompleted?.()
            await refreshCertificadoState()
            autoGeneradoRef.current = false
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al completar las lecciones')
        } finally {
            setCompletandoTodo(false)
        }
    }

    const [showProfileModal, setShowProfileModal] = useState(false)
    const [pendingAction, setPendingAction] = useState<{ type: 'generar' | 'descargar', plantillaId?: string } | null>(null)

    const handleGenerar = async (force: boolean = false) => {
        if (!force && !documentoCompleto) {
            setPendingAction({ type: 'generar' })
            setShowProfileModal(true)
            
            return
        }

        setGenerating(true)

        try {
            const res = await axios.post('/api/estudiante/certificado', { cursoId })

            if (res.data.status) {
                await refreshCertificadoState()
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

    const handleDescargar = async (plantillaId?: string, force: boolean = false) => {
        if (!force && !documentoCompleto) {
            setPendingAction({ type: 'descargar', plantillaId })
            setShowProfileModal(true)

            return
        }

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

    const tienePreviewsHabilitados = plantillasHabilitadas.length > 0 || hayEsperaActiva

    // Solo "obtenido" si alguna plantilla está realmente liberada (respeta deshabilitación admin)
    const certificadoListoParaMostrar = plantillasHabilitadas.length > 0

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
        const hasSolicitudEnviada = solicitudesPendientes.length > 0 && !certificadoListoParaMostrar
        const hasPago = pagoPendiente && !certificadoListoParaMostrar && !showTramite && !hasSolicitudEnviada
        const enEspera = hayEsperaActiva && !certificadoListoParaMostrar
        const enTramite = showTramite

        const borderColor = certificadoListoParaMostrar
            ? 'success.light'
            : hasSolicitudEnviada
                ? 'success.light'
            : enEspera || hasPago || enTramite
                ? '#f59e0b'
                : elegibilidad?.isEligible
                    ? 'primary.light'
                    : 'divider'

        const headerBg = certificadoListoParaMostrar || hasSolicitudEnviada
            ? 'rgba(22,163,74,0.06)'
            : enEspera || hasPago || enTramite
                ? 'rgba(245,158,11,0.06)'
                : elegibilidad?.isEligible
                    ? 'rgba(2,94,68,0.06)'
                    : 'rgba(0,0,0,0.02)'

        const iconBg = certificadoListoParaMostrar || hasSolicitudEnviada
            ? 'rgba(22,163,74,0.12)'
            : enEspera || hasPago || enTramite
                ? 'rgba(245,158,11,0.12)'
                : 'rgba(2,94,68,0.1)'

        const iconColor = certificadoListoParaMostrar || hasSolicitudEnviada
            ? '#16a34a'
            : enEspera || hasPago || enTramite
                ? '#d97706'
                : '#025E44'

        const subtitle = certificadoListoParaMostrar
            ? 'Certificado de finalización obtenido'
            : enTramite
                ? 'Completa el trámite de tu certificado'
                : solicitudesPendientes.length > 0
                    ? 'Solicitud enviada — pendiente de validación'
                : enEspera
                    ? (plantillasEnEspera[0]?.disponibleDesde
                        ? 'En proceso de emisión'
                        : (plantillasEnEspera[0]?.mensajeEspera || 'Tu certificado está en proceso de emisión'))
                    : hasPago
                        ? 'Requiere pago para obtenerlo'
                        : elegibilidad?.isEligible
                            ? '¡Puedes obtener tu certificado!'
                            : 'Completa el curso para obtenerlo'

        return (
            <Box
                sx={{
                    mt: 3,
                    borderRadius: '16px',
                    border: '1.5px solid',
                    borderColor,
                    overflow: 'hidden',
                }}
            >
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
                        <i className={enEspera ? 'tabler-clock' : hasSolicitudEnviada ? 'tabler-send' : 'tabler-certificate'} style={{ fontSize: '1.25rem', color: iconColor }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            Tu Certificado
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </Box>
                    {certificadoListoParaMostrar && (
                        <Chip
                            size="small"
                            icon={<i className="tabler-circle-check-filled" style={{ fontSize: '0.85rem' }} />}
                            label="Obtenido"
                            color="success"
                            sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.72rem' }}
                        />
                    )}
                    {hasSolicitudEnviada && !certificadoListoParaMostrar && (
                        <Chip
                            size="small"
                            icon={<i className="tabler-send" style={{ fontSize: '0.85rem' }} />}
                            label="Enviado"
                            color="success"
                            sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}
                        />
                    )}
                    {enEspera && (
                        <Chip
                            size="small"
                            icon={<i className="tabler-clock" style={{ fontSize: '0.85rem' }} />}
                            label="En espera"
                            color="warning"
                            sx={{ ml: 'auto', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}
                        />
                    )}
                    {hasPago && !enEspera && !hasSolicitudEnviada && (
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

    // ── Flujo de trámite de certificado (pago como pedido) ───────────
    // Debe verse DENTRO de la pestaña Certificación (misma caja)
    const preciosCurso = cursoCertificacion
        ? [
            cursoCertificacion.precio_certificado_ipg,
            cursoCertificacion.precio_certificado_cip,
            cursoCertificacion.precio_certificado,
          ].some(p => p != null && Number(p) > 0)
        : false

    const evaluacionesAprobadas =
        !!elegibilidad?.evaluacionesOk ||
        !!elegibilidad?.puedeTramitar ||
        !!elegibilidad?.isEligible ||
        (elegibilidad != null &&
            (elegibilidad.totalExamenes === 0 ||
                Number(elegibilidad.promedioScore) >= Number(elegibilidad.promedioMinimo || 60)))

    const puedeTramitarCert =
        tramitarDisponible ||
        (evaluacionesAprobadas && (tiposTramitables.ipg || tiposTramitables.cip))

    const etiquetaAdquirirOtro = (() => {
        if (tiposTramitables.cip && !tiposTramitables.ipg) return 'Adquirir Certificado CIP'
        if (tiposTramitables.ipg && !tiposTramitables.cip) return 'Adquirir Certificado IPG'

        return 'Adquirir otro certificado'
    })()

    const mostrarTramiteCta =
        !certificadoListoParaMostrar &&
        !hayEsperaActiva &&
        !!cursoCertificacion &&
        preciosCurso &&
        puedeTramitarCert &&
        solicitudesPendientes.length === 0

    if (showTramite && cursoCertificacion) {
        return (
            <Wrapper>
                <TramiteCertificadoFlow
                    curso={cursoCertificacion}
                    tiposDisponibles={tiposTramitables}
                    onClose={() => setShowTramite(false)}
                    onSuccess={async () => {
                        setShowTramite(false)
                        await refreshCertificadoState()
                    }}
                />
            </Wrapper>
        )
    }

    // ── Solicitud ya enviada (pedido pendiente de validación) ─────────
    if (solicitudesPendientes.length > 0 && !certificadoListoParaMostrar) {
        return (
            <Wrapper>
                <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2,
                        background: 'linear-gradient(135deg, #025E44 0%, #3AB079 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <i className="tabler-send" style={{ fontSize: '2rem', color: '#fff' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                        ¡Formulario enviado!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 520, mx: 'auto' }}>
                        Tu solicitud de certificado fue registrada. El administrador validará el pago.
                        Cuando se apruebe, el certificado se habilitará según los tiempos de entrega configurados.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left', maxWidth: 520, mx: 'auto' }}>
                        {solicitudesPendientes.map(s => (
                            <Box
                                key={s.pedidoId}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'rgba(2,94,68,0.04)',
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
                                    Pedido #{s.numeroPedido} · {s.nombreTipo || s.certificadoTipo}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                                    Estado: <strong>Pendiente de validación de pago</strong>
                                    {s.tieneComprobante ? ' (comprobante recibido)' : ''}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {s.etiquetaEntrega || 'La fecha de entrega se confirmará al validar el pago.'}
                                </Typography>
                                {s.disponibleDesde && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                        Disponible estimado desde:{' '}
                                        <HydratedDate
                                            date={s.disponibleDesde}
                                            options={{
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            }}
                                        />
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>

                    {tramitarDisponible && (tiposTramitables.ipg || tiposTramitables.cip) && (
                        <Button
                            variant="outlined"
                            onClick={() => setShowTramite(true)}
                            sx={{ mt: 3, textTransform: 'none', fontWeight: 700 }}
                        >
                            {etiquetaAdquirirOtro}
                        </Button>
                    )}
                </Box>
            </Wrapper>
        )
    }

    // ── Certificado pendiente: tramitar aquí (no WhatsApp) ───────────
    if (mostrarTramiteCta) {
        return (
            <Wrapper>
                <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2,
                        background: 'linear-gradient(135deg, #025E44 0%, #3AB079 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <i className="tabler-certificate" style={{ fontSize: '2rem', color: '#fff' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                        ¿Desea tramitar su certificado?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
                        Ya aprobaste las evaluaciones. Confirma tus datos, elige el tipo de certificado (IPG o Colegio de Ingenieros) y realiza el pago. Validaremos tu solicitud en Pedidos.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => setShowTramite(true)}
                        startIcon={<i className="tabler-file-certificate" />}
                        sx={{
                            bgcolor: '#025E44', borderRadius: '12px', textTransform: 'none',
                            fontWeight: 700, fontSize: '0.95rem', px: 4, py: 1.25,
                            boxShadow: 'none', '&:hover': { bgcolor: '#014d36', boxShadow: 'none' }
                        }}
                    >
                        Tramitar mi certificado
                    </Button>
                </Box>
            </Wrapper>
        )
    }

    // ── Tiene precios pero faltan evaluaciones para tramitar ─────────
    if (pagoPendiente && !certificadoListoParaMostrar && !hayEsperaActiva && preciosCurso && !evaluacionesAprobadas) {
        const score = elegibilidad?.promedioScore ?? 0
        const minimo = elegibilidad?.promedioMinimo ?? 60

        return (
            <Wrapper>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 3 }}>
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '18px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #025E44 0%, #3AB079 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <i className="tabler-clipboard-check" style={{ fontSize: '2rem', color: '#fff' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#025E44', mb: 0.5 }}>
                            Completa las evaluaciones
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            Para tramitar el certificado debes aprobar las evaluaciones del curso
                            (promedio actual: <strong>{score}%</strong>, mínimo: <strong>{minimo}%</strong>).
                            No es necesario completar todas las lecciones.
                        </Typography>
                    </Box>
                </Box>
            </Wrapper>
        )
    }

    // ── Pago requerido sin precios configurados ──────────────────────
    if (pagoPendiente && !certificadoListoParaMostrar && !hayEsperaActiva && !preciosCurso) {
        const phone = (phoneNumberProfesor || whatsappNumero || '').replace(/\D/g, '')

        const waUrl = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, quiero información sobre el certificado del curso "${cursoTitulo || ''}".`)}`
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
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#d97706', mb: 0.5 }}>
                            Certificado disponible
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: waUrl ? 2 : 0, lineHeight: 1.6 }}>
                            Este curso requiere pago de certificado, pero aún no tiene precios configurados.
                            {phone ? (
                                <>
                                    {' '}Contacta a tu asesor académico por WhatsApp:{' '}
                                    <Box component="span" sx={{ fontWeight: 700, color: '#128C7E' }}>
                                        +{phone}
                                    </Box>
                                    .
                                </>
                            ) : (
                                ' Contacta a tu asesor académico o al administrador.'
                            )}
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
                                    bgcolor: '#25D366',
                                    color: '#fff',
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#1ebe5d', boxShadow: 'none' }
                                }}
                            >
                                Contactar por WhatsApp
                            </Button>
                        )}
                    </Box>
                </Box>
            </Wrapper>
        )
    }

    // ── Certificado habilitado pero aún en tiempo de espera ─────────
    if (hayEsperaActiva && plantillasHabilitadas.length === 0) {
        return (
            <>
                <Wrapper>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 3 }}>
                        <Box sx={{
                            width: 72, height: 72, borderRadius: '18px', flexShrink: 0,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <i className="tabler-clock" style={{ fontSize: '2rem', color: '#fff' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#d97706', mb: 0.5 }}>
                                Certificado en proceso de emisión
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                                Tu certificado ya fue habilitado. Debes esperar el tiempo configurado por el curso antes de poder verlo y descargarlo.
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                                {plantillasEnEspera.map(p => (
                                    <Box
                                        key={`espera-body-${p.id}`}
                                        sx={{
                                            p: 1.75,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'warning.light',
                                            bgcolor: 'rgba(245,158,11,0.06)',
                                        }}
                                    >
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>
                                            {p.nombre}
                                        </Typography>
                                        {p.disponibleDesde ? (
                                            <Typography variant="body2" color="text.secondary">
                                                Disponible desde{' '}
                                                <HydratedDate
                                                    date={p.disponibleDesde}
                                                    options={{
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }}
                                                />
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                {p.mensajeEspera || 'Aún no disponible.'}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Wrapper>
                {previewModal}
            </>
        )
    }

    // ── Ya tiene certificado ────────────────────────────────────────
    if (certificadoListoParaMostrar && elegibilidad?.isEligible) {
        const obtenidas = plantillasHabilitadas.length > 0
            ? plantillasHabilitadas
            : [{ id: '', nombre: '', thumbnail: '', habilitado: true, certificadoId: certificado!.id, codigoVerificacion: certificado!.codigoVerificacion, emitidoEn: certificado!.emitidoEn }]

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
                                            ? <>{(certificado?.nombreCompleto || '')} · Emitido el{' '}
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
                                    </Box>
                                </Box>
                            </Box>
                        )
                    })}
                    {hayEsperaActiva && (
                        <Box sx={{ mt: 3 }}>
                            <CertificadoPreviewGrid plantillas={plantillasEnEspera} />
                        </Box>
                    )}

                    {solicitudesPendientes.length > 0 && (
                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                Solicitudes en validación
                            </Typography>
                            {solicitudesPendientes.map(s => (
                                <Box
                                    key={s.pedidoId}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'rgba(2,94,68,0.04)',
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
                                        Pedido #{s.numeroPedido} · {s.nombreTipo || s.certificadoTipo}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Estado: <strong>Pendiente de validación de pago</strong>
                                        {s.tieneComprobante ? ' (comprobante recibido)' : ''}
                                    </Typography>
                                    {s.etiquetaEntrega && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {s.etiquetaEntrega}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {(tiposTramitables.ipg || tiposTramitables.cip) && cursoCertificacion && (
                        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {plantillasHabilitadas.length === 1
                                    ? 'También puedes adquirir el otro tipo de certificado para este curso.'
                                    : 'Puedes adquirir un certificado adicional para este curso.'}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => setShowTramite(true)}
                                startIcon={<i className="tabler-certificate" />}
                                sx={{
                                    bgcolor: '#025E44',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#014d36', boxShadow: 'none' },
                                }}
                            >
                                {etiquetaAdquirirOtro}
                            </Button>
                        </Box>
                    )}
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
                        Aprueba las evaluaciones del curso y tramita la compra de tu certificado (IPG o Colegio de Ingenieros) para poder descargarlo.
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
                                : el.totalExamenes > 0
                                  ? 'Has aprobado las evaluaciones. Si el certificado tiene costo, tramita el pago correspondiente para descargarlo.'
                                  : 'Ya puedes obtener tu certificado. Si tiene costo, tramita el pago correspondiente.'
                            }
                        </Typography>
                        {el.totalExamenes > 0 && (
                            <Button
                                variant="contained"
                                onClick={() => handleGenerar()}
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

                /* No elegible → mostrar progreso de evaluaciones */
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                        {el.totalExamenes > 0
                          ? 'Para descargar el certificado debes aprobar las evaluaciones del curso y haber comprado el certificado (IPG o Colegio de Ingenieros).'
                          : 'Para descargar el certificado debes haber comprado el certificado correspondiente (IPG o Colegio de Ingenieros).'}
                    </Typography>

                    {/* Progreso de lecciones (informativo) */}
                    <Box sx={{ mb: el.totalExamenes > 0 ? 2 : 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <i className="tabler-book" style={{ fontSize: '1rem', color: '#94a3b8' }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Progreso de lecciones (opcional)</Typography>
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
            <CompleteProfileModal
                open={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                requireDocument={true}
                requireCelular={false}
                onSuccess={() => {
                    setShowProfileModal(false)
                    setDocumentoCompleto(true)

                    if (pendingAction?.type === 'generar') {
                        handleGenerar(true)
                    } else if (pendingAction?.type === 'descargar') {
                        handleDescargar(pendingAction.plantillaId, true)
                    }

                    setPendingAction(null)
                }}
            />
        </>
    )
}

export default CertificateSection
