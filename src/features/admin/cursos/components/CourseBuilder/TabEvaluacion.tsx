'use client'

import { useState } from 'react'

import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material'
import { useSnackbar } from 'notistack'

import { QuestionEditDialog } from './QuestionEditDialog'

import {
    useExamenesCurso,
    useDeletePregunta,
    useCreatePreguntaExamen,
    useUpdatePregunta,
    useDeleteExamen
} from '../../hooks/useCursos'

interface TabEvaluacionProps {
    cursoId: string
}

export function TabEvaluacion({ cursoId }: TabEvaluacionProps) {
    const { enqueueSnackbar } = useSnackbar()
    const { data, isLoading, refetch } = useExamenesCurso(cursoId)
    const deletePreguntaMutation = useDeletePregunta()
    const createPreguntaMutation = useCreatePreguntaExamen()
    const updatePreguntaMutation = useUpdatePregunta()
    const deleteExamenMutation = useDeleteExamen()

    const [editingQuestion, setEditingQuestion] = useState<any>(null)
    const [expandedExamenesIds, setExpandedExamenesIds] = useState<Set<string>>(new Set())

    const handleDeleteQuestion = async (preguntaId: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta pregunta?')) return

        try {
            await deletePreguntaMutation.mutateAsync({ cursoId, preguntaId })
            enqueueSnackbar('Pregunta eliminada', { variant: 'success' })
            refetch()
        } catch (error: any) {
            enqueueSnackbar(error?.message || 'Error al eliminar', { variant: 'error' })
        }
    }

    const handleDeleteExamen = async (examenId: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este examen y todas sus preguntas?')) return

        try {
            await deleteExamenMutation.mutateAsync({ cursoId, examenId })
            enqueueSnackbar('Examen eliminado', { variant: 'success' })
            refetch()
        } catch (error: any) {
            enqueueSnackbar(error?.message || 'Error al eliminar', { variant: 'error' })
        }
    }

    const handleSaveQuestion = async (formData: any) => {
        try {
            if (editingQuestion?.id) {
                await updatePreguntaMutation.mutateAsync({ cursoId, preguntaId: editingQuestion.id, data: formData })
                enqueueSnackbar('Pregunta actualizada', { variant: 'success' })
            } else {
                await createPreguntaMutation.mutateAsync({ cursoId, examenId: editingQuestion.examenId as string, data: formData })
                enqueueSnackbar('Pregunta añadida', { variant: 'success' })
            }

            setEditingQuestion(null)
            refetch()
        } catch (error: any) {
            enqueueSnackbar(error?.message || 'Error al guardar pregunta', { variant: 'error' })
        }
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                <CircularProgress />
            </Box>
        )
    }

    const examenes = data?.examenes || []
    const examenFinal = examenes.find((e: any) => e.tipo === 'FINAL')
    const examenesIntermedios = examenes.filter((e: any) => e.tipo === 'INTERMEDIO')

    const toggleExpanded = (examenId: string) => {
        setExpandedExamenesIds((prev) => {
            const newSet = new Set(prev)

            newSet.has(examenId) ? newSet.delete(examenId) : newSet.add(examenId)

            return newSet
        })
    }

    return (
        <Box>
            {/* ===== EXAMEN FINAL ===== */}
            <Typography variant='h6' sx={{ mb: 2, fontWeight: 700 }}>
                Examen Final
            </Typography>
            {examenFinal ? (
                <Card sx={{ mb: 4 }}>
                    <CardHeader
                        title={examenFinal.titulo}
                        subheader={`${examenFinal._count?.preguntas || 0} preguntas`}
                        action={
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip
                                    label={examenFinal.esta_publicado ? 'Publicado' : 'Borrador'}
                                    color={examenFinal.esta_publicado ? 'success' : 'default'}
                                    size='small'
                                />
                                <Tooltip title='Ver/Editar preguntas'>
                                    <IconButton size='small' onClick={() => toggleExpanded(examenFinal.id)}>
                                        <i className={`tabler-chevron-${expandedExamenesIds.has(examenFinal.id) ? 'up' : 'down'}`} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title='Eliminar examen'>
                                    <IconButton size='small' color='error' onClick={() => handleDeleteExamen(examenFinal.id)}>
                                        <i className='tabler-trash text-lg' />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        }
                    />

                    {expandedExamenesIds.has(examenFinal.id) && (
                        <>
                            <Divider />
                            <CardContent>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                    Puntaje de aprobación: <strong>{Math.round((examenFinal.puntaje_aprobacion || 0) / 5)} / 20</strong> | Intentos máximos:{' '}
                                    <strong>{examenFinal.intentos_maximos}</strong>
                                </Typography>

                                <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
                                    Preguntas:
                                </Typography>

                                {(examenFinal.preguntas || []).length === 0 ? (
                                    <Typography variant='body2' color='text.disabled' sx={{ mb: 2 }}>
                                        Sin preguntas aún.
                                    </Typography>
                                ) : (
                                    <Box sx={{ mb: 2, maxHeight: 400, overflowY: 'auto' }}>
                                        {(examenFinal.preguntas || []).map((pregunta: any) => (
                                            <Box
                                                key={pregunta.id}
                                                sx={{
                                                    p: 2,
                                                    mb: 1,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start'
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant='body2'>
                                                        <strong>P{pregunta.orden}:</strong> {pregunta.texto}
                                                    </Typography>
                                                    <Typography variant='caption' color='text.secondary'>
                                                        {pregunta.opciones?.length || 0} opciones | {pregunta.puntos} pts.
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                                                    <Tooltip title='Editar'>
                                                        <IconButton
                                                            size='small'
                                                            onClick={() => setEditingQuestion({ ...pregunta, examenId: examenFinal.id })}
                                                        >
                                                            <i className='tabler-edit text-sm' />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title='Eliminar'>
                                                        <IconButton size='small' color='error' onClick={() => handleDeleteQuestion(pregunta.id)}>
                                                            <i className='tabler-trash text-sm' />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                                <Button
                                    variant='tonal'
                                    size='small'
                                    startIcon={<i className='tabler-plus' />}
                                    onClick={() => setEditingQuestion({ examenId: examenFinal.id })}
                                >
                                    Añadir Pregunta
                                </Button>
                            </CardContent>
                        </>
                    )}
                </Card>
            ) : (
                <Paper sx={{ p: 3, mb: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                    <Typography color='text.secondary'>No hay examen final creado.</Typography>
                    <Typography variant='caption' color='text.secondary'>
                        Crea el examen final desde la sección de Contenido.
                    </Typography>
                </Paper>
            )}

            {/* ===== EVALUACIONES INTERMEDIAS ===== */}
            <Typography variant='h6' sx={{ mb: 2, fontWeight: 700 }}>
                Evaluaciones Intermedias
            </Typography>

            {examenesIntermedios.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
                    <Typography color='text.secondary'>No hay evaluaciones intermedias creadas.</Typography>
                    <Typography variant='caption' color='text.secondary'>
                        Crea evaluaciones intermedias desde la sección de Contenido dentro de cada módulo.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ maxHeight: '62vh', overflow: 'auto' }}>
                    <Table size='small' stickyHeader>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell>Módulo</TableCell>
                                <TableCell>Título</TableCell>
                                <TableCell align='center'>Peso</TableCell>
                                <TableCell align='center'>Progreso Mín.</TableCell>
                                <TableCell align='center'>Preguntas</TableCell>
                                <TableCell align='center'>Estado</TableCell>
                                <TableCell align='right'>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {examenesIntermedios.map((examen: any) => (
                                <TableRow key={examen.id} hover>
                                    <TableCell>{examen.modulo?.titulo || '—'}</TableCell>
                                    <TableCell>{examen.titulo}</TableCell>
                                    <TableCell align='center'>
                                        <Chip label={`×${examen.peso}`} size='small' variant='outlined' />
                                    </TableCell>
                                    <TableCell align='center'>{examen.progreso_minimo}%</TableCell>
                                    <TableCell align='center'>{examen._count?.preguntas || 0}</TableCell>
                                    <TableCell align='center'>
                                        <Chip
                                            label={examen.esta_publicado ? 'Publicado' : 'Borrador'}
                                            color={examen.esta_publicado ? 'success' : 'default'}
                                            size='small'
                                        />
                                    </TableCell>
                                    <TableCell align='right'>
                                        <Tooltip title='Ver preguntas'>
                                            <IconButton size='small' onClick={() => toggleExpanded(examen.id)}>
                                                <i className={`tabler-chevron-${expandedExamenesIds.has(examen.id) ? 'up' : 'down'}`} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title='Eliminar'>
                                            <IconButton size='small' color='error' onClick={() => handleDeleteExamen(examen.id)}>
                                                <i className='tabler-trash text-lg' />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modal para editar preguntas */}
            {editingQuestion && (
                <QuestionEditDialog
                    open={true}
                    onClose={() => setEditingQuestion(null)}
                    onSave={handleSaveQuestion}
                    isSaving={createPreguntaMutation.isPending || updatePreguntaMutation.isPending}
                    questionData={editingQuestion}
                />
            )}
        </Box>
    )
}
