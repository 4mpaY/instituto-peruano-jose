'use client'

import { useRef, useState } from 'react'

import {
  Alert, Box, Button, Chip, CircularProgress, Divider,
  Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Typography
} from '@mui/material'
import * as XLSX from 'xlsx'

import AppModal from '@/utils/components/AppModal'
import { useImportarUsuarios } from '../hooks/useUsuarios'

type Step = 'upload' | 'preview' | 'result'

interface FilaPreview {
  fila: number
  nombre: string
  apellido: string
  correo: string
  contrasena: string
  numero_documento: string
  celular: string
  errores: string[]
}

interface ImportarUsuariosModalProps {
  open: boolean
  handleClose: () => void
}

const COLUMNAS_PLANTILLA = ['nombre', 'apellido', 'correo', 'contrasena', 'numero_documento', 'celular']

function validarFila(row: any, fila: number): FilaPreview {
  const errores: string[] = []
  const nombre = String(row.nombre || '').trim()
  const apellido = String(row.apellido || '').trim()
  const correo = String(row.correo || '').trim()
  const contrasena = String(row.contrasena || '').trim()
  const numero_documento = String(row.numero_documento || '').trim()
  const celular = String(row.celular || '').trim()

  if (!nombre || nombre.length < 2 || nombre.length > 50) errores.push('Nombre inválido (2-50 chars)')
  if (!apellido || apellido.length < 2 || apellido.length > 50) errores.push('Apellido inválido (2-50 chars)')
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.push('Correo inválido')
  if (!contrasena || contrasena.length < 8) errores.push('Contraseña mín. 8 caracteres')
  if (!numero_documento || !/^\d{8}$/.test(numero_documento)) errores.push('DNI debe tener exactamente 8 dígitos')
  if (celular && !/^9\d{8}$/.test(celular)) errores.push('Celular: formato 9XXXXXXXX')

  return { fila, nombre, apellido, correo, contrasena, numero_documento, celular, errores }
}

function descargarPlantilla() {
  const datos = [
    COLUMNAS_PLANTILLA,
    ['Juan', 'Pérez', 'juan.perez@ejemplo.com', 'clave1234', '12345678', '987654321'],
  ]

  const ws = XLSX.utils.aoa_to_sheet(datos)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios')
  XLSX.writeFile(wb, 'plantilla_usuarios.xlsx')
}

function descargarReporteErrores(errores: { fila: number; correo: string; mensaje: string }[]) {
  const datos = [
    ['Fila', 'Correo', 'Motivo del error'],
    ...errores.map(e => [e.fila, e.correo, e.mensaje])
  ]

  const ws = XLSX.utils.aoa_to_sheet(datos)

  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'Errores')
  XLSX.writeFile(wb, 'reporte_errores_importacion.xlsx')
}

export default function ImportarUsuariosModal({ open, handleClose }: ImportarUsuariosModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [filas, setFilas] = useState<FilaPreview[]>([])
  const [dragging, setDragging] = useState(false)
  const [resultado, setResultado] = useState<{ exitosos: number; errores: { fila: number; correo: string; mensaje: string }[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { mutateAsync: importar, isPending } = useImportarUsuarios()

  const handleClose_ = () => {
    setStep('upload')
    setFilas([])
    setResultado(null)
    handleClose()
  }

  const parsearArchivo = (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const parseadas = rows.map((row, idx) => validarFila(row, idx + 2))

      setFilas(parseadas)
      setStep('preview')
    }

    reader.readAsArrayBuffer(file)
  }

  const handleFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) return

    parsearArchivo(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]

    if (file) handleFile(file)
  }

  const handleImportar = async () => {
    const validas = filas.filter(f => f.errores.length === 0)

    try {
      const res = await importar(validas)

      setResultado(res)
      setStep('result')
    } catch {
      setResultado({ exitosos: 0, errores: [{ fila: 0, correo: '', mensaje: 'Error de conexión al importar' }] })
      setStep('result')
    }
  }

  const validas = filas.filter(f => f.errores.length === 0)
  const invalidas = filas.filter(f => f.errores.length > 0)

  return (
    <AppModal open={open} handleClose={handleClose_} sx={{ maxWidth: 720 }}>

      {/* PASO 1: Upload */}
      {step === 'upload' && (
        <Stack spacing={3}>
          <Box>
            <Typography variant='h5' fontWeight={700}>Importar Usuarios desde Excel</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
              Sube un archivo .xlsx con los datos de los usuarios a crear. Todos serán registrados como Estudiante.
            </Typography>
          </Box>

          {/* Zona drag & drop */}
          <Box
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: dragging ? 'primary.main' : 'divider',
              borderRadius: 3,
              p: 5,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: dragging ? 'primary.lighterOpacity' : 'action.hover',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lighterOpacity' }
            }}
          >
            <i className='tabler-file-spreadsheet' style={{ fontSize: 48, color: '#25927F', marginBottom: 8 }} />
            <Typography variant='subtitle1' fontWeight={600}>Arrastra tu archivo aquí</Typography>
            <Typography variant='body2' color='text.secondary'>o haz clic para seleccionar (.xlsx, .xls)</Typography>
            <input
              ref={fileInputRef}
              type='file'
              accept='.xlsx,.xls'
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />
          </Box>

          <Divider>o</Divider>

          <Stack direction='row' spacing={2} justifyContent='center'>
            <Button
              variant='contained'
              color='success'
              startIcon={<i className='tabler-download' />}
              onClick={descargarPlantilla}
            >
              Descargar Plantilla
            </Button>
          </Stack>

          <Alert severity='success' sx={{ borderRadius: 2 }}>
            <strong>Columnas requeridas:</strong> nombre, apellido, correo, contrasena, numero_documento<br />
            <strong>Opcional:</strong> celular
          </Alert>
        </Stack>
      )}

      {/* PASO 2: Vista previa */}
      {step === 'preview' && (
        <Stack spacing={3}>
          <Box>
            <Typography variant='h5' fontWeight={700}>Vista Previa</Typography>
            <Stack direction='row' spacing={1.5} sx={{ mt: 1 }}>
              <Chip label={`${validas.length} válidos`} color='success' size='small' variant='tonal' />
              {invalidas.length > 0 && (
                <Chip label={`${invalidas.length} con errores`} color='error' size='small' variant='tonal' />
              )}
            </Stack>
          </Box>

          <TableContainer sx={{ maxHeight: 340, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size='small' stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fila</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>DNI</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filas.map(f => (
                  <TableRow
                    key={f.fila}
                    sx={{ bgcolor: f.errores.length > 0 ? 'error.lighterOpacity' : undefined }}
                  >
                    <TableCell>{f.fila}</TableCell>
                    <TableCell>{f.nombre} {f.apellido}</TableCell>
                    <TableCell>{f.correo}</TableCell>
                    <TableCell>{f.numero_documento}</TableCell>
                    <TableCell>
                      {f.errores.length === 0 ? (
                        <Chip label='Válido' color='success' size='small' variant='tonal' />
                      ) : (
                        <Tooltip title={f.errores.join(' · ')} arrow>
                          <Chip label='Error' color='error' size='small' variant='tonal' sx={{ cursor: 'help' }} />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction='row' justifyContent='space-between'>
            <Button variant='outlined' color='secondary' onClick={() => setStep('upload')}
              startIcon={<i className='tabler-arrow-left' />}
            >
              Volver
            </Button>
            <Button
              variant='contained'
              disabled={validas.length === 0 || isPending}
              onClick={handleImportar}
              startIcon={isPending ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-upload' />}
            >
              {isPending ? 'Importando...' : `Importar ${validas.length} usuarios`}
            </Button>
          </Stack>
        </Stack>
      )}

      {/* PASO 3: Resultado */}
      {step === 'result' && resultado && (
        <Stack spacing={3}>
          <Typography variant='h5' fontWeight={700}>Resultado de la Importación</Typography>

          <Stack direction='row' spacing={2}>
            <Alert severity='success' sx={{ flex: 1, borderRadius: 2 }}>
              <strong>{resultado.exitosos}</strong> usuarios creados exitosamente
            </Alert>
            {resultado.errores.length > 0 && (
              <Alert severity='error' sx={{ flex: 1, borderRadius: 2 }}>
                <strong>{resultado.errores.length}</strong> filas con errores
              </Alert>
            )}
          </Stack>

          {resultado.errores.length > 0 && (
            <>
              <TableContainer sx={{ maxHeight: 260, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size='small' stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fila</TableCell>
                      <TableCell>Correo</TableCell>
                      <TableCell>Motivo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultado.errores.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell>{e.fila}</TableCell>
                        <TableCell>{e.correo}</TableCell>
                        <TableCell>{e.mensaje}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                variant='outlined'
                startIcon={<i className='tabler-download' />}
                onClick={() => descargarReporteErrores(resultado.errores)}
                sx={{ alignSelf: 'flex-start' }}
              >
                Descargar reporte de errores
              </Button>
            </>
          )}

          <Stack direction='row' justifyContent='flex-end'>
            <Button variant='contained' onClick={handleClose_}>
              Cerrar
            </Button>
          </Stack>
        </Stack>
      )}
    </AppModal>
  )
}
