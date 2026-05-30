'use client'

import { useState, useEffect, useRef } from 'react'

import { Box, Paper, Typography, Button } from '@mui/material'

interface VideoPlayerProps {
    url?: string
    tipo?: 'VIDEO' | 'INCRUSTADO'
    onEnded?: () => void
    nextLessonTitle?: string
    onNextLesson?: () => void
}

const YT_PARAMS = 'rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1'
const VIMEO_PARAMS = 'byline=0&portrait=0&title=0&badge=0&dnt=1&api=1'

function getEmbedUrl(url: string): string {
    // YouTube: watch?v=
    if (url.includes('youtube.com/watch')) {
        try {
            const videoId = new URL(url).searchParams.get('v')

            if (videoId) {
                return `https://www.youtube-nocookie.com/embed/${videoId}?${YT_PARAMS}`
            }
        } catch { /* url inválida, retorna original */ }
    }

    // YouTube: youtu.be/
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0]

        if (videoId) {
            return `https://www.youtube-nocookie.com/embed/${videoId}?${YT_PARAMS}`
        }
    }

    // YouTube: ya es embed
    if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) {
        const base = url.split('?')[0].replace('youtube.com', 'youtube-nocookie.com')

        return `${base}?${YT_PARAMS}`
    }

    // Vimeo: URL normal
    if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
        const videoId = url.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0]

        if (videoId) {
            return `https://player.vimeo.com/video/${videoId}?${VIMEO_PARAMS}`
        }
    }

    // Vimeo: ya es player embed
    if (url.includes('player.vimeo.com')) {
        const base = url.split('?')[0]

        return `${base}?${VIMEO_PARAMS}`
    }

    return url
}

const VideoPlayer = ({ url, tipo = 'VIDEO', onEnded, nextLessonTitle, onNextLesson }: VideoPlayerProps) => {
    const [videoEnded, setVideoEnded] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const isYT = !!url && (url.includes('youtube.com') || url.includes('youtu.be'))
    const isVimeo = !!url && url.includes('vimeo.com')
    const isEmbedded = isYT || isVimeo || tipo === 'INCRUSTADO'

    // Resetea la pantalla final al cambiar de lección
    useEffect(() => {
        setVideoEnded(false)
    }, [url])

    // Escucha postMessages de YouTube y Vimeo para detectar fin de video
    useEffect(() => {
        if (!isEmbedded) {
            return
        }

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

                // YouTube: info === 0 significa YT.PlayerState.ENDED
                if (data?.event === 'onStateChange' && data?.info === 0) {
                    setVideoEnded(true)
                    onEnded?.()
                }

                // Vimeo: evento finish
                if (data?.event === 'finish') {
                    setVideoEnded(true)
                    onEnded?.()
                }
            } catch {
                // Ignorar mensajes que no son JSON válido
            }
        }

        window.addEventListener('message', handleMessage)

        return () => window.removeEventListener('message', handleMessage)
    }, [isEmbedded, onEnded])

    // Vimeo: suscribirse al evento finish cuando el player esté listo
    useEffect(() => {
        if (!isVimeo) {
            return
        }

        const handleVimeoReady = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data

                if (data?.event === 'ready' && iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(
                        JSON.stringify({ method: 'addEventListener', value: 'finish' }),
                        '*'
                    )
                }
            } catch { /* ignorar */ }
        }

        window.addEventListener('message', handleVimeoReady)

        return () => window.removeEventListener('message', handleVimeoReady)
    }, [isVimeo])

    if (!url) {
        return (
            <Paper
                sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    bgcolor: 'black',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: { xs: 0, md: '12px' },
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ color: 'white', textAlign: 'center' }}>
                    <i className="tabler-video-off" style={{ fontSize: '3rem', opacity: 0.5 }} />
                    <Box sx={{ mt: 1, opacity: 0.7 }}>No hay video disponible para esta lección</Box>
                </Box>
            </Paper>
        )
    }

    return (
        <Box
            sx={{
                width: '100%',
                aspectRatio: '16/9',
                bgcolor: 'black',
                borderRadius: { xs: 0, md: '12px' },
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                position: 'relative'
            }}
        >
            {isEmbedded ? (
                <>
                    <iframe
                        ref={iframeRef}
                        width="100%"
                        height="100%"
                        src={getEmbedUrl(url)}
                        title="Reproductor de video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ border: 'none', display: 'block' }}
                    />


                    {/* Pantalla final: cubre los videos relacionados cuando termina el video */}
                    {videoEnded && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'rgba(0,0,0,0.93)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2.5,
                                zIndex: 10,
                                borderRadius: { xs: 0, md: '12px' }
                            }}
                        >
                            <Box sx={{ color: 'success.main', lineHeight: 1 }}>
                                <i className="tabler-circle-check-filled" style={{ fontSize: '3.5rem' }} />
                            </Box>
                            <Typography variant="h5" color="white" fontWeight={700} textAlign="center" px={3}>
                                ¡Lección completada!
                            </Typography>
                            {nextLessonTitle && onNextLesson && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    endIcon={<i className="tabler-chevron-right" />}
                                    onClick={onNextLesson}
                                    sx={{ borderRadius: 2, px: 4, mt: 1 }}
                                >
                                    Siguiente lección
                                </Button>
                            )}
                            <Button
                                variant="text"
                                size="small"
                                sx={{ color: 'grey.500' }}
                                onClick={() => setVideoEnded(false)}
                            >
                                Volver a ver
                            </Button>
                        </Box>
                    )}
                </>
            ) : (
                <video
                    controls
                    onEnded={() => { setVideoEnded(true); onEnded?.() }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                >
                    <source src={url} />
                    Tu navegador no soporta el elemento de video.
                </video>
            )}
        </Box>
    )
}

export default VideoPlayer
