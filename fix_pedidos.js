const fs = require('fs');
const file = 'src/features/admin/pedidos/pages/PedidosPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
if (!content.includes('Autocomplete')) {
  content = content.replace(
    `CircularProgress\n} from '@mui/material'`,
    `CircularProgress,\n  Autocomplete\n} from '@mui/material'`
  );
}
if (!content.includes('useCursosLista')) {
  content = content.replace(
    `import { AxiosPedido } from '../http/axiosPedido'`,
    `import { useCursosLista } from '../../cursos/hooks/useCursos'\nimport { AxiosPedido } from '../http/axiosPedido'`
  );
}

// 2. States and hooks
const stateHookPos = content.indexOf(`  const [nroPedido, setNroPedido] = useState('')\n  const [nombre, setNombre] = useState('')`);
if (stateHookPos !== -1 && !content.includes('cursoFiltro')) {
  const newStates = `  const [nroPedido, setNroPedido] = useState('')
  const [nombre, setNombre] = useState('')
  const [cursoFiltro, setCursoFiltro] = useState<{ id: string, label: string } | null>(null)

  const { data: cursosLista } = useCursosLista()
  
  const cursosOpciones = useMemo(() => {
    if (!cursosLista) return []
    return cursosLista.map(c => ({
      id: c.id,
      label: \`\${c.titulo} (\${c.es_asincrono ? 'Asíncrono' : 'Síncrono'} - \${new Date(c.creado_en).toLocaleDateString('es-PE')})\`
    }))
  }, [cursosLista])`;
  content = content.replace(`  const [nroPedido, setNroPedido] = useState('')\n  const [nombre, setNombre] = useState('')`, newStates);
}

// 3. Update usePedidos payload
if (!content.includes('cursoId: cursoFiltro?.id')) {
  content = content.replace(
    `      nombre: nombre,\n      page: String(pagination.pageIndex + 1)`,
    `      nombre: nombre,\n      cursoId: cursoFiltro?.id,\n      page: String(pagination.pageIndex + 1)`
  );
}

// 4. Update the layout
const startMarker = "<div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>";
const startMarker2 = "<div className='flex justify-between flex-col items-start xl:flex-row xl:items-start p-6 border-bs gap-4'>"; // In case it was already modified
const endMarker = "<div className='overflow-x-auto relative'>";

let actualStartMarker = null;
if (content.includes(startMarker)) actualStartMarker = startMarker;
else if (content.includes(startMarker2)) actualStartMarker = startMarker2;

if (actualStartMarker && content.includes(endMarker)) {
  const prefix = content.substring(0, content.indexOf(actualStartMarker));
  const suffix = content.substring(content.indexOf(endMarker));

  const newHeader = `<div className='flex justify-between flex-col items-start xl:flex-row xl:items-start p-6 border-bs gap-4'>
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
      
      `;
  fs.writeFileSync(file, prefix + newHeader + suffix);
  console.log('Fixed PedidosPage.tsx successfully');
} else {
  console.log('Markers not found!');
}
