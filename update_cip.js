const fs = require('fs');
const file1 = 'src/utils/functions/certificadoDisponibilidad.ts';
let content1 = fs.readFileSync(file1, 'utf8');

const parseDateOnlyOld = `function parseDateOnly(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)

  if (!y || !m || !d) return null
  
return new Date(y, m - 1, d, 0, 0, 0, 0)
}`;

const parseDateOnlyNew = `function parseDateOnly(value: string): Date | null {
  if (!value) return null
  
  if (value.includes('T')) {
    return new Date(value)
  }

  const [y, m, d] = value.split('-').map(Number)

  if (!y || !m || !d) return null
  
return new Date(y, m - 1, d, 0, 0, 0, 0)
}`;

content1 = content1.replace(parseDateOnlyOld, parseDateOnlyNew);
fs.writeFileSync(file1, content1);

const file2 = 'src/features/admin/cursos/components/CourseBuilder/TabCertificacion.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

// Add editId state
content2 = content2.replace(
  '  const [nuevo, setNuevo] = useState(emptyRango())',
  '  const [nuevo, setNuevo] = useState(emptyRango())\n  const [editId, setEditId] = useState<string | null>(null)'
);

// Update handleAddCip
const handleAddCipOld = `  const handleAddCip = () => {
    const candidate: CipEntregaRango = {
      id: crypto.randomUUID(),
      ...nuevo,
    }

    const next = [...entregas, candidate]
    const error = validateCipEntregasNoOverlap(next)

    if (error) {
      enqueueSnackbar(error, { variant: 'warning' })
      
return
    }

    setEntregas(next)
    setNuevo(emptyRango())
  }`;

const handleAddCipNew = `  const handleAddCip = () => {
    let next: CipEntregaRango[]
    if (editId) {
      next = entregas.map(r => r.id === editId ? { ...nuevo, id: editId } : r)
    } else {
      const candidate: CipEntregaRango = {
        id: crypto.randomUUID(),
        ...nuevo,
      }
      next = [...entregas, candidate]
    }

    const error = validateCipEntregasNoOverlap(next)

    if (error) {
      enqueueSnackbar(error, { variant: 'warning' })
      return
    }

    setEntregas(next)
    setNuevo(emptyRango())
    setEditId(null)
  }`;
content2 = content2.replace(handleAddCipOld, handleAddCipNew);

// Update inputs type="date" to type="datetime-local" for pagos_desde and pagos_hasta
content2 = content2.replace(
  `                      type="date"
                      label="Habilitación / pagos desde"`,
  `                      type="datetime-local"
                      label="Habilitación / pagos desde"`
);
content2 = content2.replace(
  `                      type="date"
                      label="Habilitación / pagos hasta"`,
  `                      type="datetime-local"
                      label="Habilitación / pagos hasta"`
);

// Update Add button
const addButtonOld = `                <Button
                  variant="contained"
                  onClick={handleAddCip}
                  startIcon={<i className="tabler-plus" />}
                  sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Agregar periodo
                </Button>`;

const addButtonNew = `                <Button
                  variant="contained"
                  onClick={handleAddCip}
                  startIcon={<i className={editId ? "tabler-check" : "tabler-plus"} />}
                  sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  {editId ? 'Actualizar periodo' : 'Agregar periodo'}
                </Button>
                {editId && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditId(null)
                      setNuevo(emptyRango())
                    }}
                    sx={{ mt: 2, ml: 2, textTransform: 'none', fontWeight: 700 }}
                  >
                    Cancelar
                  </Button>
                )}`;
content2 = content2.replace(addButtonOld, addButtonNew);

// Update actions column in map
const editIconHTML = `                        <IconButton color="primary" onClick={() => {
                          setEditId(r.id)
                          setNuevo({
                            pagos_desde: r.pagos_desde,
                            pagos_hasta: r.pagos_hasta,
                            fecha_entrega: r.fecha_entrega,
                            hora: r.hora
                          })
                        }} size="small">
                          <i className="tabler-pencil" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleRemoveCip(r.id)} size="small">
                          <i className="tabler-trash" />
                        </IconButton>`;
content2 = content2.replace(
  `                        <IconButton color="error" onClick={() => handleRemoveCip(r.id)} size="small">\n                          <i className="tabler-trash" />\n                        </IconButton>`,
  editIconHTML
);

// Change Grid layout for Acciones from 1.5 to 2.0 to fit 2 buttons
content2 = content2.replace(/xs=\{h === 'Acciones' \? 1\.5 : 2\.625\}/g, "xs={h === 'Acciones' ? 2 : 2.5}");
content2 = content2.replace(/<Grid item xs=\{2\.625\} key=\{idx\}>/g, "<Grid item xs={2.5} key={idx}>");
content2 = content2.replace(/<Grid item xs=\{1\.5\}>/g, "<Grid item xs={2}>");

fs.writeFileSync(file2, content2);
console.log('Update script successful');
