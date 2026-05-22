'use client'

import { useState, Fragment } from 'react'

import { useRouter } from 'next/navigation'

import {
    Card,
    CardHeader,
    CardContent,
    Grid,
    Button,
    MenuItem,
    Autocomplete,
    Typography,
    CircularProgress
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSnackbar } from 'notistack'

import { MetodoPago } from '@prisma/client'

import CustomTextField from '@core/components/mui/TextField'
import { crearPedidoManualSchema, type CrearPedidoManualDto } from '@/schemas/pedido.schema'
import { useCreatePedidoManual } from '../hooks/usePedidos'
import { useUsuarios } from '@/features/admin/usuarios/hooks/useUsuarios'
import { useCursos } from '@/features/admin/cursos/hooks/useCursos'

export function ManualPedidoForm() {
    const router = useRouter()
    const { enqueueSnackbar } = useSnackbar()
    const [selectedCoursePrice, setSelectedCoursePrice] = useState<number>(0)

    const { data: usuariosData, isLoading: isLoadingUsuarios } = useUsuarios({ limit: '1000' })
    const { data: cursosData, isLoading: isLoadingCursos } = useCursos()

    const usuarios = (usuariosData?.usuarios || []).filter(u => u.rol === 'ESTUDIANTE')
    const cursos = (cursosData?.cursos || []).filter(c => c.estado === 'PUBLICADO')

    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<CrearPedidoManualDto>({
        resolver: zodResolver(crearPedidoManualSchema) as any,
        defaultValues: {
            usuarios_ids: [],
            cursos_ids: [],
            estado: 'COMPLETADO' as const,
            metodo_pago: MetodoPago.TRANSFERENCIA,
            precio: 0,
            mensaje: ''
        }
    })

    const { mutateAsync: createPedido } = useCreatePedidoManual()

    const onSubmit = async (data: CrearPedidoManualDto) => {
        try {
            await createPedido(data)
            enqueueSnackbar('Pedido manual creado exitosamente', { variant: 'success' })
            router.push('/admin/pedidos')
        } catch (error: any) {
            const errorMessage = error?.message || 'Error al crear el pedido manual'

            enqueueSnackbar(errorMessage, { variant: 'error' })
        }
    }

    return (
        <Card>
            <CardHeader title='Generar Nuevo Pedido Manual' />
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={6}>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name='usuarios_ids'
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Autocomplete
                                        fullWidth
                                        multiple
                                        options={usuarios}
                                        getOptionLabel={(option) => `${option.nombre} ${option.apellido} (${option.correo})`}
                                        loading={isLoadingUsuarios}
                                        value={usuarios.filter((u) => value.includes(u.id))}
                                        onChange={(_, newValue) => onChange(newValue.map(u => u.id))}
                                        renderInput={(params) => (
                                            <CustomTextField
                                                {...params}
                                                label='Seleccionar Estudiantes'
                                                placeholder='Busca por nombre o correo'
                                                error={!!errors.usuarios_ids}
                                                helperText={(errors.usuarios_ids as any)?.message}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <Fragment>
                                                            {isLoadingUsuarios ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </Fragment>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Controller
                                name='cursos_ids'
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Autocomplete
                                        fullWidth
                                        multiple
                                        options={cursos}
                                        getOptionLabel={(option) => option.titulo}
                                        loading={isLoadingCursos}
                                        value={cursos.filter((c) => value.includes(c.id))}
                                        onChange={(_, newValue) => {
                                            onChange(newValue.map(c => c.id))

                                            const totalPrice = newValue.reduce((acc, curr) => acc + Number(curr.precio), 0)

                                            setValue('precio', totalPrice)
                                            setSelectedCoursePrice(totalPrice)
                                        }}
                                        renderInput={(params) => (
                                            <CustomTextField
                                                {...params}
                                                label='Seleccionar Cursos'
                                                placeholder='Busca cursos activos'
                                                error={!!errors.cursos_ids}
                                                helperText={(errors.cursos_ids as any)?.message}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <Fragment>
                                                            {isLoadingCursos ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </Fragment>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Controller
                                name='precio'
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type='number'
                                        label='Precio del Pedido'
                                        placeholder='0.00'
                                        error={!!errors.precio}
                                        helperText={errors.precio ? errors.precio.message : `Precio total sugerido: ${selectedCoursePrice}`}
                                        InputProps={{
                                            startAdornment: <Typography sx={{ mr: 2, color: 'text.secondary' }}>PEN</Typography>
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Controller
                                name='estado'
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label='Estado del Pedido'
                                        error={!!errors.estado}
                                        helperText={errors.estado?.message ?? (field.value !== 'COMPLETADO' ? 'El alumno no será inscrito hasta que el pedido esté Completado' : 'El alumno será inscrito inmediatamente')}
                                    >
                                        <MenuItem value='PENDIENTE'>Pendiente</MenuItem>
                                        <MenuItem value='PROCESANDO'>Procesando</MenuItem>
                                        <MenuItem value='COMPLETADO'>Completado (Pagado)</MenuItem>
                                        <MenuItem value='CANCELADO'>Cancelado</MenuItem>
                                        <MenuItem value='REEMBOLSADO'>Reembolsado</MenuItem>
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Controller
                                name='metodo_pago'
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label='Método de Pago'
                                        error={!!errors.metodo_pago}
                                        helperText={errors.metodo_pago?.message}
                                    >
                                        <MenuItem value={MetodoPago.TRANSFERENCIA}>Transferencia Bancaria</MenuItem>
                                        <MenuItem value={MetodoPago.YAPE}>Yape</MenuItem>
                                        <MenuItem value={MetodoPago.PLIN}>Plin</MenuItem>
                                        <MenuItem value={MetodoPago.IZIPAY}>Izipay</MenuItem>
                                        <MenuItem value={MetodoPago.PAYPAL}>PayPal</MenuItem>
                                        <MenuItem value={MetodoPago.TARJETA_CREDITO}>Tarjeta de Crédito</MenuItem>
                                        <MenuItem value={MetodoPago.OTRO}>Otro</MenuItem>
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Controller
                                name='mensaje'
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        label='Nota/Mensaje (Opcional)'
                                        placeholder='Ej: Beca del 50%, Pago en efectivo...'
                                        error={!!errors.mensaje}
                                        helperText={errors.mensaje?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Controller
                                name='tipo_comprobante'
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label='Tipo de Comprobante'
                                        value={field.value || ''}
                                        error={!!errors.tipo_comprobante}
                                        helperText={errors.tipo_comprobante?.message}
                                    >
                                        <MenuItem value=''>Ninguno</MenuItem>
                                        <MenuItem value='TICKET'>Ticket</MenuItem>
                                        <MenuItem value='BOLETA'>Boleta</MenuItem>
                                        <MenuItem value='FACTURA'>Factura</MenuItem>
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Controller
                                name='numero_comprobante'
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        label='Número de Documento (RUC/DNI)'
                                        placeholder='Ej: 20601234567'
                                        value={field.value || ''}
                                        error={!!errors.numero_comprobante}
                                        helperText={errors.numero_comprobante?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} className='flex gap-4'>
                            <Button
                                type='submit'
                                variant='contained'
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                            >
                                Generar Pedido y Enrolar
                            </Button>
                            <Button
                                variant='outlined'
                                color='secondary'
                                onClick={() => router.push('/admin/pedidos')}
                            >
                                Cancelar
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </CardContent>
        </Card>
    )
}
