'use client'


import { useQuery } from '@tanstack/react-query'
import {
    Box,
    Typography,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material'

import CommentItem from './CommentItem'
import type { CommentData } from './CommentItem'
import CommentForm from './CommentForm'

interface CommentsSectionProps {
    leccionId: string
}

const CommentsSection = ({ leccionId }: CommentsSectionProps) => {
    const { data: comments = [], isLoading, error, refetch } = useQuery<CommentData[]>({
        queryKey: ['comentarios', 'leccion', leccionId],
        queryFn: async () => {
            const res = await fetch(`/api/lecciones/${leccionId}/comentarios`)

            if (!res.ok) {
                throw new Error('No se pudieron cargar los comentarios')
            }

            return res.json()
        },
        enabled: !!leccionId,
        staleTime: 30_000
    })

    // Se calcula el número total de comentarios (padres + hijos)
    const countTotalComments = (items: CommentData[]): number => {
        let count = items.length

        items.forEach(item => {
            if (item.respuestas && item.respuestas.length > 0) {
                count += countTotalComments(item.respuestas)
            }
        })

        return count
    }

    const totalComments = countTotalComments(comments)

    return (
        <Box
            sx={{
                p: { xs: 0, sm: 3, md: 4 },
                borderRadius: { xs: 0, sm: '16px' },
                border: { xs: 'none', sm: '1px solid' },
                borderColor: 'divider',
                mt: { xs: 1, sm: 4 }
            }}
        >
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <i className="tabler-message-circle-2" style={{ fontSize: '2rem', color: 'var(--mui-palette-primary-main)' }} />
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    Comentarios <Typography component="span" variant="h5" sx={{ color: 'text.secondary', fontWeight: 600 }}>({totalComments})</Typography>
                </Typography>
            </Box>

            {/* Formulario Principal (Para postear un nuevo comentario raíz) */}
            <Box sx={{ mb: 5, p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                    Deja tu pregunta o aporte
                </Typography>
                <CommentForm
                    leccionId={leccionId}
                    onSuccess={refetch}
                />
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Listado de Comentarios */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{(error as Error).message}</Alert>
            ) : comments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, borderRadius: '12px' }}>
                    <i className="tabler-messages" style={{ fontSize: '3rem', color: 'var(--mui-palette-text-disabled)', marginBottom: '16px' }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Sé el primero en comentar
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                        Comparte tus dudas o reflexiones sobre esta clase con la comunidad.
                    </Typography>
                </Box>
            ) : (
                <Box>
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            leccionId={leccionId}
                            onReplySuccess={refetch}
                        />
                    ))}
                </Box>
            )}
        </Box>
    )
}

export default CommentsSection
