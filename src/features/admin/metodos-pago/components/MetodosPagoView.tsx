'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Button,
  Card,
  CardHeader,
  Chip,
  IconButton,
  MenuItem,
  TablePagination,
  Typography,
  Box,
  Avatar,
  Switch
} from '@mui/material'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import classnames from 'classnames'
import { useSnackbar } from 'notistack'

import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@/@core/components/mui/TextField'
import { DebouncedInput } from '@/utils/components/others/DebouncedInput'
import { fuzzyFilter } from '@/utils/components/others/FuzzyFilter'
import TablePaginationComponent from '@/utils/components/others/TablePaginationComponent'

import type { MetodoPagoManual } from '../entity/MetodoPagoManual'
import { useMetodosPago, useMetodosPagoMutation } from '../hooks/useMetodosPago'
import MetodoPagoForm from './MetodoPagoForm'

const columnHelper = createColumnHelper<MetodoPagoManual>()

export default function MetodosPagoView() {
  const router = useRouter()
  const { data: metodos = [], isLoading } = useMetodosPago()
  const { actualizar, eliminar } = useMetodosPagoMutation()
  const { enqueueSnackbar } = useSnackbar()

  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<MetodoPagoManual | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})

  const handleEdit = (m: MetodoPagoManual) => {
    setSelected(m)
    setFormOpen(true)
  }

  const handleNew = () => {
    setSelected(null)
    setFormOpen(true)
  }

  const handleToggle = async (m: MetodoPagoManual) => {
    try {
      await actualizar.mutateAsync({ id: m.id, data: { estado: !m.estado } })
      enqueueSnackbar(`Método ${!m.estado ? 'activado' : 'desactivado'}`, { variant: 'success' })
    } catch {
      enqueueSnackbar('Error al cambiar estado', { variant: 'error' })
    }
  }

  const handleDelete = async (m: MetodoPagoManual) => {
    if (!confirm(`¿Eliminar "${m.nombre}"?`)) return

    try {
      await eliminar.mutateAsync(m.id)
      enqueueSnackbar('Método eliminado', { variant: 'success' })
    } catch {
      enqueueSnackbar('Error al eliminar', { variant: 'error' })
    }
  }

  const columns: ColumnDef<MetodoPagoManual, any>[] = [
      columnHelper.display({
        id: 'numero',
        header: '#',
        cell: ({ row }) => (
          <Typography color='text.secondary' variant='body2'>{row.index + 1}</Typography>
        )
      }),
      columnHelper.accessor('imagen_url', {
        id: 'imagen',
        header: 'Imagen',
        cell: ({ row }) => (
          row.original.imagen_url ? (
            <Avatar
              src={row.original.imagen_url}
              variant='rounded'
              sx={{ width: 44, height: 44 }}
            />
          ) : (
            <Avatar
              variant='rounded'
              sx={{ width: 44, height: 44, bgcolor: 'action.selected', color: 'text.disabled' }}
            >
              <i className='tabler-photo-off' style={{ fontSize: 18 }} />
            </Avatar>
          )
        )
      }),
      columnHelper.accessor('nombre_banco', {
        header: 'Banco',
        cell: ({ row }) => (
          <div>
            <Typography variant='body2' fontWeight={600} color='text.primary'>
              {row.original.nombre_banco || row.original.nombre}
            </Typography>
            {row.original.descripcion && (
              <Typography variant='caption' color='text.secondary' noWrap sx={{ maxWidth: 200, display: 'block' }}>
                {row.original.descripcion}
              </Typography>
            )}
          </div>
        )
      }),
      columnHelper.accessor('numero_cuenta', {
        header: 'N° Cuenta',
        cell: ({ row }) => (
          <Typography variant='body2' fontFamily='monospace'>{row.original.numero_cuenta}</Typography>
        )
      }),
      columnHelper.accessor('cci', {
        header: 'CCI',
        cell: ({ row }) => (
          <Typography variant='body2' color={row.original.cci ? 'text.primary' : 'text.disabled'} fontFamily='monospace'>
            {row.original.cci || '—'}
          </Typography>
        )
      }),
      columnHelper.accessor('estado', {
        header: 'Activo',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Switch
              checked={row.original.estado}
              onChange={() => handleToggle(row.original)}
              size='small'
            />
            <Chip
              label={row.original.estado ? 'Activo' : 'Inactivo'}
              color={row.original.estado ? 'success' : 'default'}
              variant='tonal'
              size='small'
            />
          </div>
        )
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <div className='w-full text-right'>Acciones</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-end gap-1'>
            <IconButton size='small' onClick={() => handleEdit(row.original)} title='Editar'>
              <i className='tabler-edit text-[20px] text-textSecondary' />
            </IconButton>
            <IconButton size='small' color='error' onClick={() => handleDelete(row.original)} title='Eliminar'>
              <i className='tabler-trash text-[20px]' />
            </IconButton>
          </div>
        )
      })
    ]

  const table = useReactTable({
    data: metodos,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader title='Métodos de Pago' className='pbe-4' />
        <Box p={4}>Cargando...</Box>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Métodos de Pago Manual'
          className='pbe-4'
          action={
            <Button
              variant='tonal'
              color='secondary'
              size='small'
              startIcon={<i className='tabler-arrow-left' />}
              onClick={() => router.push('/admin/configuracion')}
            >
              Retroceder
            </Button>
          }
        />

        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
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

          <div className='flex flex-col sm:flex-row is-full sm:is-auto items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Buscar método...'
              className='is-full sm:is-auto'
            />
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={handleNew}
              className='is-full sm:is-auto'
            >
              Añadir Método
            </Button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
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
                            asc: <i className='tabler-chevron-up text-xl' />,
                            desc: <i className='tabler-chevron-down text-xl' />
                          }[header.column.getIsSorted() as 'asc' | 'desc']}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No hay métodos de pago configurados
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        <TablePagination
          component={() => <TablePaginationComponent table={table as any} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      <MetodoPagoForm
        open={formOpen}
        metodo={selected}
        onClose={() => { setFormOpen(false); setSelected(null) }}
      />
    </>
  )
}
