'use client'

import { useMemo, useState } from 'react'

import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
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
  useReactTable
} from '@tanstack/react-table'

import { getSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import { AxiosCertificado } from '../http/axiosCertificado'
import type { Certificado } from '../entity/Certificado'
import { CreateCertificadoModal } from './CreateCertificadoModal'
import CustomTextField from '@core/components/mui/TextField'
import { DebouncedInput } from '@/utils/components/others/DebouncedInput'
import HydratedDate from '@/utils/components/HydratedDate'
import TablePaginationComponent from '@/utils/components/others/TablePaginationComponent'
import tableStyles from '@core/styles/table.module.css'


import { useCertificados } from '../hooks/useCertificados'

const columnHelper = createColumnHelper<Certificado>()

interface CertificadosTableProps {
  initialData?: any | null
}

export function CertificadosTable({ initialData }: CertificadosTableProps) {
  const [params, setParams] = useState({ page: 1, limit: 10, codigo: '', nombre: '' })
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading } = useCertificados(params, initialData || undefined)

  const certificados = data?.certificados || []
  const total = data?.paginacion?.total || 0

  const handleDownload = async (certificado: Certificado) => {
    try {
      toast.info('Generando PDF...')

      const getAuthToken = async () => {
        const s = await getSession()

        return s?.user?.accessToken ?? null
      }

      const axiosCertificado = new AxiosCertificado({ getAuthToken })
      const blob = await axiosCertificado.downloadPdf(certificado.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `certificado-${certificado.usuario.nombre.toLowerCase()}-${certificado.codigo_verificacion}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Certificado descargado')
    } catch (err: any) {
      console.error('Error downloading certificate:', err)
      toast.error('Error al descargar el certificado')
    }
  }

  const handlePreview = async (certificado: Certificado) => {
    try {
      const getAuthToken = async () => {
        const s = await getSession()

        return s?.user?.accessToken ?? null
      }

      const axiosCertificado = new AxiosCertificado({ getAuthToken })
      const blob = await axiosCertificado.downloadPdf(certificado.id, true)
      const url = window.URL.createObjectURL(blob)

      window.open(url, '_blank')
    } catch (err: any) {
      console.error('Error previewing certificate:', err)
      toast.error('Error al visualizar el certificado')
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'numero',
        header: '#',
        cell: ({ row }) => (
          <Typography color='text.secondary' variant='body2'>
            {(params.page - 1) * params.limit + row.index + 1}
          </Typography>
        )
      }),
      columnHelper.accessor('usuario', {
        header: 'Estudiante',
        cell: ({ row }) => (
          <Box className='flex items-center gap-3'>
            <Avatar
              src={row.original.usuario.avatar || undefined}
              imgProps={{ referrerPolicy: 'no-referrer' }}
            />
            <Box className='flex flex-col'>
              <Typography color='text.primary' sx={{ fontWeight: 500 }}>
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
        cell: ({ row }) => <Typography color='text.primary'>{row.original.curso.titulo}</Typography>
      }),
      columnHelper.accessor('codigo_verificacion', {
        header: 'Código',
        cell: ({ row }) => (
          <Typography variant='body2' sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
            {row.original.codigo_verificacion}
          </Typography>
        )
      }),
      columnHelper.accessor('emitido_en', {
        header: 'Fecha Emisión',
        cell: ({ row }) => (
          <Typography variant='body2'>
            <HydratedDate date={row.original.emitido_en} format="date" />
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <Box className='w-full text-right'>Acciones</Box>,
        cell: ({ row }) => (
          <Box className='flex items-center justify-end w-full gap-1'>
            <Tooltip title='Vista previa'>
              <IconButton onClick={() => handlePreview(row.original)} color='secondary' size='small'>
                <i className='tabler-eye text-[22px]' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Descargar PDF'>
              <IconButton onClick={() => handleDownload(row.original)} color='primary' size='small'>
                <i className='tabler-download text-[22px]' />
              </IconButton>
            </Tooltip>
          </Box>
        )
      })
    ],
    [params.page, params.limit]
  )

  const table = useReactTable({
    data: certificados,
    columns,
    state: {
      pagination: {
        pageIndex: params.page - 1,
        pageSize: params.limit
      }
    },
    onPaginationChange: updater => {
      const nextPagination =
        typeof updater === 'function'
          ? updater({
            pageIndex: params.page - 1,
            pageSize: params.limit
          })
          : updater

      setParams(prev => ({
        ...prev,
        page: nextPagination.pageIndex + 1,
        limit: nextPagination.pageSize
      }))
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Certificados Emitidos'
        />
        <Box className='flex justify-between flex-col items-start lg:flex-row lg:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={params.limit}
            onChange={e => {
              setParams(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))
            }}
            sx={{ width: 80 }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </CustomTextField>
          <Box className='flex flex-col sm:flex-row items-center gap-4 is-full sm:is-auto'>
            <DebouncedInput
              value={params.codigo}
              onChange={value => {
                setParams(prev => ({ ...prev, codigo: String(value), page: 1 }))
              }}
              placeholder='Filtrar por código'
              className='is-full sm:is-auto'
            />
            <DebouncedInput
              value={params.nombre}
              onChange={value => {
                setParams(prev => ({ ...prev, nombre: String(value), page: 1 }))
              }}
              placeholder='Filtrar por estudiante'
              className='is-full sm:is-auto'
            />
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus text-[16px]' />}
              onClick={() => setModalOpen(true)}
            >
              Crear Certificado
            </Button>
          </Box>
        </Box>

        <Box className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className='text-center p-10'>
                    Cargando certificados...
                  </td>
                </tr>
              ) : certificados.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='text-center p-10'>
                    No se encontraron certificados
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>
        <TablePagination
          component={() => <TablePaginationComponent table={table as any} />}
          count={total}
          rowsPerPage={params.limit}
          page={params.page - 1}
          onPageChange={(_, newPage: number) => setParams(prev => ({ ...prev, page: newPage + 1 }))}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setParams(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))
          }}
        />
      </Card>
      <CreateCertificadoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
