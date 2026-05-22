'use client'

import { useMemo, useState } from 'react'

import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
  IconButton,
  MenuItem,
  TablePagination,
  Tooltip,
  Typography
} from '@mui/material'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import type { ColumnDef } from '@tanstack/react-table'

import classnames from 'classnames'

import CourseThumbnail from '@/utils/components/CourseThumbnail'
import type { Curso } from '../entity/Curso'
import { CursosActions } from '../components/CursosActions'
import CustomTextField from '@/@core/components/mui/TextField'
import { DebouncedInput } from '@/utils/components/others/DebouncedInput'
import TablePaginationComponent from '@/utils/components/others/TablePaginationComponent'
import type { ThemeColor } from '@/@core/types'
import { fuzzyFilter } from '@/utils/components/others/FuzzyFilter'
import tableStyles from '@core/styles/table.module.css'
import { useCursos } from '../hooks/useCursos'

type EstadoColorMap = {
  [key: string]: ThemeColor
}

const estadoObj: EstadoColorMap = {
  BORRADOR: 'warning',
  PUBLICADO: 'success',
  ARCHIVADO: 'secondary'
}

const estadoLabel: Record<string, string> = {
  BORRADOR: 'Borrador',
  PUBLICADO: 'Publicado',
  ARCHIVADO: 'Archivado'
}

const columnHelper = createColumnHelper<Curso>()

interface CursosPageProps {
  initialDataCursos: Curso[]
}

export function CursosPage({ initialDataCursos }: CursosPageProps) {
  const [cursoToDelete, setCursoToDelete] = useState<Curso | null>(null)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [openStudentsModal, setOpenStudentsModal] = useState(false)

  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('all')

  // Estado para paginación manual
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const { data, isLoading, refetch } = useCursos({
    page: (pagination.pageIndex + 1).toString(),
    limit: pagination.pageSize.toString(),
    buscar: globalFilter,
    estado: estadoFilter === 'all' ? '' : estadoFilter
  })

  const cursos = useMemo(() => data?.cursos ?? (pagination.pageIndex === 0 ? initialDataCursos : []), [data, initialDataCursos, pagination.pageIndex])
  const totalCursos = useMemo(() => data?.paginacion?.total ?? initialDataCursos.length, [data, initialDataCursos.length])

  const handleDeleteClick = (curso: Curso) => {
    setCursoToDelete(curso)
    setOpenDeleteModal(true)
  }

  const handleViewStudentsClick = (curso: Curso) => {
    setCursoToDelete(curso) // Reutilizamos el estado para no crear otro
    setOpenStudentsModal(true)
  }

  const columns = useMemo<ColumnDef<Curso, any>[]>(
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
      columnHelper.accessor('titulo', {
        header: 'Curso',
        cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: 300 }}>
            <CourseThumbnail
              src={row.original.miniatura}
              title={row.original.titulo}
              variant='simple'
              sx={{ width: 44, height: 32, flexShrink: 0, borderRadius: '8px' }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant='body2'
                fontWeight={600}
                noWrap
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {row.original.titulo}
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                noWrap
                sx={{
                  fontFamily: 'monospace',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {row.original.slug}
              </Typography>
            </Box>
          </Box>
        )
      }),
      columnHelper.display({
        id: 'profesor',
        header: 'Profesor',
        cell: ({ row }) => {
          const prof = row.original.profesor

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 150 }}>
              <Avatar src={prof.avatar || ''} sx={{ width: 24, height: 24, flexShrink: 0 }}>
                {prof.nombre[0]}
              </Avatar>
              <Typography
                variant='body2'
                noWrap
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {prof.nombre} {prof.apellido}
              </Typography>
            </Box>
          )
        }
      }),
      columnHelper.display({
        id: 'categoria',
        header: 'Categoría',
        cell: ({ row }) => (
          row.original.categoria ? (
            <Chip
              label={row.original.categoria.nombre}
              size='small'
              variant='tonal'
              color='info'
            />
          ) : (
            <Typography variant='caption' color='text.disabled'>—</Typography>
          )
        )
      }),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={estadoLabel[row.original.estado] || row.original.estado}
            color={estadoObj[row.original.estado] || 'default'}
            size='small'
          />
        )
      }),
      columnHelper.display({
        id: 'precio',
        header: 'Precio',
        cell: ({ row }) => (
          row.original.es_gratis ? (
            <Chip label='Gratis' size='small' variant='tonal' color='success' />
          ) : (
            <Typography variant='body2' fontWeight={600} whiteSpace='nowrap'>
              {row.original.moneda === 'PEN' ? 'S/ ' : '$ '}
              {Number(row.original.precio).toFixed(2)}
            </Typography>
          )
        )
      }),
      columnHelper.display({
        id: 'valoracion',
        header: 'Valoración',
        cell: ({ row }) => {
          const promedio = row.original.promedio_valoracion
          const total = row.original._count.valoraciones

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='body2' fontWeight={600}>{promedio.toFixed(1)}</Typography>
                <i className='tabler-star-filled text-warning text-sm' />
              </Box>
              <Typography variant='caption' color='text.secondary'>
                {total} {total === 1 ? 'reseña' : 'reseñas'}
              </Typography>
            </Box>
          )
        }
      }),
      columnHelper.display({
        id: 'contenido',
        header: 'Contenido',
        cell: ({ row }) => {
          const modulos = row.original._count.modulos
          const lecciones = row.original._count.lecciones

          return (
            <Typography variant='caption' color='text.secondary' whiteSpace='nowrap'>
              {modulos} Mod · {lecciones} Lec
            </Typography>
          )
        }
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <div className='w-full text-right'>Acciones</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-end w-full gap-1'>
            <Tooltip title='Ver Alumnos Inscritos'>
              <IconButton onClick={() => handleViewStudentsClick(row.original)}>
                <i className='tabler-users text-[22px] text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Ver en Reproductor (Moderación)'>
              <IconButton
                href={`/estudiante/aprender/${row.original.slug}`}
                component='a'
                target='_blank'
              >
                <i className='tabler-player-play text-[22px] text-primary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Editar curso (Course Builder)'>
              <IconButton
                href={`/admin/cursos/${row.original.id}`}
                component='a'
              >
                <i className='tabler-edit text-[22px] text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar'>
              <IconButton onClick={() => handleDeleteClick(row.original)}>
                <i className='tabler-trash text-[22px] text-textSecondary' />
              </IconButton>
            </Tooltip>
          </div>
        )
      })
    ],
    [pagination]
  )

  const table = useReactTable({
    data: cursos,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      pagination
    },
    onPaginationChange: setPagination,
    manualPagination: true,
    rowCount: totalCursos,
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



  return (
    <>
      <Card>
        <CardHeader title='Gestión de Cursos' className='pbe-4' />
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
              value={estadoFilter}
              onChange={e => {
                setEstadoFilter(e.target.value)
                table.setPageIndex(0)
              }}
              className='is-full sm:is-[200px]'
            >
              <MenuItem value='all'>Todos los estados</MenuItem>
              <MenuItem value='BORRADOR'>Borrador</MenuItem>
              <MenuItem value='PUBLICADO'>Publicado</MenuItem>
              <MenuItem value='ARCHIVADO'>Archivado</MenuItem>
            </CustomTextField>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => {
                setGlobalFilter(String(value))
                table.setPageIndex(0)
              }}
              placeholder='Buscar curso'
              className='is-full sm:is-auto'
            />
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              href='/admin/cursos/nuevo'
              component='a'
              className='is-full sm:is-auto'
            >
              Nuevo Curso
            </Button>
          </div>
        </div>

        <div className='overflow-x-auto relative min-h-[200px]'>
          {isLoading && (
            <div className='absolute inset-0 bg-white/50 z-10 flex items-center justify-center'>
              <Typography variant='body2'>Cargando cursos...</Typography>
            </div>
          )}
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
                          {
                            {
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted() as 'asc' | 'desc']
                          }
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {cursos.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No hay cursos disponibles
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows
                  .map(row => (
                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component={() => <TablePaginationComponent table={table as any} />}
          count={totalCursos}
          rowsPerPage={pagination.pageSize}
          page={pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <CursosActions
        cursoClicked={cursoToDelete}
        deleteCurso={{
          isOpen: openDeleteModal,
          closeHandler: () => {
            setOpenDeleteModal(false)
            setCursoToDelete(null)
          }
        }}
        viewStudents={{
          isOpen: openStudentsModal,
          closeHandler: () => {
            setOpenStudentsModal(false)
            setCursoToDelete(null)
          }
        }}
        onSuccess={() => refetch()}
      />
    </>
  )
}
