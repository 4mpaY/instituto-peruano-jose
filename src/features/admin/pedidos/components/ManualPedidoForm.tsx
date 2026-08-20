'use client'

import { useState, Fragment, useEffect } from 'react'

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
    CircularProgress,
    Box,
    FormControlLabel,
    Radio,
    RadioGroup,
    IconButton
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
    
    // Upload state
    const [vouchers, setVouchers] = useState<File[]>([])
    const [voucherPreviews, setVoucherPreviews] = useState<string[]>([])

    const { data: usuariosData, isLoading: isLoadingUsuarios } = useUsuarios({ limit: '1000' })
    const { data: cursosData, isLoading: isLoadingCursos } = useCursos()

    const usuarios = (usuariosData?.usuarios || []).filter(u => u.rol === 'ESTUDIANTE')
    const cursos = (cursosData?.cursos || []).filter(c => c.estado === 'PUBLICADO')

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<CrearPedidoManualDto>({
        resolver: zodResolver(crearPedidoManualSchema) as any,
        defaultValues: {
            tipo_pedido: 'CURSO',
            usuarios_ids: [],
            cursos_ids: [],
            estado: 'COMPLETADO' as const,
            metodo_pago: MetodoPago.TRANSFERENCIA,
            precio: 0,
            mensaje: '',
            tipo_certificado: null,
            fecha_entrega_estimada: null,
        }
    })

    const tipoPedido = watch('tipo_pedido')

    // Clean up voucher object URL
    useEffect(() => {
        return () => {
            voucherPreviews.forEach(p => URL.revokeObjectURL(p))
        }
    }, [voucherPreviews])

    const handleVouchers = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        
        const validFiles = files.filter(f => {
            if (f.size > 5 * 1024 * 1024) {
                enqueueSnackbar(`El archivo ${f.name} supera los 5 MB`, { variant: 'warning' })
                
return false
            }

            
return true
        })

        if (validFiles.length > 0) {
            const newVouchers = [...vouchers, ...validFiles].slice(0, 5)
            
            voucherPreviews.forEach(p => URL.revokeObjectURL(p))
            setVouchers(newVouchers)
            setVoucherPreviews(newVouchers.map(f => URL.createObjectURL(f)))
        }
        
        e.target.value = ''
    }

    const removeVoucher = (idx: number) => {
        const newVouchers = [...vouchers]

        newVouchers.splice(idx, 1)
        
        voucherPreviews.forEach(p => URL.revokeObjectURL(p))
        setVouchers(newVouchers)
        setVoucherPreviews(newVouchers.map(f => URL.createObjectURL(f)))
    }

    const { mutateAsync: createPedido } = useCreatePedidoManual()

    const onSubmit = async (data: CrearPedidoManualDto) => {
        try {
            // Validations for CERTIFICADO
            if (data.tipo_pedido === 'CERTIFICADO') {
                if (data.usuarios_ids.length !== 1) {
                    return enqueueSnackbar('Selecciona exactamente un estudiante para el certificado', { variant: 'error' })
                }

                if (data.cursos_ids.length !== 1) {
                    return enqueueSnackbar('Selecciona exactamente un curso para el certificado', { variant: 'error' })
                }

                if (!data.tipo_certificado) {
                    return enqueueSnackbar('Selecciona el tipo de certificado', { variant: 'error' })
                }
            }

            const res = await createPedido(data) as any
            
            // Upload voucher if needed
            if (data.tipo_pedido === 'CERTIFICADO' && vouchers.length > 0 && res?.pedidoId) {
                const fd = new FormData()

                vouchers.forEach(v => fd.append('voucher', v))

                const voucherRes = await fetch(`/api/pedidos/${res.pedidoId}/voucher`, {
                    method: 'POST',
                    body: fd,
                    credentials: 'include',
                })

                if (!voucherRes.ok) {
                    throw new Error('El pedido se creó, pero falló la subida del voucher')
                }
            }

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
                        <Grid item xs={12}>
                            <Controller
                                name="tipo_pedido"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup row {...field} onChange={(e) => field.onChange(e.target.value)}>
                                        <FormControlLabel value="CURSO" control={<Radio />} label="Inscripción a Cursos" />
                                        <FormControlLabel value="CERTIFICADO" control={<Radio />} label="Trámite de Certificado" />
                                    </RadioGroup>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Controller
                                name='usuarios_ids'
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Autocomplete
                                        fullWidth
                                        multiple={tipoPedido === 'CURSO'}
                                        options={usuarios}
                                        getOptionLabel={(option) => `${option.nombre} ${option.apellido} (${option.correo})`}
                                        loading={isLoadingUsuarios}
                                        value={tipoPedido === 'CURSO' ? usuarios.filter((u) => value.includes(u.id)) : (usuarios.find(u => value.includes(u.id)) || null)}
                                        onChange={(_, newValue) => {
                                            if (tipoPedido === 'CURSO') {
                                                onChange((newValue as any[]).map(u => u.id))
                                            } else {
                                                onChange(newValue ? [(newValue as any).id] : [])
                                            }
                                        }}
                                        renderInput={(params) => (
                                            <CustomTextField
                                                {...params}
                                                label={tipoPedido === 'CURSO' ? 'Seleccionar Estudiantes' : 'Seleccionar Estudiante'}
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
                                        multiple={tipoPedido === 'CURSO'}
                                        options={cursos}
                                        getOptionLabel={(option) => option.titulo}
                                        loading={isLoadingCursos}
                                        value={tipoPedido === 'CURSO' ? cursos.filter((c) => value.includes(c.id)) : (cursos.find(c => value.includes(c.id)) || null)}
                                        onChange={(_, newValue) => {
                                            if (tipoPedido === 'CURSO') {
                                                const vals = newValue as any[]

                                                onChange(vals.map(c => c.id))
                                                const totalPrice = vals.reduce((acc, curr) => acc + Number(curr.precio), 0)

                                                setValue('precio', totalPrice)
                                                setSelectedCoursePrice(totalPrice)
                                            } else {
                                                const val = newValue as any

                                                onChange(val ? [val.id] : [])

                                                // For certificate, use the course certificate price
                                                const certPrice = val ? Number(val.precio_certificado || 50) : 0

                                                setValue('precio', certPrice)
                                                setSelectedCoursePrice(certPrice)
                                            }
                                        }}
                                        renderInput={(params) => (
                                            <CustomTextField
                                                {...params}
                                                label={tipoPedido === 'CURSO' ? 'Seleccionar Cursos' : 'Seleccionar Curso'}
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

                        {tipoPedido === 'CERTIFICADO' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name='tipo_certificado'
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                select
                                                fullWidth
                                                label='Tipo de Certificado'
                                                value={field.value || ''}
                                                error={!!errors.tipo_certificado}
                                                helperText={errors.tipo_certificado?.message}
                                            >
                                                <MenuItem value='IPG'>IPG Ingenieros</MenuItem>
                                                <MenuItem value='CIP'>Colegio de Ingenieros (CIP)</MenuItem>
                                            </CustomTextField>
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name='fecha_entrega_estimada'
                                        control={control}
                                        render={({ field }) => (
                                            <CustomTextField
                                                {...field}
                                                type='datetime-local'
                                                fullWidth
                                                label='Fecha y Hora Estimada (Opcional)'
                                                value={field.value ? String(field.value).slice(0, 16) : ''}
                                                InputLabelProps={{ shrink: true }}
                                                error={!!errors.fecha_entrega_estimada}
                                                helperText={errors.fecha_entrega_estimada?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                            </>
                        )}

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
                                        helperText={errors.estado?.message ?? (field.value !== 'COMPLETADO' ? 'El proceso se completará una vez pagado' : 'Procesado inmediatamente')}
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
                                        label='Método de Pago / Banco'
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
                                        label='Número de Operación / Comprobante'
                                        placeholder='Ej: 20601234567'
                                        value={field.value || ''}
                                        error={!!errors.numero_comprobante}
                                        helperText={errors.numero_comprobante?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {tipoPedido === 'CERTIFICADO' && (
                            <Grid item xs={12}>
                                <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        Comprobante de Pago (Voucher)
                                    </Typography>
                                    <Button variant="outlined" component="label" disabled={vouchers.length >= 5}>
                                        Subir Comprobante(s)
                                        <input
                                            type="file"
                                            multiple
                                            hidden
                                            accept="image/*,.pdf"
                                            onChange={handleVouchers}
                                        />
                                    </Button>
                                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                        Puedes subir hasta 5 imágenes o PDFs (máx 5MB c/u)
                                    </Typography>

                                    {voucherPreviews.length > 0 && (
                                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {voucherPreviews.map((preview, idx) => (
                                                <Box key={idx} sx={{ position: 'relative', width: 100, height: 100, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                                    {vouchers[idx]?.type.includes('pdf') ? (
                                                        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                                                            <Typography variant="caption" sx={{ mt: 1, fontSize: '0.65rem', textAlign: 'center', wordBreak: 'break-all', px: 0.5 }}>PDF</Typography>
                                                        </Box>
                                                    ) : (
                                                        <img src={preview} alt="Voucher Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeVoucher(idx)}
                                                        sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, width: 24, height: 24 }}
                                                    >
                                                        <i className="tabler-x" style={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        )}

                        <Grid item xs={12} className='flex gap-4'>
                            <Button
                                type='submit'
                                variant='contained'
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                            >
                                Generar Pedido
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
