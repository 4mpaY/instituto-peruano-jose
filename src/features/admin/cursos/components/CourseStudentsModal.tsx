import { useState } from 'react'

import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
  InputAdornment
} from '@mui/material'

import * as XLSX from 'xlsx'

import AppModal from '@/utils/components/AppModal'
import { DebouncedInput } from '@/utils/components/others/DebouncedInput'

import { useCursoAlumnos, CURSO_ALUMNOS_QUERY_KEY } from '../hooks/useCursoAlumnos'

interface CourseStudentsModalProps {
  open: boolean
  handleClose: () => void
  cursoId: string | null
  cursoTitulo: string | null
}

interface CertConfirm {
  inscripcionId: string
  alumnoNombre: string
  habilitadoActual: boolean
  tipo: 'ipg' | 'cip'
}

interface NotaEdit {
  examenId: string
  titulo: string
  nota: number
}

interface EditNotasState {
  inscripcionId: string
  cursoId: string
  alumnoNombre: string
  notas: NotaEdit[]
}

const estadoLabel: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ACTIVO: 'Activo',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado'
}

const estadoColor: Record<string, any> = {
  PENDIENTE: 'warning',
  ACTIVO: 'success',
  COMPLETADO: 'info',
  CANCELADO: 'error'
}

export default function CourseStudentsModal({
  open,
  handleClose,
  cursoId,
  cursoTitulo
}: CourseStudentsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [certConfirm, setCertConfirm] = useState<CertConfirm | null>(null)
  const [certLoading, setCertLoading] = useState(false)
  const [completarConfirm, setCompletarConfirm] = useState<{ inscripcionId: string; alumnoNombre: string } | null>(null)
  const [completarLoading, setCompletarLoading] = useState(false)
  const [editNotas, setEditNotas] = useState<EditNotasState | null>(null)
  const [editNotasLoading, setEditNotasLoading] = useState(false)

  const queryClient = useQueryClient()

  const { data, isLoading } = useCursoAlumnos({
    cursoId: open ? cursoId : null,
    search: searchTerm
  })

  const tieneCertPago = data?.precio_certificado && data.precio_certificado > 0

  const handleCloseModal = () => {
    setSearchTerm('')
    handleClose()
  }

  const handleToggleCert = async () => {
    if (!certConfirm) return

    setCertLoading(true)

    try {
      const res = await axios.patch(`/api/admin/inscripciones/${certConfirm.inscripcionId}/certificado`, {
        habilitado: !certConfirm.habilitadoActual,
        tipo: certConfirm.tipo
      })

      if (!res.data?.status) {
        toast.error(res.data?.message || 'Error al actualizar el certificado')

        return
      }

      await queryClient.refetchQueries({ queryKey: CURSO_ALUMNOS_QUERY_KEY(cursoId, searchTerm) })
      const tipoLabel = certConfirm.tipo === 'cip' ? 'CIP' : 'IPG'

      toast.success(
        certConfirm.habilitadoActual
          ? `Certificado ${tipoLabel} deshabilitado`
          : `Certificado ${tipoLabel} habilitado`
      )
      setCertConfirm(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al actualizar el certificado')
    } finally {
      setCertLoading(false)
    }
  }

  const handleCompletarTodo = async () => {
    if (!completarConfirm) return

    setCompletarLoading(true)

    try {
      await axios.post(`/api/admin/inscripciones/${completarConfirm.inscripcionId}/completar-todo`)
      queryClient.invalidateQueries({ queryKey: CURSO_ALUMNOS_QUERY_KEY(cursoId, searchTerm) })
      toast.success('Todas las lecciones completadas para el estudiante')
      setCompletarConfirm(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al completar las lecciones')
    } finally {
      setCompletarLoading(false)
    }
  }

  const handleSaveNotas = async () => {
    if (!editNotas) return

    setEditNotasLoading(true)

    try {
      await axios.patch(
        `/api/admin/cursos/${editNotas.cursoId}/alumnos/${editNotas.inscripcionId}/notas`,
        { notas: editNotas.notas.map(n => ({ examenId: n.examenId, nota: n.nota })) }
      )
      queryClient.invalidateQueries({ queryKey: CURSO_ALUMNOS_QUERY_KEY(cursoId, searchTerm) })
      toast.success('Notas actualizadas correctamente')
      setEditNotas(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar las notas')
    } finally {
      setEditNotasLoading(false)
    }
  }

  const exportToExcel = () => {
    if (!data?.alumnos || data.alumnos.length === 0) return

    const exportData = data.alumnos.map((a: any) => {
      const baseObj: any = {
        'Fecha Inscripción': new Date(a.inscrito_en).toLocaleDateString(),
        'Nombres': a.nombre,
        'Apellidos': a.apellido,
        'Documento': a.numero_documento || 'No especificado',
        'Correo': a.correo,
        'Celular / Teléfono': a.celular || 'No especificado',
        'Estado': estadoLabel[a.estado_inscripcion] || a.estado_inscripcion,
        'Evaluaciones': `${a.evaluaciones_realizadas}/${a.total_examenes}`,
      }

      if (a.notas && a.notas !== 'Sin exámenes') {
        const notasArray = a.notas.split(', ')

        notasArray.forEach((notaItem: string) => {
          const [key, val] = notaItem.split(': ')

          if (key && val) baseObj[`Nota ${key}`] = Number(val)
        })
      }

      baseObj['Promedio Final'] = Number(a.promedio)
      baseObj['Certificado'] = a.tiene_certificado ? 'Sí' : 'No'

      const ipgOk = a.certificado_ipg_habilitado
      const cipOk = a.certificado_cip_habilitado

      baseObj['Cert. IPG'] = ipgOk ? 'Habilitado' : 'Pago pendiente'
      baseObj['Cert. CIP'] = cipOk ? 'Habilitado' : 'Pago pendiente'

      return baseObj
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos')
    XLSX.writeFile(workbook, `Alumnos_${cursoTitulo?.replace(/[^a-zA-Z0-9]/g, '_') || 'Curso'}.xlsx`)
  }

  const colSpan = 8

  return (
    <>
      <AppModal open={open} handleClose={handleCloseModal} sx={{ maxWidth: 1200 }}>
        <Box sx={{ mb: 6 }}>
          <Typography variant='h5' fontWeight={700} gutterBottom>
            Alumnos Inscritos
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant='body2' color='text.secondary'>
              Curso: {cursoTitulo}
            </Typography>
            {tieneCertPago && (
              <Chip
                size='small'
                icon={<i className='tabler-lock' style={{ fontSize: '0.8rem' }} />}
                label={`Cert. de pago: ${data?.precio_certificado?.toFixed ? `S/ ${Number(data.precio_certificado).toFixed(2)}` : ''}`}
                color='warning'
                variant='tonal'
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <DebouncedInput
            value={searchTerm}
            onChange={val => setSearchTerm(String(val))}
            placeholder='Buscar por nombre o documento...'
            style={{ width: '100%', maxWidth: '400px' }}
          />
          <Chip
            icon={<i className='tabler-file-spreadsheet text-xl' />}
            label='Exportar Excel'
            onClick={exportToExcel}
            color='success'
            variant='outlined'
            sx={{ cursor: 'pointer', fontWeight: 600, px: 1, py: 2.5 }}
            disabled={!data?.alumnos || data.alumnos.length === 0}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: '62vh', overflow: 'auto' }}>
            <Table size='small' stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>F. Inscripción</TableCell>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>Progreso & Notas</TableCell>
                  <TableCell>Certificado</TableCell>
                  <TableCell>Cert. Pago</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!data?.alumnos || data.alumnos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} align='center' sx={{ py: 4 }}>
                      <Typography variant='body2' color='text.secondary'>
                        {searchTerm ? 'No se encontraron alumnos con ese término de búsqueda.' : 'No hay alumnos inscritos en este curso.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.alumnos.map((alumno: any) => (
                    <TableRow key={alumno.id}>
                      <TableCell>
                        <Typography variant='body2' color='text.secondary'>
                          {new Date(alumno.inscrito_en).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          component='a'
                          href='/admin/usuarios'
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            textDecoration: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 }
                          }}
                        >
                          <Avatar src={alumno.avatar || ''} sx={{ width: 32, height: 32 }}>
                            {alumno.nombre[0]}
                          </Avatar>
                          <Box>
                            <Typography variant='body2' fontWeight={600}>
                              {alumno.nombre} {alumno.apellido}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {alumno.correo}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {alumno.numero_documento || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600} sx={{ mb: 0.5 }}>
                          {alumno.evaluaciones_realizadas}/{alumno.total_examenes} Evals.{' '}
                          <Typography component='span' variant='body2' color='primary.main' fontWeight={700} ml={1}>
                            Prom: {alumno.promedio}
                          </Typography>
                        </Typography>
                        {alumno.notas && alumno.notas !== 'Sin exámenes' ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            {alumno.notas.split(', ').map((nota: string, i: number) => (
                              <Typography key={i} variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.2 }}>
                                {nota}
                              </Typography>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant='caption' color='text.secondary'>
                            {alumno.notas}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alumno.tiene_certificado ? 'Sí' : 'No'}
                          color={alumno.tiene_certificado ? 'success' : 'default'}
                          size='small'
                          variant={alumno.tiene_certificado ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              size='small'
                              label={alumno.certificado_ipg_habilitado ? 'IPG ✓' : 'Pago pendiente'}
                              color={alumno.certificado_ipg_habilitado ? 'success' : 'warning'}
                              variant='tonal'
                              sx={{ fontSize: '0.68rem', height: 22, width: 100 }}
                            />
                            <Chip
                              size='small'
                              label={alumno.certificado_cip_habilitado ? 'CIP ✓' : 'Pago pendiente'}
                              color={alumno.certificado_cip_habilitado ? 'success' : 'warning'}
                              variant='tonal'
                              sx={{ fontSize: '0.68rem', height: 22, width: 100 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Tooltip title={
                              alumno.certificado_ipg_habilitado
                                ? 'Deshabilitar certificado IPG'
                                : 'Habilitar certificado IPG'
                            }>
                              <IconButton
                                size='small'
                                onClick={() => setCertConfirm({
                                  inscripcionId: alumno.inscripcion_id,
                                  alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
                                  habilitadoActual: !!alumno.certificado_ipg_habilitado,
                                  tipo: 'ipg'
                                })}
                                sx={{
                                  bgcolor: alumno.certificado_ipg_habilitado
                                    ? 'rgba(220,38,38,0.08)'
                                    : 'rgba(22,163,74,0.08)',
                                  color: alumno.certificado_ipg_habilitado ? 'error.main' : 'success.main',
                                  '&:hover': {
                                    bgcolor: alumno.certificado_ipg_habilitado
                                      ? 'rgba(220,38,38,0.16)'
                                      : 'rgba(22,163,74,0.16)'
                                  }
                                }}
                              >
                                <i className={alumno.certificado_ipg_habilitado
                                  ? 'tabler-lock text-[16px]'
                                  : 'tabler-certificate text-[16px]'
                                } />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={
                              alumno.certificado_cip_habilitado
                                ? 'Deshabilitar certificado CIP'
                                : 'Habilitar certificado CIP'
                            }>
                              <IconButton
                                size='small'
                                onClick={() => setCertConfirm({
                                  inscripcionId: alumno.inscripcion_id,
                                  alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
                                  habilitadoActual: !!alumno.certificado_cip_habilitado,
                                  tipo: 'cip'
                                })}
                                sx={{
                                  bgcolor: alumno.certificado_cip_habilitado
                                    ? 'rgba(220,38,38,0.08)'
                                    : 'rgba(22,163,74,0.08)',
                                  color: alumno.certificado_cip_habilitado ? 'error.main' : 'success.main',
                                  '&:hover': {
                                    bgcolor: alumno.certificado_cip_habilitado
                                      ? 'rgba(220,38,38,0.16)'
                                      : 'rgba(22,163,74,0.16)'
                                  }
                                }}
                              >
                                <i className={alumno.certificado_cip_habilitado
                                  ? 'tabler-lock text-[16px]'
                                  : 'tabler-certificate text-[16px]'
                                } />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={estadoLabel[alumno.estado_inscripcion] || alumno.estado_inscripcion}
                          color={estadoColor[alumno.estado_inscripcion] || 'default'}
                          size='small'
                          variant='tonal'
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                        {alumno.total_examenes > 0 && cursoId && (
                          <Tooltip title='Editar notas'>
                            <IconButton
                              size='small'
                              onClick={() => setEditNotas({
                                inscripcionId: alumno.inscripcion_id,
                                cursoId,
                                alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
                                notas: alumno.notas_detalle ?? []
                              })}
                              sx={{
                                bgcolor: 'rgba(59,130,246,0.08)',
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'rgba(59,130,246,0.16)' }
                              }}
                            >
                              <i className='tabler-pencil text-[16px]' />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title='Completar todas las lecciones'>
                          <IconButton
                            size='small'
                            onClick={() => setCompletarConfirm({
                              inscripcionId: alumno.inscripcion_id,
                              alumnoNombre: `${alumno.nombre} ${alumno.apellido}`
                            })}
                            sx={{
                              bgcolor: 'rgba(2,94,68,0.08)',
                              color: '#025E44',
                              '&:hover': { bgcolor: 'rgba(2,94,68,0.16)' }
                            }}
                          >
                            <i className='tabler-checks text-[16px]' />
                          </IconButton>
                        </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AppModal>

      {/* Modal de confirmación para completar todas las lecciones */}
      {completarConfirm && (
        <AppModal open={!!completarConfirm} handleClose={() => !completarLoading && setCompletarConfirm(null)}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(2,94,68,0.1)'
            }}>
              <i className='tabler-checks text-4xl' style={{ color: '#025E44' }} />
            </Box>
            <Typography variant='h5' fontWeight={700} sx={{ mb: 1 }}>
              Completar todas las lecciones
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
              Se marcarán todas las lecciones como completadas para:
            </Typography>
            <Typography variant='body1' fontWeight={700} sx={{ mb: 4 }}>
              {completarConfirm.alumnoNombre}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant='tonal'
                color='secondary'
                onClick={() => setCompletarConfirm(null)}
                disabled={completarLoading}
              >
                Cancelar
              </Button>
              <Button
                variant='contained'
                color='success'
                onClick={handleCompletarTodo}
                disabled={completarLoading}
                startIcon={completarLoading
                  ? <CircularProgress size={16} color='inherit' />
                  : <i className='tabler-checks' />
                }
              >
                {completarLoading ? 'Procesando...' : 'Sí, completar todo'}
              </Button>
            </Box>
          </Box>
        </AppModal>
      )}

      {/* Modal de edición de notas */}
      {editNotas && (
        <AppModal open={!!editNotas} handleClose={() => !editNotasLoading && setEditNotas(null)} sx={{ maxWidth: 480 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'primary.lightOpacity'
              }}>
                <i className='tabler-pencil text-xl' style={{ color: '#025E44' }} />
              </Box>
              <Box>
                <Typography variant='h6' fontWeight={700}>Editar Notas</Typography>
                <Typography variant='body2' color='text.secondary'>{editNotas.alumnoNombre}</Typography>
              </Box>
            </Box>

            <Typography variant='caption' color='text.secondary' sx={{ mb: 2, display: 'block' }}>
              Escala vigesimal (0 – 20). El promedio ponderado se recalculará automáticamente.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
              {editNotas.notas.map((item, idx) => (
                <TextField
                  key={item.examenId}
                  label={`${item.titulo}`}
                  type='number'
                  size='small'
                  value={item.nota}
                  inputProps={{ min: 0, max: 20, step: 0.5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Typography variant='caption' color='text.secondary' sx={{ minWidth: 20 }}>
                          N{idx + 1}
                        </Typography>
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position='end'>/20</InputAdornment>
                  }}
                  onChange={e => {
                    const val = Math.min(20, Math.max(0, parseFloat(e.target.value) || 0))

                    setEditNotas(prev => prev ? {
                      ...prev,
                      notas: prev.notas.map((n, i) => i === idx ? { ...n, nota: val } : n)
                    } : null)
                  }}
                  fullWidth
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant='tonal'
                color='secondary'
                onClick={() => setEditNotas(null)}
                disabled={editNotasLoading}
              >
                Cancelar
              </Button>
              <Button
                variant='contained'
                onClick={handleSaveNotas}
                disabled={editNotasLoading}
                startIcon={editNotasLoading
                  ? <CircularProgress size={16} color='inherit' />
                  : <i className='tabler-device-floppy' />
                }
              >
                {editNotasLoading ? 'Guardando...' : 'Guardar Notas'}
              </Button>
            </Box>
          </Box>
        </AppModal>
      )}

      {/* Modal de confirmación para habilitar/deshabilitar certificado */}
      {certConfirm && (
        <AppModal open={!!certConfirm} handleClose={() => !certLoading && setCertConfirm(null)}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: certConfirm.habilitadoActual
                ? 'rgba(220,38,38,0.1)'
                : 'rgba(22,163,74,0.1)'
            }}>
              <i
                className={certConfirm.habilitadoActual ? 'tabler-lock text-4xl' : 'tabler-certificate text-4xl'}
                style={{
                  color: certConfirm.habilitadoActual
                    ? '#dc2626'
                    : '#16a34a'
                }}
              />
            </Box>
            <Typography variant='h5' fontWeight={700} sx={{ mb: 1 }}>
              {certConfirm.habilitadoActual
                ? `Deshabilitar certificado ${certConfirm.tipo === 'cip' ? 'CIP' : 'IPG'}`
                : `Habilitar certificado ${certConfirm.tipo === 'cip' ? 'CIP' : 'IPG'}`}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
              {certConfirm.habilitadoActual
                ? `El estudiante ya no podrá descargar el certificado ${certConfirm.tipo === 'cip' ? 'CIP' : 'IPG'} de este curso.`
                : `El estudiante podrá descargar el certificado ${certConfirm.tipo === 'cip' ? 'CIP' : 'IPG'} de este curso.`}
            </Typography>
            <Typography variant='body1' fontWeight={700} sx={{ mb: 4 }}>
              {certConfirm.alumnoNombre}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant='tonal'
                color='secondary'
                onClick={() => setCertConfirm(null)}
                disabled={certLoading}
              >
                Cancelar
              </Button>
              <Button
                variant='contained'
                color={certConfirm.habilitadoActual ? 'error' : 'success'}
                onClick={handleToggleCert}
                disabled={certLoading}
                startIcon={certLoading
                  ? <CircularProgress size={16} color='inherit' />
                  : <i className={certConfirm.habilitadoActual ? 'tabler-lock' : 'tabler-circle-check'} />
                }
              >
                {certLoading
                  ? 'Guardando...'
                  : certConfirm.habilitadoActual ? 'Sí, deshabilitar' : 'Sí, habilitar'
                }
              </Button>
            </Box>
          </Box>
        </AppModal>
      )}
    </>
  )
}
