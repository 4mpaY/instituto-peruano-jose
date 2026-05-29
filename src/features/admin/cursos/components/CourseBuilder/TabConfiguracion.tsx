'use client'

import { useState } from 'react'

import {
    Box,
    Button,
    Chip,
    Divider,
    FormControlLabel,
    Grid,
    MenuItem,
    Switch,
    Typography
} from '@mui/material'

import { useSnackbar } from 'notistack'

import { useCambiarEstadoCurso, useEditCurso } from '../../hooks/useCursos'

import type { Curso } from '../../entity/Curso'
import CustomTextField from '@core/components/mui/TextField'

interface TabConfiguracionProps {
    curso: Curso
    onSuccess: () => void
}

export function TabConfiguracion({ curso, onSuccess }: TabConfiguracionProps) {
    const { enqueueSnackbar } = useSnackbar()
    const editMutation = useEditCurso()
    const estadoMutation = useCambiarEstadoCurso()

    const [esGratis, setEsGratis] = useState(curso.es_gratis)
    const [esPrivado, setEsPrivado] = useState(curso.es_privado ?? false)
    const [completarAutomatico, setCompletarAutomatico] = useState(curso.completar_automatico ?? false)
    const [precio, setPrecio] = useState(curso.precio)
    const [precioFalso, setPrecioFalso] = useState(curso.precio_falso)
    const [moneda, setMoneda] = useState(curso.moneda)
    const [precioCertificado, setPrecioCertificado] = useState<number | ''>(curso.precio_certificado ?? '')
    const [vigenciaMeses, setVigenciaMeses] = useState<number | ''>((curso as any).vigencia_meses ?? '')

    const handleSavePrice = async () => {
        try {
            await editMutation.mutateAsync({
                id: curso.id,
                data: {
                    es_gratis: esGratis,
                    precio: esGratis ? 0 : precio,
                    precio_falso: esGratis ? 0 : precioFalso,
                    moneda,
                    precio_certificado: esGratis
                        ? (precioCertificado === '' ? null : Number(precioCertificado))
                        : null
                }
            })
            enqueueSnackbar('Configuración actualizada', { variant: 'success' })
            onSuccess()
        } catch (error: any) {
            enqueueSnackbar(error?.message || 'Error', { variant: 'error' })
        }
    }

    const handleSavePrivado = async (valor: boolean) => {
        try {
            await editMutation.mutateAsync({ id: curso.id, data: { es_privado: valor } })
            setEsPrivado(valor)
            enqueueSnackbar(valor ? 'Curso marcado como privado' : 'Curso marcado como público', { variant: 'success' })
            onSuccess()
        } catch (error: any) {
            enqueueSnackbar(error?.message || 'Error', { variant: 'error' })
        }
    }

    const handleSaveCompletarAutomatico = async (valor: boolean) => {
        try {
            await editMutation.mutateAsync({ id: curso.id, data: { completar_automatico: valor } })
            setCompletarAutomatico(valor)
            enqueueSnackbar(valor ? 'Completado automático habilitado' : 'Completado automático deshabilitado', { variant: 'success' })
            onSuccess()
        } catch (error: any) {
            enqueueSnackbar(error?.message || 'Error', { variant: 'error' })
        }
    }

    const handleChangeEstado = async (nuevoEstado: 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO') => {
        try {
            await estadoMutation.mutateAsync({ id: curso.id, data: { estado: nuevoEstado } })
            enqueueSnackbar(`Curso ${nuevoEstado === 'PUBLICADO' ? 'publicado' : nuevoEstado === 'ARCHIVADO' ? 'archivado' : 'volvió a borrador'}`, { variant: 'success' })
            onSuccess()
        } catch (error: any) {
            enqueueSnackbar(error?.message || error?.error || 'Error al cambiar estado', { variant: 'error' })
        }
    }

    return (
        <Grid container spacing={4}>
            {/* Precio */}
            <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>Precio</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={esGratis}
                            onChange={e => {
                                setEsGratis(e.target.checked)

                                if (e.target.checked) setPrecio(0)
                                else setPrecioCertificado('')
                            }}
                        />
                    }
                    label='Este curso es gratis'
                />
                {esGratis && (
                    <Box sx={{ mt: 2 }}>
                        <CustomTextField
                            type='number'
                            label='Precio del certificado'
                            value={precioCertificado}
                            onChange={e => setPrecioCertificado(e.target.value === '' ? '' : Number(e.target.value))}
                            sx={{ width: 260 }}
                            inputProps={{ min: 0, step: 0.01 }}
                            helperText='Déjalo vacío si el certificado también es gratuito'
                        />
                    </Box>
                )}
                {!esGratis && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <CustomTextField
                            type='number'
                            label='Precio'
                            value={precio}
                            onChange={e => setPrecio(Number(e.target.value))}
                            sx={{ width: 200 }}
                        />
                        <CustomTextField
                            type='number'
                            label='Precio Falso (Opcional)'
                            value={precioFalso}
                            onChange={e => setPrecioFalso(Number(e.target.value))}
                            sx={{ width: 200 }}
                        />
                        <CustomTextField
                            select
                            label='Moneda'
                            value={moneda}
                            onChange={e => setMoneda(e.target.value)}
                            sx={{ width: 120 }}
                        >
                            <MenuItem value='PEN'>PEN (S/)</MenuItem>
                            <MenuItem value='USD'>USD ($)</MenuItem>
                        </CustomTextField>
                    </Box>
                )}
                <Box sx={{ mt: 2 }}>
                    <Button
                        variant='contained'
                        onClick={handleSavePrice}
                        disabled={editMutation.isPending}
                        startIcon={<i className='tabler-device-floppy' />}
                    >
                        Guardar Precio
                    </Button>
                </Box>
                <Box sx={{ mt: 3 }}>
                    <Typography variant='subtitle2' sx={{ mb: 1 }}>Vigencia de Acceso</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                        <CustomTextField
                            type='number'
                            label='Vigencia (meses)'
                            value={vigenciaMeses}
                            onChange={e => setVigenciaMeses(e.target.value === '' ? '' : Number(e.target.value))}
                            sx={{ width: 200 }}
                            inputProps={{ min: 1 }}
                            helperText='Dejar vacío para sin caducidad'
                        />
                        <Button
                            variant='outlined'
                            onClick={async () => {
                                try {
                                    await editMutation.mutateAsync({ id: curso.id, data: { vigencia_meses: vigenciaMeses === '' ? null : Number(vigenciaMeses) } })
                                    enqueueSnackbar('Vigencia actualizada', { variant: 'success' })
                                    onSuccess()
                                } catch (error: any) {
                                    enqueueSnackbar(error?.message || 'Error al actualizar vigencia', { variant: 'error' })
                                }
                            }}
                            disabled={editMutation.isPending}
                        >
                            Guardar Vigencia
                        </Button>
                    </Box>
                </Box>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Visibilidad */}
            <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 1 }}>Visibilidad</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Un curso privado no aparece en el catálogo público. Solo el administrador puede asignarlo manualmente a un pedido.
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={esPrivado}
                            onChange={e => handleSavePrivado(e.target.checked)}
                            disabled={editMutation.isPending}
                        />
                    }
                    label={esPrivado ? 'Curso privado (no visible en catálogo)' : 'Curso público (visible en catálogo)'}
                />
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Finalización */}
            <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 1 }}>Finalización</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Permite al alumno completar todas las lecciones con un clic para acceder al certificado inmediatamente, sin necesidad de marcarlas una por una.
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={completarAutomatico}
                            onChange={e => handleSaveCompletarAutomatico(e.target.checked)}
                            disabled={editMutation.isPending}
                        />
                    }
                    label={completarAutomatico ? 'Completado automático habilitado' : 'Completado automático deshabilitado'}
                />
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Estado */}
            <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>Estado del Curso</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                    Estado actual: <Chip
                        size='small'
                        variant='tonal'
                        label={curso.estado === 'BORRADOR' ? 'Borrador' : curso.estado === 'PUBLICADO' ? 'Publicado' : 'Archivado'}
                        color={curso.estado === 'BORRADOR' ? 'warning' : curso.estado === 'PUBLICADO' ? 'success' : 'secondary'}
                    />
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {curso.estado !== 'PUBLICADO' && (
                        <Button
                            variant='contained'
                            color='success'
                            onClick={() => handleChangeEstado('PUBLICADO')}
                            disabled={estadoMutation.isPending}
                            startIcon={<i className='tabler-world' />}
                        >
                            Publicar Curso
                        </Button>
                    )}
                    {curso.estado === 'PUBLICADO' && (
                        <Button
                            variant='contained'
                            color='secondary'
                            onClick={() => handleChangeEstado('ARCHIVADO')}
                            disabled={estadoMutation.isPending}
                            startIcon={<i className='tabler-archive' />}
                        >
                            Archivar
                        </Button>
                    )}
                    {curso.estado !== 'BORRADOR' && (
                        <Button
                            variant='outlined'
                            onClick={() => handleChangeEstado('BORRADOR')}
                            disabled={estadoMutation.isPending}
                            startIcon={<i className='tabler-pencil' />}
                        >
                            Volver a Borrador
                        </Button>
                    )}
                </Box>
                {curso.estado !== 'PUBLICADO' && (
                    <Typography variant='caption' color='text.disabled' sx={{ mt: 2, display: 'block' }}>
                        Para publicar se requiere al menos 1 módulo con 1 lección publicada.
                    </Typography>
                )}
            </Grid>
        </Grid>
    )
}
