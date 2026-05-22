'use client'

import { useMemo, useState } from 'react'

import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
    Card,
    CardHeader,
    Box,
    Typography,
    Avatar,
    Switch,
    FormControlLabel,
    CircularProgress,
    Chip
} from '@mui/material'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'
import { DebouncedInput } from '@/utils/components/others/DebouncedInput'
import HydratedDate from '@/utils/components/HydratedDate'

interface InscripcionCertPago {
    id: string
    certificado_habilitado: boolean
    inscrito_en: string
    usuario: { id: string; nombre: string; apellido: string; correo: string; avatar: string | null }
    curso: { id: string; titulo: string; precio_certificado: number | null; moneda: string }
}

const columnHelper = createColumnHelper<InscripcionCertPago>()

export function CertificadosPagoTable() {
    const [nombre, setNombre] = useState('')
    const [soloPendientes, setSoloPendientes] = useState(false)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['certificados-pago', nombre, soloPendientes],
        queryFn: async () => {
            const params = new URLSearchParams()

            if (nombre) params.set('nombre', nombre)
            if (soloPendientes) params.set('pendientes', 'true')

            const res = await axios.get(`/api/admin/inscripciones/certificados-pago?${params}`)

            return res.data.result.inscripciones as InscripcionCertPago[]
        }
    })

    const toggleMutation = useMutation({
        mutationFn: async ({ id, habilitado }: { id: string; habilitado: boolean }) => {
            await axios.patch(`/api/admin/inscripciones/${id}/certificado`, { habilitado })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['certificados-pago'] })
            toast.success('Estado de certificado actualizado')
        },
        onError: () => toast.error('Error al actualizar el estado')
    })

    const inscripciones = data ?? []

    const columns = useMemo(
        () => [
            columnHelper.accessor('usuario', {
                header: 'Estudiante',
                cell: ({ row }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            src={row.original.usuario.avatar || undefined}
                            imgProps={{ referrerPolicy: 'no-referrer' }}
                        />
                        <Box>
                            <Typography variant='body2' fontWeight={600}>
                                {row.original.usuario.nombre} {row.original.usuario.apellido}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                                {row.original.usuario.correo}
                            </Typography>
                        </Box>
                    </Box>
                )
            }),
            columnHelper.accessor('curso', {
                header: 'Curso',
                cell: ({ row }) => (
                    <Box>
                        <Typography variant='body2'>{row.original.curso.titulo}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                            Cert: {row.original.curso.moneda}{' '}
                            {Number(row.original.curso.precio_certificado).toFixed(2)}
                        </Typography>
                    </Box>
                )
            }),
            columnHelper.accessor('inscrito_en', {
                header: 'Inscrito',
                cell: ({ row }) => (
                    <Typography variant='body2'>
                        <HydratedDate date={row.original.inscrito_en} format='date' />
                    </Typography>
                )
            }),
            columnHelper.accessor('certificado_habilitado', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Chip
                        size='small'
                        label={row.original.certificado_habilitado ? 'Habilitado' : 'Pendiente pago'}
                        color={row.original.certificado_habilitado ? 'success' : 'warning'}
                        variant='tonal'
                    />
                )
            }),
            columnHelper.display({
                id: 'accion',
                header: () => <Box sx={{ textAlign: 'center' }}>Habilitar descarga</Box>,
                cell: ({ row }) => (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Switch
                            checked={row.original.certificado_habilitado}
                            onChange={e =>
                                toggleMutation.mutate({ id: row.original.id, habilitado: e.target.checked })
                            }
                            disabled={toggleMutation.isPending}
                            color='success'
                        />
                    </Box>
                )
            })
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const table = useReactTable({
        data: inscripciones,
        columns,
        getCoreRowModel: getCoreRowModel()
    })

    return (
        <Card sx={{ mt: 4 }}>
            <CardHeader
                title='Certificados de Pago'
                subheader='Habilita la descarga del certificado una vez confirmado el pago del estudiante'
            />
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <DebouncedInput
                    value={nombre}
                    onChange={v => setNombre(String(v))}
                    placeholder='Buscar por nombre o correo'
                    className='is-full sm:is-auto'
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={soloPendientes}
                            onChange={e => setSoloPendientes(e.target.checked)}
                        />
                    }
                    label='Solo pendientes'
                />
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
                <table className={tableStyles.table}>
                    <thead>
                        {table.getHeaderGroups().map(hg => (
                            <tr key={hg.id}>
                                {hg.headers.map(h => (
                                    <th key={h.id}>
                                        {flexRender(h.column.columnDef.header, h.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className='text-center p-8'>
                                    <CircularProgress size={22} />
                                </td>
                            </tr>
                        ) : inscripciones.length === 0 ? (
                            <tr>
                                <td colSpan={5} className='text-center p-8'>
                                    No hay inscripciones con certificado de pago
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Box>
        </Card>
    )
}
