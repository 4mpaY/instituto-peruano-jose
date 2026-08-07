const fs = require('fs');
const file = 'src/features/admin/pedidos/pages/PedidosPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// The columns definition starts at `const columns = useMemo<ColumnDef<Pedido, any>[]>(`
// We'll replace the entire array inside it.

const newColumns = `const columns = useMemo<ColumnDef<Pedido, any>[]>(
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
              <IconButton onClick={() => router.push(\`/admin/pedidos/detalle/\${row.original.id}\`)} size='small'>
                <i className='tabler-eye text-[20px] text-primary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Editar'>
              <IconButton onClick={() => router.push(\`/admin/pedidos/editar/\${row.original.id}\`)} size='small'>
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
                  ? \`\${(row.original as any).referencia_pago}\`
                  : ''}
                {(row.original as any).referencia_pago && row.original.numero_comprobante ? ' · ' : ''}
                {row.original.numero_comprobante || ''}
              </Typography>
            )}
          </Stack>
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
                ? \`\${titulo} (Certificado \${String(certTipo).toUpperCase() === 'CIP' ? 'Colegio de Ingenieros' : 'IPG'})\`
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
  )`;

const startIdx = content.indexOf('const columns = useMemo<ColumnDef<Pedido, any>[]>(');
const endIdx = content.indexOf('  const table = useReactTable({'); // Ends where table instantiation starts

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newColumns + '\n\n' + content.substring(endIdx);
  fs.writeFileSync(file, content);
  console.log('Update columns successful');
} else {
  console.log('Markers not found');
}
