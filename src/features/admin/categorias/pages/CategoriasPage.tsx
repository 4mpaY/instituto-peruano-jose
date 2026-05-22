'use client'

import { useMemo, useState } from 'react'

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
  CircularProgress
} from '@mui/material'


import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'

import classnames from 'classnames'

import type { ColumnDef } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import CustomTextField from '@/@core/components/mui/TextField'


import type { ThemeColor } from '@/@core/types'

import type { Categoria } from '../entity/Categoria'
import { useCategorias } from '../hooks/useCategorias'
import { CategoriasActions } from '../components/CategoriasActions'
import { DebouncedInput } from '@/utils/components/others/DebouncedInput'
import { fuzzyFilter } from '@/utils/components/others/FuzzyFilter'
import TablePaginationComponent from '@/utils/components/others/TablePaginationComponent'

type StatusType = {
  [key: string]: ThemeColor
}

const statusObj: StatusType = {
  activo: 'success',
  inactivo: 'secondary'
}

const columnHelper = createColumnHelper<Categoria>()

interface CategoriasPageProps {
  initialDataCategorias?: Categoria[]
  initialTotal?: number
}

export function CategoriasPage({ initialDataCategorias, initialTotal = 0 }: CategoriasPageProps) {
  const [categoriaToDelete, setCategoriaToDelete] = useState<Categoria | null>(null)
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false)
  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false)
  const [openUpdateModal, setOpenUpdateModal] = useState<boolean>(false)
  const [categoriaToEdit, setCategoriaToEdit] = useState<Categoria | null>(null)

  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const { data: categoriasData, isFetching, isPlaceholderData, refetch: refetchCategorias } = useCategorias({
    page: (pagination.pageIndex + 1).toString(),
    limit: pagination.pageSize.toString(),
    buscar: globalFilter,
    esta_activo: statusFilter === 'all' ? undefined : statusFilter === 'activo'
  }, initialDataCategorias, initialTotal)

  const categorias = useMemo(() => {
    if (categoriasData?.categorias) return categoriasData.categorias

    if (pagination.pageIndex === 0 && initialDataCategorias) return initialDataCategorias

    return []
  }, [categoriasData, initialDataCategorias, pagination.pageIndex])

  const totalCategorias = useMemo(() => {
    if (categoriasData?.paginacion?.total !== undefined) return categoriasData.paginacion.total

    if (pagination.pageIndex === 0) return initialTotal

    return 0
  }, [categoriasData, initialTotal, pagination.pageIndex])

  const handleDeleteClick = (categoria: Categoria) => {
    setCategoriaToDelete(categoria)
    setOpenDeleteModal(true)
  }

  const handleEditClick = (categoria: Categoria) => {
    setCategoriaToEdit(categoria)
    setOpenUpdateModal(true)
  }

  const columns = useMemo<ColumnDef<Categoria, any>[]>(
    () => [
      columnHelper.display({
        id: 'numero',
        header: '#',
        cell: ({ row }) => (
          <Typography color='text.secondary' variant='body2'>
            {pagination.pageIndex * pagination.pageSize + row.index + 1}
          </Typography>
        )
      }),
      columnHelper.accessor('nombre', {
        header: 'Categoría',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.nombre}
            </Typography>
            <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace' }}>
              {row.original.slug}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('descripcion', {
        header: 'Descripción',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 250 }} noWrap>
            {row.original.descripcion || '—'}
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'subcategorias',
        header: 'Subcategorías',
        cell: ({ row }) => {
          const count = row.original._count.hijos

          return count > 0 ? (
            <Chip
              variant='tonal'
              label={`${count} subcategoría${count > 1 ? 's' : ''}`}
              color='info'
              size='small'
            />
          ) : (
            <Typography variant='caption' color='text.disabled'>Sin subcategorías</Typography>
          )
        }
      }),
      columnHelper.display({
        id: 'cursos',
        header: 'Cursos',
        cell: ({ row }) => {
          const count = row.original._count.cursos

          return count > 0 ? (
            <Chip
              variant='tonal'
              label={`${count} curso${count > 1 ? 's' : ''}`}
              color='primary'
              size='small'
            />
          ) : (
            <Typography variant='caption' color='text.disabled'>—</Typography>
          )
        }
      }),
      columnHelper.accessor('esta_activo', {
        header: 'Estado',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            className='capitalize'
            label={row.original.esta_activo ? 'Activo' : 'Inactivo'}
            color={statusObj[row.original.esta_activo ? 'activo' : 'inactivo']}
            size='small'
          />
        )
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <div className='w-full text-right'>Acciones</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-end w-full gap-1'>
            <IconButton onClick={() => handleEditClick(row.original)} title='Editar y gestionar subcategorías'>
              <i className='tabler-edit text-[22px] text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleDeleteClick(row.original)} title='Eliminar'>
              <i className='tabler-trash text-[22px] text-textSecondary' />
            </IconButton>
          </div>
        )
      })
    ],
    [pagination.pageIndex, pagination.pageSize]
  )

  const table = useReactTable({
    data: categorias,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter,
      pagination
    },
    onPaginationChange: setPagination,
    manualPagination: true,
    rowCount: totalCategorias,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel()
  })

  // Eliminar el bloque de isLoading ya que ahora usamos placeholderData/isPlaceholderData
  // para una experiencia más fluida. El overlay se maneja en el JSX.

  return (
    <>
      <Card>
        <CardHeader title='Gestión de Categorías' className='pbe-4' />
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
            <CustomTextField
              select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='is-full sm:is-[200px]'
            >
              <MenuItem value='all'>Todos los estados</MenuItem>
              <MenuItem value='activo'>Activo</MenuItem>
              <MenuItem value='inactivo'>Inactivo</MenuItem>
            </CustomTextField>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Buscar categoría'
              className='is-full sm:is-auto'
            />
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setOpenCreateModal(true)}
              className='is-full sm:is-auto'
            >
              Añadir Categoría
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
                        <>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {
                              {
                                asc: <i className='tabler-chevron-up text-xl' />,
                                desc: <i className='tabler-chevron-down text-xl' />
                              }[header.column.getIsSorted() as 'asc' | 'desc']
                            }
                          </div>
                        </>
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
                    No hay datos disponibles
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getCoreRowModel()
                  .rows
                  .map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component={() => <TablePaginationComponent table={table as any} />}
          count={totalCategorias}
          rowsPerPage={pagination.pageSize}
          page={pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <CategoriasActions
        categoriaClicked={categoriaToEdit || categoriaToDelete}
        addCategoria={{
          isOpen: openCreateModal,
          closeHandler: () => setOpenCreateModal(false)
        }}
        editCategoria={{
          isOpen: openUpdateModal,
          closeHandler: () => {
            setOpenUpdateModal(false)
            setCategoriaToEdit(null)
          }
        }}
        deleteCategoria={{
          isOpen: openDeleteModal,
          closeHandler: () => {
            setOpenDeleteModal(false)
            setCategoriaToDelete(null)
          }
        }}
        onSuccess={() => refetchCategorias()}
      />
    </>
  )
}
