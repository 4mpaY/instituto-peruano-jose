'use client'

import { useState } from 'react'

import {
    Box,
    Typography,
    CircularProgress,
    List,
    Paper,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Chip,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    Stack
} from '@mui/material'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'

import { useComentariosCurso } from '../../hooks/useCursos'
import HydratedDate from '@/utils/components/HydratedDate'

interface TabComentariosProps {
    cursoId: string
}

const ESTADO_TABS = [
    { value: undefined,      label: 'Todos' },
    { value: 'PENDIENTE',    label: 'Pendientes' },
    { value: 'APROBADO',     label: 'Aprobados' },
    { value: 'RECHAZADO',    label: 'Rechazados' },
]

const estadoChip = (estado: string) => {
    if (estado === 'APROBADO')  return { label: 'Aprobado',  color: 'success' as const }
    if (estado === 'RECHAZADO') return { label: 'Rechazado', color: 'error'   as const }

    return { label: 'Pendiente', color: 'warning' as const }
}

export function TabComentarios({ cursoId }: TabComentariosProps) {
    const [tabIndex, setTabIndex] = useState(0)
    const estadoFiltro = ESTADO_TABS[tabIndex].value
    const queryClient = useQueryClient()

    const { data, isLoading, refetch } = useComentariosCurso(cursoId, estadoFiltro)
    const comentarios = data?.comentarios || []

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['cursos', cursoId, 'comentarios'] })
        refetch()
    }

    const handleModerar = async (id: string, estado: 'APROBADO' | 'RECHAZADO') => {
        try {
            await axios.patch(`/api/admin/comentarios/${id}`, { estado })
            toast.success(estado === 'APROBADO' ? 'Comentario aprobado' : 'Comentario rechazado')
            invalidate()
        } catch {
            toast.error('Error al actualizar el comentario')
        }
    }

    const handleEliminar = async (id: string) => {
        try {
            await axios.delete(`/api/admin/comentarios/${id}`)
            toast.success('Comentario eliminado')
            invalidate()
        } catch {
            toast.error('Error al eliminar el comentario')
        }
    }

    return (
        <Box>
            {/* Tabs de filtro */}
            <Tabs
                value={tabIndex}
                onChange={(_, v) => setTabIndex(v)}
                sx={{
                    mb: 3,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
                }}
            >
                {ESTADO_TABS.map((tab, i) => (
                    <Tab key={i} label={tab.label} />
                ))}
            </Tabs>

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                    <CircularProgress />
                </Box>
            )}

            {!isLoading && comentarios.length === 0 && (
                <Box sx={{ p: 10, textAlign: 'center' }}>
                    <i className='tabler-message-off text-6xl text-textSecondary' />
                    <Typography variant='h5' sx={{ mt: 4 }}>No hay comentarios</Typography>
                    <Typography color='text.secondary'>
                        {estadoFiltro ? `No hay comentarios con estado "${estadoChip(estadoFiltro).label}".` : 'Los comentarios de los estudiantes aparecerán aquí.'}
                    </Typography>
                </Box>
            )}

            {!isLoading && comentarios.length > 0 && (
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {comentarios.map((c: any) => {
                        const chip = estadoChip(c.estado || 'PENDIENTE')

                        return (
                            <Paper key={c.id} variant='outlined' sx={{ mb: 3, p: 2 }}>
                                <ListItem alignItems='flex-start' disablePadding>
                                    <ListItemAvatar>
                                        <Avatar alt={c.usuario.nombre} src={c.usuario.avatar || ''} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                <Stack direction='row' spacing={1} alignItems='center'>
                                                    <Typography variant='subtitle1' fontWeight={600}>
                                                        {c.usuario.nombre} {c.usuario.apellido}
                                                    </Typography>
                                                    <Chip
                                                        label={c.usuario.rol}
                                                        size='small'
                                                        variant='tonal'
                                                        sx={{ height: 20 }}
                                                        color={c.usuario.rol === 'ADMIN' ? 'error' : c.usuario.rol === 'PROFESOR' ? 'info' : 'primary'}
                                                    />
                                                    <Chip
                                                        label={chip.label}
                                                        size='small'
                                                        color={chip.color}
                                                        sx={{ height: 20 }}
                                                    />
                                                </Stack>

                                                {/* Acciones de moderación */}
                                                <Stack direction='row' spacing={0.5}>
                                                    {c.estado !== 'APROBADO' && (
                                                        <Tooltip title='Aprobar'>
                                                            <IconButton size='small' color='success' onClick={() => handleModerar(c.id, 'APROBADO')}>
                                                                <i className='tabler-check text-base' />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {c.estado !== 'RECHAZADO' && (
                                                        <Tooltip title='Rechazar'>
                                                            <IconButton size='small' color='warning' onClick={() => handleModerar(c.id, 'RECHAZADO')}>
                                                                <i className='tabler-x text-base' />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title='Eliminar'>
                                                        <IconButton size='small' color='error' onClick={() => handleEliminar(c.id)}>
                                                            <i className='tabler-trash text-base' />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 0.5 }}>
                                                    <HydratedDate date={c.creado_en} />
                                                </Typography>
                                                <Typography variant='body1' color='text.primary' sx={{ mb: 2 }}>
                                                    {c.contenido}
                                                </Typography>
                                                <Chip
                                                    size='small'
                                                    icon={<i className='tabler-video' />}
                                                    label={`${c.leccion.modulo.titulo} › ${c.leccion.titulo}`}
                                                    variant='outlined'
                                                />
                                            </Box>
                                        }
                                    />
                                </ListItem>

                                {c.respuestas && c.respuestas.length > 0 && (
                                    <Box sx={{ ml: 12, mt: 2, borderLeft: '2px solid', borderColor: 'divider', pl: 4 }}>
                                        {c.respuestas.map((r: any) => {
                                            const rChip = estadoChip(r.estado || 'PENDIENTE')

                                            return (
                                            <Box key={r.id} sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <Avatar sx={{ width: 24, height: 24 }} alt={r.usuario.nombre} src={r.usuario.avatar || ''} />
                                                        <Typography variant='subtitle2' fontWeight={600}>
                                                            {r.usuario.nombre} {r.usuario.apellido}
                                                        </Typography>
                                                        <Chip label={rChip.label} size='small' color={rChip.color} sx={{ height: 18, fontSize: '0.65rem' }} />
                                                        <Typography variant='caption' color='text.secondary'>
                                                            <HydratedDate date={r.creado_en} />
                                                        </Typography>
                                                    </Box>
                                                    <Stack direction='row' spacing={0.5}>
                                                        {r.estado !== 'APROBADO' && (
                                                            <Tooltip title='Aprobar'>
                                                                <IconButton size='small' color='success' onClick={() => handleModerar(r.id, 'APROBADO')}>
                                                                    <i className='tabler-check text-base' />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {r.estado !== 'RECHAZADO' && (
                                                            <Tooltip title='Rechazar'>
                                                                <IconButton size='small' color='warning' onClick={() => handleModerar(r.id, 'RECHAZADO')}>
                                                                    <i className='tabler-x text-base' />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title='Eliminar'>
                                                            <IconButton size='small' color='error' onClick={() => handleEliminar(r.id)}>
                                                                <i className='tabler-trash text-base' />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </Box>
                                                <Typography variant='body2'>{r.contenido}</Typography>
                                            </Box>
                                        )})}

                                    </Box>
                                )}
                            </Paper>
                        )
                    })}
                </List>
            )}
        </Box>
    )
}
