'use client'

import { useMemo, useState } from 'react'

// MUI Imports
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
  CircularProgress
} from '@mui/material'

// Table & Utils Imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import classnames from 'classnames'
import { Icon } from '@iconify/react/dist/iconify.js'
import { Rol } from '@prisma/client'

// Core & Custom Components
import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@/@core/components/mui/TextField'
import type { ThemeColor } from '@/@core/types'
import { DebouncedInput } from '@/utils/components/others/DebouncedInput'
import { fuzzyFilter } from '@/utils/components/others/FuzzyFilter'
import TablePaginationComponent from '@/utils/components/others/TablePaginationComponent'

// Feature Imports
import type { Usuario } from '../entity/Usuario'
import { useUsuarios } from '../hooks/useUsuarios'
import { UsuariosActions } from '../components/UsuariosActions'
import ImportarUsuariosModal from '../components/ImportarUsuariosModal'

type UsuarioStatusType = {
  [key: string]: ThemeColor
}

const usuarioStatusObj: UsuarioStatusType = {
  activo: 'success',
  inactivo: 'secondary'
}

const rolStatusObj: UsuarioStatusType = {
  ADMIN: 'error',
  PROFESOR: 'warning',
  ESTUDIANTE: 'info'
}

const rolLabels: { [key in Rol]: string } = {
  ADMIN: 'Administrador',
  PROFESOR: 'Profesor',
  ESTUDIANTE: 'Estudiante'
}

const columnHelper = createColumnHelper<Usuario>()

interface UsuariosPageProps {
  initialDataUsuarios?: Usuario[]
  initialTotal?: number
}

export function UsuariosPage({ initialDataUsuarios, initialTotal = 0 }: UsuariosPageProps) {
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false)
  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false)
  const [openUpdateModal, setOpenUpdateModal] = useState<boolean>(false)
  const [openViewModal, setOpenViewModal] = useState<boolean>(false)
  const [openImportModal, setOpenImportModal] = useState<boolean>(false)
  const [usuarioToEdit, setUsuarioToEdit] = useState<Usuario | null>(null)

  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [rolFilter, setRolFilter] = useState<string>('all')

  // Estado para paginación manual
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const { data: usuariosData, isFetching, isPlaceholderData, refetch: refetchUsuarios } = useUsuarios({
    page: (pagination.pageIndex + 1).toString(),
    limit: pagination.pageSize.toString(),
    buscar: globalFilter,
    rol: rolFilter === 'all' ? '' : rolFilter
  }, initialDataUsuarios, initialTotal)

  const usuarios = useMemo(() => {
    if (usuariosData?.usuarios) return usuariosData.usuarios

    if (pagination.pageIndex === 0 && initialDataUsuarios) return initialDataUsuarios

    return []
  }, [usuariosData, initialDataUsuarios, pagination.pageIndex])

  const totalUsuarios = useMemo(() => {
    if (usuariosData?.paginacion?.total !== undefined) return usuariosData.paginacion.total

    if (pagination.pageIndex === 0) return initialTotal

    return 0
  }, [usuariosData, initialTotal, pagination.pageIndex])

  const handleDeleteClick = (usuario: Usuario) => {
    setUsuarioToEdit(usuario)
    setOpenDeleteModal(true)
  }

  const handleEditClick = (usuario: Usuario) => {
    setUsuarioToEdit(usuario)
    setOpenUpdateModal(true)
  }

  const handleViewClick = (usuario: Usuario) => {
    setUsuarioToEdit(usuario)
    setOpenViewModal(true)
  }

  const columns = useMemo<ColumnDef<Usuario, any>[]>(
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
        header: 'Usuario',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Avatar
              src={row.original.avatar || undefined}
              alt={`${row.original.nombre} ${row.original.apellido}`}
              sx={{
                width: 40,
                height: 40,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              imgProps={{ referrerPolicy: 'no-referrer' }}
              onClick={() => handleViewClick(row.original)}
            >
              {row.original.nombre.charAt(0).toUpperCase()}
            </Avatar>
            <div
              className='flex flex-col cursor-pointer hover:opacity-75 transition-opacity'
              onClick={() => handleViewClick(row.original)}
            >
              <Typography color='text.primary' className='font-medium'>
                {row.original.nombre} {row.original.apellido}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {row.original.correo}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('numero_documento', {
        header: 'DNI',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.numero_documento}</Typography>
      }),
      columnHelper.accessor('celular', {
        header: 'Celular',
        cell: ({ row }) => (
          <Typography color='text.primary'>{row.original.celular || '-'}</Typography>
        )
      }),
      columnHelper.accessor('rol', {
        header: 'Rol',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            className='capitalize'
            label={rolLabels[row.original.rol]}
            color={rolStatusObj[row.original.rol]}
            size='small'
          />
        )
      }),
      columnHelper.accessor('esta_activo', {
        header: 'Estado',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            className='capitalize'
            label={row.original.esta_activo ? 'Activo' : 'Inactivo'}
            color={usuarioStatusObj[row.original.esta_activo ? 'activo' : 'inactivo']}
            size='small'
          />
        )
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <div className='w-full text-right'>Acciones</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-end w-full gap-1'>
            <IconButton onClick={() => handleViewClick(row.original)} title='Ver Detalles'>
              <i className='tabler-eye text-[22px] text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleEditClick(row.original)} title='Editar'>
              <i className='tabler-edit text-[22px] text-textSecondary' />
            </IconButton>
            <IconButton onClick={() => handleDeleteClick(row.original)} title='Eliminar'>
              <Icon icon='material-symbols:delete' />
            </IconButton>
          </div>
        )
      })
    ],
    [pagination]
  )

  const table = useReactTable({
    data: usuarios,
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
    manualSorting: true,
    manualFiltering: true,
    rowCount: totalUsuarios,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel()
  })



  return (
    <>
      <Card>
        <CardHeader title='Gestión de Usuarios' className='pbe-4' />
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
              value={rolFilter}
              onChange={e => {
                setRolFilter(e.target.value)
                table.setPageIndex(0)
              }}
              className='is-full sm:is-[200px]'
            >
              <MenuItem value='all'>Todos los roles</MenuItem>
              <MenuItem value={Rol.ADMIN}>Administrador</MenuItem>
              <MenuItem value={Rol.PROFESOR}>Profesor</MenuItem>
              <MenuItem value={Rol.ESTUDIANTE}>Estudiante</MenuItem>
            </CustomTextField>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => {
                setGlobalFilter(String(value))
                table.setPageIndex(0)
              }}
              placeholder='Buscar usuario'
              className='is-full sm:is-auto'
            />
            <Button
              variant='contained'
              color='success'
              startIcon={<i className='tabler-file-import' />}
              onClick={() => setOpenImportModal(true)}
              className='is-full sm:is-auto'
            >
              Importar Excel
            </Button>
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setOpenCreateModal(true)}
              className='is-full sm:is-auto'
            >
              Añadir Usuario
            </Button>
          </div>
        </div>

        <div className='overflow-x-auto relative'>
          {(isFetching && !isPlaceholderData) && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.6)',
                zIndex: 10
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <table className={tableStyles.table}>
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
            {usuarios.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-10'>
                    {isFetching ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      'No hay datos disponibles'
                    )}
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
          count={totalUsuarios}
          rowsPerPage={pagination.pageSize}
          page={pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <UsuariosActions
        usuarioClicked={usuarioToEdit}
        addUsuario={{
          isOpen: openCreateModal,
          closeHandler: () => setOpenCreateModal(false)
        }}
        editUsuario={{
          isOpen: openUpdateModal,
          closeHandler: () => {
            setOpenUpdateModal(false)
            setUsuarioToEdit(null)
          }
        }}
        deleteUsuario={{
          isOpen: openDeleteModal,
          closeHandler: () => {
            setOpenDeleteModal(false)
            setUsuarioToEdit(null)
          }
        }}
        viewUsuario={{
          isOpen: openViewModal,
          closeHandler: () => {
            setOpenViewModal(false)
            setUsuarioToEdit(null)
          }
        }}
        onSuccess={() => refetchUsuarios()}
      />

      <ImportarUsuariosModal
        open={openImportModal}
        handleClose={() => setOpenImportModal(false)}
      />
    </>
  )
}
