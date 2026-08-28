'use client'

import { useMemo, useState, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import { getSession } from 'next-auth/react'

import {
  Card,
  CardHeader,
  Chip,
  Typography,
  Box,
  TablePagination,
  Button,
  MenuItem,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
  Autocomplete
} from '@mui/material'
import { toast } from 'react-toastify'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel
} from '@tanstack/react-table'
import * as XLSX from 'xlsx'

import classnames from 'classnames'

import type { ColumnDef } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import CustomTextField from '@core/components/mui/TextField'


import type { ThemeColor } from '@/@core/types'
import type { Pedido } from '../entity/Pedido'
import { usePedidos, useDeletePedido } from '../hooks/usePedidos'
import { useCursosLista } from '../../cursos/hooks/useCursos'
import { AxiosPedido } from '../http/axiosPedido'
import TablePaginationComponent from '@/utils/components/others/TablePaginationComponent'
import { DebouncedInput } from '@/utils/components/others/DebouncedInput'
import CustomAlertDialog from '@/components/CustomAlertDialog'
import GestionarEnvioFisicoModal from '../components/GestionarEnvioFisicoModal'

type StatusType = {
  [key: string]: ThemeColor
}

const statusObj: StatusType = {
  PENDIENTE: 'warning',
  PROCESANDO: 'info',
  COMPLETADO: 'success',
  CANCELADO: 'secondary',
  REEMBOLSADO: 'error'
}

const columnHelper = createColumnHelper<Pedido>()

interface PedidosPageProps {
  initialData?: Pedido[]
  initialTotal?: number
}

export function PedidosPage({ initialData, initialTotal = 0 }: PedidosPageProps) {
  const router = useRouter()
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS')
  const [nroPedido, setNroPedido] = useState('')
  const [nombre, setNombre] = useState('')
  const [cursoFiltro, setCursoFiltro] = useState<{ id: string, label: string } | null>(null)

  const { data: cursosLista } = useCursosLista()
  
  const cursosOpciones = useMemo(() => {
    if (!cursosLista) return []
    
return cursosLista.map(c => ({
      id: c.id,
      label: `${c.titulo} (${c.es_asincrono ? 'Asíncrono' : 'Síncrono'} - ${new Date(c.creado_en).toLocaleDateString('es-PE')})`
    }))
  }, [cursosLista])

  const { mutateAsync: deletePedido, isPending: isDeleting } = useDeletePedido()
  const [deleteInfo, setDeleteInfo] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [envioInfo, setEnvioInfo] = useState<{ open: boolean; pedido: Pedido | null }>({ open: false, pedido: null })
  const [isExporting, setIsExporting] = useState(false)

  const handleExportarExcel = async () => {
    setIsExporting(true)

    try {
      const session = await getSession()
      const token = session?.user?.accessToken ?? null
      const axiosPedido = new AxiosPedido({ getAuthToken: () => token })
      const res = await axiosPedido.getAll({ estado: estadoFiltro, nro_pedido: nroPedido, nombre, limit: '5000' })
      const todos: Pedido[] = res?.pedidos ?? []

      const filas = todos.map((p: any) => {
        const metodoPagoBase = p.metodo_pago?.toLowerCase().replace('_', ' ') ?? ''
        const manualName = p.metodo_pago_manual ? `${p.metodo_pago_manual.nombre} ${p.metodo_pago_manual.nombre_banco || ''}`.trim() : null
        
        return {
          '# Pedido': `#${String(p.numero_pedido).padStart(6, '0')}`,
          Estudiante: `${p.usuario?.nombre ?? ''} ${p.usuario?.apellido ?? ''}`.trim(),
          'DNI / Documento': p.usuario?.numero_documento ?? '',
          Celular: p.usuario?.celular ?? '',
          Correo: p.usuario?.correo ?? '',
          'Curso(s)': p.detalles?.map((d: any) => d.curso?.titulo).join(' | ') ?? '',
          Total: `${p.moneda} ${Number(p.total).toFixed(2)}`,
          Cupón: p.cupon?.codigo ?? '',
          'Método de pago / Banco': manualName || metodoPagoBase,
          'Cód. Operación': p.numero_comprobante || p.referencia_pago || '',
          'Imagen de Comprobante': p.comprobante_url ? `${window.location.origin}${p.comprobante_url}` : '',
          Estado: p.estado,
          Fecha: p.creado_en ? new Date(p.creado_en).toLocaleDateString('es-PE') : ''
        }
      })

      const ws = XLSX.utils.json_to_sheet(filas)
      const wb = XLSX.utils.book_new()

      XLSX.utils.book_append_sheet(wb, ws, 'Pedidos')
      XLSX.writeFile(wb, `pedidos_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch {
      toast.error('Error al exportar los pedidos')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = useCallback(async () => {
    if (!deleteInfo.id) return

    try {
      await deletePedido(deleteInfo.id)
      toast.success('Pedido eliminado correctamente')
      setDeleteInfo({ open: false, id: null })
      router.refresh() // Refresca los datos del servidor (initialData)
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar pedido')
    }
  }, [deletePedido, deleteInfo.id, router])

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const { data: pedidosData, isFetching, isPlaceholderData } = usePedidos(
    {
      estado: estadoFiltro,
      nro_pedido: nroPedido,
      nombre: nombre,
      cursoId: cursoFiltro?.id,
      page: String(pagination.pageIndex + 1),
      limit: String(pagination.pageSize)
    },
    initialData,
    initialTotal
  )

  const pedidos = useMemo(() => {
    if (pedidosData?.pedidos) return pedidosData.pedidos

    if (pagination.pageIndex === 0 && initialData) return initialData

    return []
  }, [pedidosData, initialData, pagination.pageIndex])

  const total = useMemo(() => {
    if (pedidosData?.paginacion?.total !== undefined) return pedidosData.paginacion.total

    if (pagination.pageIndex === 0) return initialTotal

    return 0
  }, [pedidosData, initialTotal, pagination.pageIndex])

  const columns = useMemo<ColumnDef<Pedido, any>[]>(
    () => [
      columnHelper.accessor('numero_pedido', {
        header: '# Pedido',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            #{String(row.original.numero_pedido).padStart(6, '0')}
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            <Tooltip title='Ver Detalle'>
              <IconButton onClick={() => router.push(`/admin/pedidos/detalle/${row.original.id}`)} size='small'>
                <i className='tabler-eye text-[20px] text-primary' />
              </IconButton>
            </Tooltip>
            {row.original.datos_envio && (
              <Tooltip title='Gestionar certificado físico'>
                <IconButton onClick={() => setEnvioInfo({ open: true, pedido: row.original })} size='small'>
                  <i className='tabler-truck-delivery text-[20px] text-info' />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title='Editar'>
              <IconButton onClick={() => router.push(`/admin/pedidos/editar/${row.original.id}`)} size='small'>
                <i className='tabler-edit text-[20px] text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar'>
              <IconButton onClick={() => setDeleteInfo({ open: true, id: row.original.id })} size='small'>
                <i className='tabler-trash text-[20px] text-error' />
              </IconButton>
            </Tooltip>
          </div>
        )
      }),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: ({ row }) => (
          <Stack direction='column' spacing={0.5} alignItems='flex-start'>
            <Chip
              variant='tonal'
              label={row.original.estado}
              color={statusObj[row.original.estado] || 'default'}
              size='small'
              className='font-medium'
            />
            {(row.original as any).comprobante_url && row.original.estado === 'PENDIENTE' && (
              <Chip
                icon={<i className='tabler-photo' style={{ fontSize: 12 }} />}
                label='Voucher adjunto'
                size='small'
                color='info'
                variant='outlined'
                sx={{ fontSize: 10, height: 20 }}
              />
            )}
            {(row.original.numero_comprobante || (row.original as any).referencia_pago) && (
              <Typography variant='caption' color='text.secondary' sx={{ maxWidth: 140, display: 'block' }} noWrap>
                {(row.original as any).referencia_pago
                  ? `${(row.original as any).referencia_pago}`
                  : ''}
                {(row.original as any).referencia_pago && row.original.numero_comprobante ? ' · ' : ''}
                {row.original.numero_comprobante || ''}
              </Typography>
            )}
          </Stack>
        )
      }),
      columnHelper.accessor('creado_en', {
        header: 'Fecha Creación',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary' className='whitespace-nowrap'>
            {new Date(row.original.creado_en).toLocaleString('es-PE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        )
      }),
      columnHelper.accessor('total', {
        header: 'Total',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium whitespace-nowrap'>
            {row.original.moneda} {Number(row.original.total).toFixed(2)}
          </Typography>
        )
      }),
      columnHelper.accessor('detalles', {
        header: 'Curso',
        cell: ({ row }) => (
          <div className='flex flex-col max-w-[180px]'>
            {row.original.detalles?.map((detalle, index) => {
              const certTipo = (detalle as any).certificado_tipo
              const titulo = detalle.curso?.titulo || ''

              const label = certTipo
                ? `${titulo} (Certificado ${String(certTipo).toUpperCase() === 'CIP' ? 'Colegio de Ingenieros' : 'IPG'})`
                : titulo

              return (
                <Typography key={index} variant='body2' color='text.primary' className='whitespace-normal break-words line-clamp-3'>
                  {label}
                </Typography>
              )
            })}
          </div>
        )
      }),
      columnHelper.accessor('usuario', {
        header: 'Alumno',
        cell: ({ row }) => (
          <div className='flex flex-col max-w-[150px]'>
            <Typography color='text.primary' className='font-medium whitespace-normal break-words line-clamp-2'>
              {row.original.usuario?.nombre} {row.original.usuario?.apellido}
            </Typography>
            <Typography variant='caption' color='text.secondary' className='truncate'>
              {row.original.usuario?.correo}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('cupon', {
        header: 'Descuento / Cupón',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary'>
            {row.original.cupon?.codigo ? (
              <Chip
                label={row.original.cupon.codigo}
                size='small'
                variant='outlined'
                color='primary'
                sx={{ fontWeight: 600 }}
              />
            ) : (
              '-'
            )}
          </Typography>
        )
      }),
      columnHelper.accessor('metodo_pago', {
        header: 'Método de pago',
        cell: ({ row }) => (
          <Typography variant='body2' className='capitalize whitespace-nowrap'>
            {row.original.metodo_pago?.toLowerCase().replace('_', ' ') || '-'}
          </Typography>
        )
      })
    ],
    [router]
  )

  const table = useReactTable({
    data: pedidos,
    columns,
    state: {
      pagination
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    rowCount: total
  })



  return (
    <Card>
      <CardHeader title='Gestión de Pedidos' className='pbe-4' />
      <div className='flex justify-between flex-col items-start xl:flex-row xl:items-start p-6 border-bs gap-4'>
        <div className='flex items-start gap-4 pt-1'>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
        </div>
        <div className='flex flex-wrap items-center justify-start xl:justify-center gap-4 flex-1 w-full xl:w-auto'>
          <CustomTextField
            select
            value={estadoFiltro}
            onChange={e => {
              setEstadoFiltro(e.target.value)
              table.setPageIndex(0)
            }}
            className='is-full sm:is-[180px]'
          >
            <MenuItem value='TODOS'>Todos los estados</MenuItem>
            <MenuItem value='COMPLETADO'>Pagados (Completados)</MenuItem>
            <MenuItem value='PENDIENTE'>Pendientes</MenuItem>
            <MenuItem value='CANCELADO'>Cancelados</MenuItem>
          </CustomTextField>

          <DebouncedInput
            value={nroPedido}
            onChange={val => {
              setNroPedido(String(val))
              table.setPageIndex(0)
            }}
            placeholder='Buscar # Pedido'
            className='is-full sm:is-[160px]'
          />

          <DebouncedInput
            value={nombre}
            onChange={val => {
              setNombre(String(val))
              table.setPageIndex(0)
            }}
            placeholder='Buscar Estudiante...'
            className='is-full sm:is-[200px]'
          />

          <Autocomplete
            options={cursosOpciones}
            getOptionLabel={option => option.label}
            value={cursoFiltro}
            onChange={(_, newValue) => {
              setCursoFiltro(newValue)
              table.setPageIndex(0)
            }}
            renderInput={params => <CustomTextField {...params} placeholder='Filtrar por Curso...' />}
            className='is-full sm:is-[250px]'
            isOptionEqualToValue={(option, value) => option.id === value?.id}
          />
        </div>

        <div className='flex flex-col gap-2 w-full sm:w-auto shrink-0'>
          <Button
            variant='contained'
            color='success'
            startIcon={isExporting ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-file-spreadsheet' />}
            onClick={handleExportarExcel}
            disabled={isExporting}
            className='is-full sm:w-full'
          >
            {isExporting ? 'Exportando...' : 'Exportar Excel'}
          </Button>
          <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => router.push('/admin/pedidos/nuevo')}
            className='is-full sm:w-full'
          >
            Nuevo Pedido
          </Button>
        </div>
      </div>
      
      <div className='overflow-x-auto relative'>
        {(isFetching && !isPlaceholderData) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(2px)',
              transition: 'opacity 0.2s'
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <table className={tableStyles.table} style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={classnames({
                          'flex items-center': header.column.getIsSorted(),
                          'cursor-pointer select-none': header.column.getCanSort()
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <i className='tabler-chevron-up text-xl ml-1' />,
                          desc: <i className='tabler-chevron-down text-xl ml-1' />
                        }[header.column.getIsSorted() as 'asc' | 'desc']}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getCoreRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className='text-center p-6'>
                  No se encontraron pedidos
                </td>
              </tr>
            ) : (
              table.getCoreRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        component={() => <TablePaginationComponent table={table as any} />}
        count={total}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
      />

      <CustomAlertDialog
        open={deleteInfo.open}
        title="Eliminar Pedido"
        description="¿Estás seguro de que deseas eliminar este pedido permanentemente? Si es un pedido de certificado, se deshabilitará ese certificado y el estudiante podrá tramitarlo de nuevo."
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setDeleteInfo({ open: false, id: null })}
        loading={isDeleting}
        color="error"
      />

      <GestionarEnvioFisicoModal
        open={envioInfo.open}
        handleClose={() => setEnvioInfo({ open: false, pedido: null })}
        pedido={envioInfo.pedido}
      />
    </Card>
  )
}
