const fs = require('fs');
const file = 'src/features/admin/pedidos/pages/PedidosPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Autocomplete
content = content.replace(
  '  CircularProgress\n} from \'@mui/material\'',
  '  CircularProgress,\n  Autocomplete\n} from \'@mui/material\''
);

content = content.replace(
  'import CustomAlertDialog from \'@/components/CustomAlertDialog\'',
  'import CustomAlertDialog from \'@/components/CustomAlertDialog\'\nimport { useCursosLista } from \'@/features/admin/cursos/hooks/useCursos\''
);

// 2. Remove HydratedDate
content = content.replace('import HydratedDate from \'@/utils/components/HydratedDate\'\n', '');

// 3. Add Filter state and options (using creado_en instead of fecha_inicio)
content = content.replace(
  '  const [nombre, setNombre] = useState(\'\')',
  '  const [nombre, setNombre] = useState(\'\')\n  const [cursoFiltro, setCursoFiltro] = useState<{ id: string; label: string } | null>(null)\n\n  const { data: cursosLista = [] } = useCursosLista()\n\n  const cursosOpciones = useMemo(() => {\n    return cursosLista.map((c: any) => {\n      let extra = \'\'\n      if (c.tipo_emision || c.creado_en) {\n        const parts = []\n        if (c.tipo_emision) parts.push(c.tipo_emision)\n        if (c.creado_en) parts.push(new Date(c.creado_en).toLocaleDateString(\'es-PE\'))\n        extra = ` (${parts.join(\' - \')})`\n      }\n      return {\n        id: c.id,\n        label: `${c.titulo}${extra}`\n      }\n    })\n  }, [cursosLista])'
);

// 4. Excel export changes
const oldFilas = `      const filas = todos.map(p => ({
        '# Pedido': \`#\${String(p.numero_pedido).padStart(6, '0')}\`,
        Estudiante: \`\${p.usuario?.nombre ?? ''} \${p.usuario?.apellido ?? ''}\`.trim(),
        Correo: p.usuario?.correo ?? '',
        'Curso(s)': p.detalles?.map(d => d.curso?.titulo).join(' | ') ?? '',
        Total: \`\${p.moneda} \${Number(p.total).toFixed(2)}\`,
        Cupón: p.cupon?.codigo ?? '',
        'Método de pago': p.metodo_pago?.toLowerCase().replace('_', ' ') ?? '',
        Estado: p.estado,
        Fecha: p.creado_en ? new Date(p.creado_en).toLocaleDateString('es-PE') : ''
      }))`;
      
const newFilas = `      const filas = todos.map(p => ({
        '# Pedido': \`#\${String(p.numero_pedido).padStart(6, '0')}\`,
        Estudiante: \`\${p.usuario?.nombre ?? ''} \${p.usuario?.apellido ?? ''}\`.trim(),
        DNI: p.usuario?.numero_documento ?? '',
        Celular: p.usuario?.celular ?? '',
        Correo: p.usuario?.correo ?? '',
        'Curso(s)': p.detalles?.map(d => d.curso?.titulo).join(' | ') ?? '',
        Total: \`\${p.moneda} \${Number(p.total).toFixed(2)}\`,
        Cupón: p.cupon?.codigo ?? '',
        'Método de pago': p.metodo_pago?.toLowerCase().replace('_', ' ') ?? '',
        'Banco / Ref.': (p as any).referencia_pago ?? '',
        'Cód. Operación': (p as any).numero_comprobante ?? '',
        'Voucher (URL)': (p as any).comprobante_url ? String((p as any).comprobante_url) : '',
        Estado: p.estado,
        Fecha: p.creado_en ? new Date(p.creado_en).toLocaleDateString('es-PE') : ''
      }))`;
content = content.replace(oldFilas, newFilas);

// 5. Query changes for filter
content = content.replace(
  'const res = await axiosPedido.getAll({ estado: estadoFiltro, nro_pedido: nroPedido, nombre, limit: \'5000\' })',
  'const res = await axiosPedido.getAll({ estado: estadoFiltro, nro_pedido: nroPedido, nombre, cursoId: cursoFiltro?.id || \'\', limit: \'5000\' })'
);

content = content.replace(
  '      estado: estadoFiltro,\n      nro_pedido: nroPedido,\n      nombre: nombre,',
  '      estado: estadoFiltro,\n      nro_pedido: nroPedido,\n      nombre: nombre,\n      cursoId: cursoFiltro?.id || \'\','
);

// 6. Column definitions and sizing
const columnsRegex = /const columns = useMemo<ColumnDef<Pedido, any>\[\]>\([\s\S]*?\],\s*\[router\]\s*\)/;
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
        header: () => <div className='w-full text-center'>Acciones</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-center w-full gap-1'>
            <Tooltip title='Ver Detalle'>
              <IconButton onClick={() => router.push(\`/admin/pedidos/detalle/\${row.original.id}\`)}>
                <i className='tabler-eye text-[22px] text-primary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Editar'>
              <IconButton onClick={() => router.push(\`/admin/pedidos/editar/\${row.original.id}\`)}>
                <i className='tabler-edit text-[22px] text-textSecondary' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar'>
              <IconButton onClick={() => setDeleteInfo({ open: true, id: row.original.id })}>
                <i className='tabler-trash text-[22px] text-error' />
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
          <Typography color='text.primary' className='font-medium'>
            {row.original.moneda} {Number(row.original.total).toFixed(2)}
          </Typography>
        )
      }),
      columnHelper.accessor('detalles', {
        header: 'Curso(s)',
        cell: ({ row }) => (
          <div className='flex flex-col whitespace-normal min-w-[200px] max-w-[300px]'>
            {row.original.detalles?.map((detalle, index) => {
              const certTipo = (detalle as any).certificado_tipo
              const titulo = detalle.curso?.titulo || ''

              const label = certTipo
                ? \`\${titulo} (Certificado \${String(certTipo).toUpperCase() === 'CIP' ? 'Colegio de Ingenieros' : 'IPG'})\`
                : titulo

              return (
                <Typography key={index} variant='body2' color='text.primary'>
                  {label}
                </Typography>
              )
            })}
          </div>
        )
      }),
      columnHelper.accessor('usuario', {
        header: 'Estudiante',
        cell: ({ row }) => (
          <div className='flex flex-col whitespace-normal min-w-[150px] max-w-[200px]'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.usuario?.nombre} {row.original.usuario?.apellido}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
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
          <Typography variant='body2' className='capitalize'>
            {row.original.metodo_pago?.toLowerCase().replace('_', ' ') || '-'}
          </Typography>
        )
      })
    ],
    [router]
  )`;

content = content.replace(columnsRegex, newColumns);

// 7. Render filter UI
const filterHtml = `          <DebouncedInput
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
          />`;
content = content.replace(/<DebouncedInput[\s\S]*?placeholder='Buscar Estudiante\.\.\.'[\s\S]*?\/>/, filterHtml);

fs.writeFileSync(file, content);
console.log('Script updated successfully');
