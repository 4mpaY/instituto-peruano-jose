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
  Button
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
      await axios.patch(`/api/admin/inscripciones/${certConfirm.inscripcionId}/certificado`, {
        habilitado: !certConfirm.habilitadoActual
      })
      queryClient.invalidateQueries({ queryKey: CURSO_ALUMNOS_QUERY_KEY(cursoId, searchTerm) })
      toast.success(certConfirm.habilitadoActual ? 'Certificado deshabilitado' : 'Certificado habilitado')
      setCertConfirm(null)
    } catch {
      toast.error('Error al actualizar el certificado')
    } finally {
      setCertLoading(false)
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

      if (tieneCertPago) {
        baseObj['Cert. Pago'] = a.certificado_habilitado ? 'Habilitado' : 'Pendiente pago'
      }

      return baseObj
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos')
    XLSX.writeFile(workbook, `Alumnos_${cursoTitulo?.replace(/[^a-zA-Z0-9]/g, '_') || 'Curso'}.xlsx`)
  }

  const colSpan = tieneCertPago ? 7 : 6

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
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>F. Inscripción</TableCell>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>Progreso & Notas</TableCell>
                  <TableCell>Certificado</TableCell>
                  {tieneCertPago && <TableCell>Cert. Pago</TableCell>}
                  <TableCell>Estado</TableCell>
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
                        <Typography variant='body2' fontWeight={600}>
                          {alumno.evaluaciones_realizadas}/{alumno.total_examenes} Evals.{' '}
                          <Typography component='span' variant='body2' color='primary.main' fontWeight={700} ml={1}>
                            Prom: {alumno.promedio}
                          </Typography>
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {alumno.notas}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alumno.tiene_certificado ? 'Sí' : 'No'}
                          color={alumno.tiene_certificado ? 'success' : 'default'}
                          size='small'
                          variant={alumno.tiene_certificado ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      {tieneCertPago && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              size='small'
                              label={alumno.certificado_habilitado ? 'Habilitado' : 'Pendiente pago'}
                              color={alumno.certificado_habilitado ? 'success' : 'warning'}
                              variant='tonal'
                            />
                            <Tooltip title={alumno.certificado_habilitado ? 'Deshabilitar certificado' : 'Habilitar certificado'}>
                              <IconButton
                                size='small'
                                onClick={() => setCertConfirm({
                                  inscripcionId: alumno.inscripcion_id,
                                  alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
                                  habilitadoActual: alumno.certificado_habilitado
                                })}
                                sx={{
                                  bgcolor: alumno.certificado_habilitado
                                    ? 'rgba(220,38,38,0.08)'
                                    : 'rgba(22,163,74,0.08)',
                                  color: alumno.certificado_habilitado ? 'error.main' : 'success.main',
                                  '&:hover': {
                                    bgcolor: alumno.certificado_habilitado
                                      ? 'rgba(220,38,38,0.16)'
                                      : 'rgba(22,163,74,0.16)'
                                  }
                                }}
                              >
                                <i className={alumno.certificado_habilitado
                                  ? 'tabler-lock text-[16px]'
                                  : 'tabler-certificate text-[16px]'
                                } />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={estadoLabel[alumno.estado_inscripcion] || alumno.estado_inscripcion}
                          color={estadoColor[alumno.estado_inscripcion] || 'default'}
                          size='small'
                          variant='tonal'
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AppModal>

      {/* Modal de confirmación para habilitar/deshabilitar certificado */}
      {certConfirm && (
        <AppModal open={!!certConfirm} handleClose={() => !certLoading && setCertConfirm(null)}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: certConfirm.habilitadoActual ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)'
            }}>
              <i
                className={certConfirm.habilitadoActual ? 'tabler-lock text-4xl' : 'tabler-certificate text-4xl'}
                style={{ color: certConfirm.habilitadoActual ? '#dc2626' : '#16a34a' }}
              />
            </Box>
            <Typography variant='h5' fontWeight={700} sx={{ mb: 1 }}>
              {certConfirm.habilitadoActual ? 'Deshabilitar certificado' : 'Habilitar certificado'}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
              {certConfirm.habilitadoActual
                ? 'El estudiante ya no podrá descargar el certificado de este curso.'
                : 'El estudiante podrá descargar el certificado de este curso.'}
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
