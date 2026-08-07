const fs = require('fs');
const file2 = 'src/features/admin/cursos/components/CourseBuilder/TabCertificacion.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

// 1. Add editId state right after nuevo state
const stateOld = "  const [entregas, setEntregas] = useState<CipEntregaRango[]>(() => asEntregas(curso.certificado_cip_entregas))\n  const [nuevo, setNuevo] = useState(emptyRango())";
const stateNew = "  const [entregas, setEntregas] = useState<CipEntregaRango[]>(() => asEntregas(curso.certificado_cip_entregas))\n  const [nuevo, setNuevo] = useState(emptyRango())\n  const [editId, setEditId] = useState<string | null>(null)";
content2 = content2.replace(stateOld, stateNew);

// 2. Update handleAddCip function
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
    let next: CipEntregaRango[] = []
    if (editId) {
      next = entregas.map(r => (r.id === editId ? { ...nuevo, id: editId } : r))
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

// 3. Update CustomTextFields for datetime-local
content2 = content2.replace(
  `                      type="date"\n                      label="Habilitación / pagos desde"`,
  `                      type="datetime-local"\n                      label="Habilitación / pagos desde"`
);
content2 = content2.replace(
  `                      type="date"\n                      label="Habilitación / pagos hasta"`,
  `                      type="datetime-local"\n                      label="Habilitación / pagos hasta"`
);

// 4. Update the "Agregar periodo" button
const addBtnOld = `                <Button
                  variant="contained"
                  onClick={handleAddCip}
                  startIcon={<i className="tabler-plus" />}
                  sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Agregar periodo
                </Button>`;
const addBtnNew = `                <Button
                  variant="contained"
                  onClick={handleAddCip}
                  startIcon={<i className={editId ? 'tabler-check' : 'tabler-plus'} />}
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
content2 = content2.replace(addBtnOld, addBtnNew);

// 5. Update Grid sizes
content2 = content2.replace(`xs={h === 'Acciones' ? 1.5 : 2.625}`, `xs={h === 'Acciones' ? 2 : 2.5}`);
content2 = content2.replace(`<Grid item xs={2.625} key={idx}>`, `<Grid item xs={2.5} key={idx}>`);
content2 = content2.replace(`<Grid item xs={1.5}>`, `<Grid item xs={2}>`);

// 6. Update actions (Edit / Delete)
const deleteBtnOld = `                        <IconButton color="error" onClick={() => handleRemoveCip(r.id)} size="small">\n                          <i className="tabler-trash" />\n                        </IconButton>`;
const editDeleteBtns = `                        <IconButton
                          color="primary"
                          onClick={() => {
                            setEditId(r.id)
                            setNuevo({
                              pagos_desde: r.pagos_desde,
                              pagos_hasta: r.pagos_hasta,
                              fecha_entrega: r.fecha_entrega,
                              hora: r.hora,
                            })
                          }}
                          size="small"
                        >
                          <i className="tabler-pencil" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleRemoveCip(r.id)} size="small">
                          <i className="tabler-trash" />
                        </IconButton>`;
content2 = content2.replace(deleteBtnOld, editDeleteBtns);

fs.writeFileSync(file2, content2);
console.log('Update script successful');
