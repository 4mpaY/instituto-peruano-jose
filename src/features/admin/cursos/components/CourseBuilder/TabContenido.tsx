'use client'

import React, { useState, useRef, Children, cloneElement } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Typography,
  Tooltip,
  Collapse,
  alpha
} from '@mui/material'
import Swal from 'sweetalert2'
import { useSnackbar } from 'notistack'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'

import { CSS } from '@dnd-kit/utilities'

import CustomTextField from '@core/components/mui/TextField'
import { LessonEditDialog } from './LessonEditDialog'
import { EvaluacionDialog } from './EvaluacionDialog'

import type { Curso, CursoLeccionResumen, CursoExamenResumen } from '../../entity/Curso'
import {
  useCreateModulo,
  useUpdateModulo,
  useDeleteModulo,
  useReorderModulos,
  useCreateLeccion,
  useUpdateLeccion,
  useDeleteLeccion,
  useReorderLecciones,
  useReorderExamenesModulo,
  useDeleteExamen
} from '../../hooks/useCursos'

// Componente para Módulos arrastrables
const SortableModuleItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative' as const,
    marginBottom: '16px'
  }

  return (
    <div ref={setNodeRef} style={style}>
      {Children.map(children, (child: any) =>
        cloneElement(child, { dragHandleProps: { ...attributes, ...listeners } })
      )}
    </div>
  )
}

// Componente para Lecciones arrastrables
const SortableLessonItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.6 : 1
  }

  return (
    <div ref={setNodeRef} style={style}>
      {Children.map(children, (child: any) =>
        cloneElement(child, { dragHandleProps: { ...attributes, ...listeners } })
      )}
    </div>
  )
}

// Fila de Evaluación dentro del módulo
const EvaluacionRow = ({
  examen,
  onEdit,
  onDelete,
  dragHandleProps
}: {
  examen: CursoExamenResumen
  onEdit: (examen: CursoExamenResumen) => void
  onDelete: (examenId: string) => void
  dragHandleProps?: any
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.5,
        px: 2,
        borderRadius: 1,
        bgcolor: 'warning.lightOpacity',
        mb: 1,
        border: '1px solid',
        borderColor: 'warning.light',
        '&:hover': { borderColor: 'warning.main' }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box {...dragHandleProps} sx={{ display: 'flex', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}>
          <i className='tabler-grip-vertical text-lg text-textDisabled' />
        </Box>
        <i className='tabler-clipboard-list text-lg' style={{ color: 'var(--mui-palette-warning-main)' }} />
        <Typography variant='body2' fontWeight={500}>{examen.titulo}</Typography>
        <Chip
          size='small'
          variant='tonal'
          label={`${examen._count?.preguntas ?? 0} preguntas`}
          color='warning'
        />
        <Chip
          size='small'
          variant='outlined'
          label={`Peso ×${examen.peso}`}
          color='default'
        />
        {!examen.esta_publicado && (
          <Chip size='small' variant='tonal' label='Borrador' color='default' />
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title='Editar evaluación'>
          <IconButton size='small' color='warning' onClick={() => onEdit(examen)}>
            <i className='tabler-edit text-lg' />
          </IconButton>
        </Tooltip>
        <Tooltip title='Eliminar evaluación'>
          <IconButton size='small' color='error' onClick={() => onDelete(examen.id)}>
            <i className='tabler-trash text-lg' />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

// Componente que representa un Módulo (Card)
const ModuleCard = ({
  modulo,
  mIndex,
  expandedModule,
  setExpandedModule,
  handleDeleteModule,
  onRenameModule,
  onCombinedDragEnd,
  handleToggleLessonStatus,
  handleToggleLessonPreview,
  setEditingLesson,
  handleDeleteLesson,
  onAddLesson,
  onAddEvaluacion,
  onEditEvaluacion,
  onDeleteEvaluacion,
  sensors,
  dragHandleProps
}: any) => {
  const totalItems = (modulo.lecciones?.length ?? 0) + (modulo.examenes?.length ?? 0)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(modulo.titulo)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTitle(modulo.titulo)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 30)
  }

  const commitEdit = () => {
    const trimmed = editTitle.trim()

    if (trimmed && trimmed !== modulo.titulo) onRenameModule(modulo.id, trimmed)
    setEditing(false)
  }

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: editing ? 1.25 : 2,
          bgcolor: 'action.hover',
          cursor: editing ? 'default' : 'pointer',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: theme => alpha(theme.palette.action.hover, 0.12) }
        }}
        onClick={() => !editing && setExpandedModule(expandedModule === modulo.id ? null : modulo.id)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          <Box {...dragHandleProps} sx={{ display: 'flex', cursor: 'grab', '&:active': { cursor: 'grabbing' }, mr: 0.5, flexShrink: 0 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <i className='tabler-grip-vertical text-xl text-textDisabled' />
          </Box>
          <Box sx={{
            width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha('#025E44', 0.1), color: '#025E44', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
          }}>
            {mIndex + 1}
          </Box>

          {editing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
              <input
                ref={inputRef}
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') setEditing(false)
                }}
                onBlur={commitEdit}
                autoFocus
                style={{
                  flex: 1, minWidth: 0, fontSize: '0.95rem', fontWeight: 700,
                  border: '1.5px solid #025E44', borderRadius: 8, padding: '5px 10px',
                  background: 'transparent', outline: 'none', color: 'inherit', fontFamily: 'inherit'
                }}
              />
              <Tooltip title='Confirmar (Enter)'>
                <IconButton size='small' color='success' onMouseDown={e => { e.preventDefault(); commitEdit() }}>
                  <i className='tabler-check text-base' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Cancelar (Esc)'>
                <IconButton size='small' onMouseDown={e => { e.preventDefault(); setEditing(false) }}>
                  <i className='tabler-x text-base' />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <>
              <Typography variant='subtitle1' fontWeight={700} color='text.primary' noWrap>
                {modulo.titulo}
              </Typography>
              <Chip size='small' variant='outlined' label={`${modulo.lecciones?.length ?? 0} lecciones`} sx={{ height: 20, fontSize: '0.72rem', flexShrink: 0 }} />
              {(modulo.examenes?.length ?? 0) > 0 && (
                <Chip size='small' variant='tonal' color='warning' label={`${modulo.examenes.length} eval.`} sx={{ height: 20, fontSize: '0.72rem', flexShrink: 0 }} />
              )}
            </>
          )}
        </Box>

        {!editing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <Tooltip title='Renombrar módulo'>
              <IconButton size='small' color='primary' onClick={startEdit}>
                <i className='tabler-pencil text-lg' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar módulo'>
              <IconButton size='small' color='error' onClick={() => handleDeleteModule(modulo.id)}>
                <i className='tabler-trash text-lg' />
              </IconButton>
            </Tooltip>
            <Box sx={{ ml: 0.5, color: 'text.secondary' }}>
              <i className={`tabler-chevron-${expandedModule === modulo.id ? 'up' : 'down'} text-lg`} />
            </Box>
          </Box>
        )}
      </Box>

      <Collapse in={expandedModule === modulo.id}>
        <CardContent sx={{ p: 0 }}>
          {/* ── Action buttons at top ── */}
          <Box sx={{
            display: 'flex', gap: 1.5, px: 2.5, py: 2,
            borderBottom: '1px solid', borderColor: 'divider',
            bgcolor: theme => alpha(theme.palette.background.paper, 0.6)
          }}>
            <Button
              variant='contained'
              size='small'
              startIcon={<i className='tabler-file-plus' style={{ fontSize: '0.95rem' }} />}
              onClick={() => onAddLesson(modulo.id)}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2,
                bgcolor: '#025E44', '&:hover': { bgcolor: '#014d36' },
                boxShadow: '0 2px 8px rgba(2,94,68,0.25)',
                px: 2, py: 0.75, fontSize: '0.82rem'
              }}
            >
              Lección
            </Button>
            <Button
              variant='outlined'
              size='small'
              startIcon={<i className='tabler-clipboard-plus' style={{ fontSize: '0.95rem' }} />}
              onClick={() => onAddEvaluacion(modulo.id)}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2,
                borderColor: '#d97706', color: '#d97706',
                '&:hover': { bgcolor: alpha('#d97706', 0.08), borderColor: '#b45309' },
                px: 2, py: 0.75, fontSize: '0.82rem'
              }}
            >
              Evaluación
            </Button>
          </Box>

          {/* ── Content list ── */}
          <Box sx={{ px: 2.5, py: 2 }}>
            {totalItems === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                <i className='tabler-inbox' style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }} />
                <Typography variant='body2' color='text.secondary' fontSize='0.82rem'>
                  Sin contenido aún. Añade lecciones o evaluaciones.
                </Typography>
              </Box>
            )}

            {/* Lista combinada: lecciones + evaluaciones ordenadas por orden */}
            {(() => {
              const allItems = [
                ...(modulo.lecciones || []).map((l: any) => ({ ...l, _tipo: 'leccion' as const })),
                ...(modulo.examenes || []).map((e: any) => ({ ...e, _tipo: 'examen' as const })),
              ].sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))

              return (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={e => onCombinedDragEnd(modulo.id, e, allItems)}
                >
                  <SortableContext items={allItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {allItems.map(item =>
                      item._tipo === 'leccion' ? (
                        <SortableLessonItem key={item.id} id={item.id}>
                          <LessonRow
                            leccion={item}
                            moduloId={modulo.id}
                            handleToggleLessonStatus={handleToggleLessonStatus}
                            handleToggleLessonPreview={handleToggleLessonPreview}
                            setEditingLesson={setEditingLesson}
                            handleDeleteLesson={handleDeleteLesson}
                          />
                        </SortableLessonItem>
                      ) : (
                        <SortableLessonItem key={item.id} id={item.id}>
                          <EvaluacionRow
                            examen={item}
                            onEdit={onEditEvaluacion}
                            onDelete={onDeleteEvaluacion}
                          />
                        </SortableLessonItem>
                      )
                    )}
                  </SortableContext>
                </DndContext>
              )
            })()}
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  )
}

// Componente que representa una fila de lección
const LessonRow = ({
  leccion,
  moduloId,
  handleToggleLessonStatus,
  handleToggleLessonPreview,
  setEditingLesson,
  handleDeleteLesson,
  dragHandleProps
}: any) => {
  const sublecciones = Array.isArray(leccion.subtemas)
    ? leccion.subtemas.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
    : []

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.5,
        px: 2,
        borderRadius: 1,
        bgcolor: 'background.paper',
        mb: 1,
        border: '1px solid transparent',
        '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
        <Box {...dragHandleProps} sx={{ display: 'flex', cursor: 'grab', mt: 0.25, '&:active': { cursor: 'grabbing' } }}>
          <i className='tabler-grip-vertical text-lg text-textDisabled' />
        </Box>
        <i className='tabler-file-text text-lg text-textSecondary' style={{ marginTop: 2 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant='body2'>{leccion.titulo}</Typography>
            <Chip
              size='small'
              variant='tonal'
              label={leccion.estado === 'PUBLICADO' ? 'Publicado' : 'Borrador'}
              color={leccion.estado === 'PUBLICADO' ? 'success' : 'warning'}
            />
            {leccion.es_vista_previa && (
              <Chip
                size='small'
                variant='outlined'
                label='Vista Previa'
                color='primary'
                icon={<i className='tabler-eye text-xs' />}
              />
            )}
            {leccion.duracion && (
              <Typography variant='caption' color='text.disabled'>
                {leccion.duracion} min
              </Typography>
            )}
          </Box>
          {sublecciones.map((nombre: string, i: number) => (
            <Typography
              key={`${leccion.id}-sub-${i}`}
              variant='caption'
              color='text.secondary'
              sx={{ display: 'block', pl: 3, mt: 0.25 }}
            >
              {nombre}
            </Typography>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title='Editar contenido'>
          <IconButton size='small' color='primary' onClick={() => setEditingLesson({ moduloId, leccion })}>
            <i className='tabler-edit text-lg' />
          </IconButton>
        </Tooltip>
        <Tooltip title={leccion.estado === 'PUBLICADO' ? 'Pasar a borrador' : 'Publicar'}>
          <IconButton
            size='small'
            color={leccion.estado === 'PUBLICADO' ? 'success' : 'default'}
            onClick={() => handleToggleLessonStatus(moduloId, leccion)}
          >
            <i className={`tabler-${leccion.estado === 'PUBLICADO' ? 'circle-check' : 'circle-dashed'} text-lg`} />
          </IconButton>
        </Tooltip>
        <Tooltip title={leccion.es_vista_previa ? 'Quitar vista previa' : 'Activar vista previa'}>
          <IconButton
            size='small'
            color={leccion.es_vista_previa ? 'primary' : 'default'}
            onClick={() => handleToggleLessonPreview(moduloId, leccion)}
          >
            <i className={`tabler-eye${leccion.es_vista_previa ? '' : '-off'} text-lg`} />
          </IconButton>
        </Tooltip>
        <Tooltip title='Eliminar'>
          <IconButton size='small' color='error' onClick={() => handleDeleteLesson(moduloId, leccion.id)}>
            <i className='tabler-trash text-lg' />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

interface TabContenidoProps {
  curso: Curso
  onSuccess: () => void
}

export function TabContenido({ curso, onSuccess }: TabContenidoProps) {
  const { enqueueSnackbar } = useSnackbar()
  const createModuloMutation = useCreateModulo()
  const updateModuloMutation = useUpdateModulo()
  const deleteModuloMutation = useDeleteModulo()
  const reorderModulosMutation = useReorderModulos()
  const createLeccionMutation = useCreateLeccion()
  const deleteLeccionMutation = useDeleteLeccion()
  const updateLeccionMutation = useUpdateLeccion()
  const reorderLeccionesMutation = useReorderLecciones()
  const reorderExamenesMutation = useReorderExamenesModulo()
  const deleteExamenMutation = useDeleteExamen()

  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [addingLessonModuloId, setAddingLessonModuloId] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<{ moduloId: string; leccion: CursoLeccionResumen } | null>(null)

  // Evaluacion dialog state
  const [evaluacionDialog, setEvaluacionDialog] = useState<{
    open: boolean
    moduloId: string | null
    examen: CursoExamenResumen | null
  }>({ open: false, moduloId: null, examen: null })

  // Sensores para DND
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const modulos = curso.modulos || []

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return

    try {
      await createModuloMutation.mutateAsync({ cursoId: curso.id, data: { titulo: newModuleTitle.trim() } })
      setNewModuleTitle('')
      enqueueSnackbar('Módulo creado', { variant: 'success' })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al crear módulo', { variant: 'error' })
    }
  }

  const handleRenameModule = async (moduloId: string, titulo: string) => {
    try {
      await updateModuloMutation.mutateAsync({ cursoId: curso.id, moduloId, data: { titulo } })
      enqueueSnackbar('Módulo renombrado', { variant: 'success' })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al renombrar', { variant: 'error' })
    }
  }

  const handleDeleteModule = async (moduloId: string) => {
    const modulo = modulos.find(m => m.id === moduloId)
    const lecciones = modulo?.lecciones?.length ?? 0
    const evaluaciones = modulo?.examenes?.length ?? 0

    const detail = [
      lecciones > 0 ? `${lecciones} lección${lecciones !== 1 ? 'es' : ''}` : '',
      evaluaciones > 0 ? `${evaluaciones} evaluación${evaluaciones !== 1 ? 'es' : ''}` : ''
    ].filter(Boolean).join(' y ')

    const result = await Swal.fire({
      title: '¿Eliminar módulo?',
      html: detail
        ? `Se eliminarán permanentemente <strong>${detail}</strong> y todo su contenido. Esta acción no se puede deshacer.`
        : 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    })

    if (!result.isConfirmed) return

    try {
      await deleteModuloMutation.mutateAsync({ cursoId: curso.id, moduloId })
      enqueueSnackbar('Módulo eliminado', { variant: 'success' })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al eliminar módulo', { variant: 'error' })
    }
  }

  const handleCreateLesson = async (data: any) => {
    if (!addingLessonModuloId) return

    try {
      await createLeccionMutation.mutateAsync({ cursoId: curso.id, moduloId: addingLessonModuloId, data })
      enqueueSnackbar('Lección creada', { variant: 'success' })
      setAddingLessonModuloId(null)
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al crear lección', { variant: 'error' })
    }
  }

  const handleDeleteLesson = async (moduloId: string, leccionId: string) => {
    try {
      await deleteLeccionMutation.mutateAsync({ cursoId: curso.id, moduloId, leccionId })
      enqueueSnackbar('Lección eliminada', { variant: 'success' })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al eliminar', { variant: 'error' })
    }
  }

  const handleToggleLessonStatus = async (moduloId: string, leccion: CursoLeccionResumen) => {
    const nuevoEstado = leccion.estado === 'PUBLICADO' ? 'BORRADOR' : 'PUBLICADO'

    try {
      await updateLeccionMutation.mutateAsync({
        cursoId: curso.id,
        moduloId,
        leccionId: leccion.id,
        data: { estado: nuevoEstado }
      })
      enqueueSnackbar(`Lección ${nuevoEstado === 'PUBLICADO' ? 'publicada' : 'como borrador'}`, { variant: 'success' })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error', { variant: 'error' })
    }
  }

  const handleToggleLessonPreview = async (moduloId: string, leccion: CursoLeccionResumen) => {
    const nuevoValor = !leccion.es_vista_previa

    try {
      await updateLeccionMutation.mutateAsync({
        cursoId: curso.id,
        moduloId,
        leccionId: leccion.id,
        data: { es_vista_previa: nuevoValor }
      })
      enqueueSnackbar(`Vista previa ${nuevoValor ? 'activada' : 'desactivada'}`, { variant: 'success' })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error', { variant: 'error' })
    }
  }

  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return
    const oldIndex = modulos.findIndex(m => m.id === active.id)
    const newIndex = modulos.findIndex(m => m.id === over.id)
    const reordered = arrayMove(modulos, oldIndex, newIndex)
    const items = reordered.map((m, i) => ({ id: m.id, orden: i }))

    try {
      await reorderModulosMutation.mutateAsync({ cursoId: curso.id, items })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al reordenar', { variant: 'error' })
    }
  }

  const handleCombinedDragEnd = async (
    moduloId: string,
    event: DragEndEvent,
    allItems: Array<{ id: string; _tipo: 'leccion' | 'examen'; orden?: number | null }>
  ) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = allItems.findIndex(i => i.id === active.id)
    const newIndex = allItems.findIndex(i => i.id === over.id)
    const reordered = arrayMove(allItems, oldIndex, newIndex).map((item, i) => ({ ...item, orden: i }))

    const lecciones = reordered.filter(i => i._tipo === 'leccion').map(i => ({ id: i.id, orden: i.orden as number }))
    const examenes = reordered.filter(i => i._tipo === 'examen').map(i => ({ id: i.id, orden: i.orden as number }))

    try {
      await Promise.all([
        lecciones.length ? reorderLeccionesMutation.mutateAsync({ cursoId: curso.id, moduloId, items: lecciones }) : null,
        examenes.length ? reorderExamenesMutation.mutateAsync({ cursoId: curso.id, moduloId, items: examenes }) : null,
      ].filter(Boolean) as Promise<any>[])
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al reordenar', { variant: 'error' })
    }
  }

  const handleSaveLessonEdit = async (data: any) => {
    if (!editingLesson) return

    try {
      await updateLeccionMutation.mutateAsync({
        cursoId: curso.id,
        moduloId: editingLesson.moduloId,
        leccionId: editingLesson.leccion.id,
        data
      })
      enqueueSnackbar('Lección actualizada', { variant: 'success' })
      setEditingLesson(null)
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al actualizar lección', { variant: 'error' })
    }
  }

  // Evaluacion handlers
  const handleOpenAddEvaluacion = (moduloId: string) => {
    setEvaluacionDialog({ open: true, moduloId, examen: null })
  }

  const handleOpenEditEvaluacion = (examen: CursoExamenResumen) => {
    setEvaluacionDialog({ open: true, moduloId: examen.modulo_id, examen })
  }

  const handleDeleteEvaluacion = async (examenId: string) => {
    if (!window.confirm('¿Eliminar esta evaluación y todas sus preguntas?')) return

    try {
      await deleteExamenMutation.mutateAsync({ cursoId: curso.id, examenId })
      enqueueSnackbar('Evaluación eliminada', { variant: 'success' })
      onSuccess()
    } catch (error: any) {
      enqueueSnackbar(error?.message || 'Error al eliminar', { variant: 'error' })
    }
  }

  const activeModulo = evaluacionDialog.moduloId ? modulos.find(m => m.id === evaluacionDialog.moduloId) : null

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <CustomTextField
          fullWidth
          placeholder='Nombre del nuevo módulo...'
          value={newModuleTitle}
          onChange={e => setNewModuleTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddModule()}
          InputProps={{
            startAdornment: <InputAdornment position='start'><i className='tabler-folder-plus text-xl text-textSecondary' /></InputAdornment>
          }}
        />
        <Button
          variant='contained'
          onClick={handleAddModule}
          disabled={!newModuleTitle.trim() || createModuloMutation.isPending}
          startIcon={<i className='tabler-plus' />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Añadir Módulo
        </Button>
      </Box>

      {modulos.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
          <i className='tabler-folder-off text-5xl' />
          <Typography variant='body1' sx={{ mt: 2 }}>
            Este curso no tiene módulos aún. Añade el primero arriba.
          </Typography>
        </Box>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleModuleDragEnd}
      >
        <SortableContext
          items={modulos.map(m => m.id)}
          strategy={verticalListSortingStrategy}
        >
          {modulos.map((modulo, mIndex) => (
            <SortableModuleItem
              key={modulo.id}
              id={modulo.id}
            >
              <ModuleCard
                modulo={modulo}
                mIndex={mIndex}
                expandedModule={expandedModule}
                setExpandedModule={setExpandedModule}
                handleDeleteModule={handleDeleteModule}
                onRenameModule={handleRenameModule}
                onCombinedDragEnd={handleCombinedDragEnd}
                handleToggleLessonStatus={handleToggleLessonStatus}
                handleToggleLessonPreview={handleToggleLessonPreview}
                setEditingLesson={setEditingLesson}
                handleDeleteLesson={handleDeleteLesson}
                onAddLesson={(moduloId: string) => { setExpandedModule(moduloId); setAddingLessonModuloId(moduloId) }}
                onAddEvaluacion={handleOpenAddEvaluacion}
                onEditEvaluacion={handleOpenEditEvaluacion}
                onDeleteEvaluacion={handleDeleteEvaluacion}
                sensors={sensors}
              />
            </SortableModuleItem>
          ))}
        </SortableContext>
      </DndContext>

      {/* Edit existing lesson */}
      <LessonEditDialog
        key={editingLesson?.leccion?.id || 'edit'}
        open={!!editingLesson}
        onClose={() => setEditingLesson(null)}
        lessonData={editingLesson?.leccion}
        onSave={handleSaveLessonEdit}
        isSaving={updateLeccionMutation.isPending}
      />

      {/* Create new lesson */}
      <LessonEditDialog
        key={addingLessonModuloId ? `new-${addingLessonModuloId}` : 'new'}
        open={!!addingLessonModuloId}
        onClose={() => setAddingLessonModuloId(null)}
        lessonData={undefined}
        onSave={handleCreateLesson}
        isSaving={createLeccionMutation.isPending}
      />

      <EvaluacionDialog
        key={evaluacionDialog.examen?.id || `new-${evaluacionDialog.moduloId}`}
        open={evaluacionDialog.open}
        onClose={() => setEvaluacionDialog({ open: false, moduloId: null, examen: null })}
        onSuccess={onSuccess}
        cursoId={curso.id}
        moduloId={evaluacionDialog.moduloId}
        moduloTitulo={activeModulo?.titulo}
        examenId={evaluacionDialog.examen?.id}
      />
    </Box>
  )
}
