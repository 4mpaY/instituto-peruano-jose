const fecha_entrega_estimada = new Date('2026-08-07T00:00:00.000Z');
let fechaEstimadaPeru = fecha_entrega_estimada ? new Date(fecha_entrega_estimada) : null;
if (fechaEstimadaPeru && fechaEstimadaPeru.getUTCHours() === 0) {
  fechaEstimadaPeru.setUTCHours(5);
}

const now = new Date();
const disponibleDesde = fechaEstimadaPeru;
const disponible = now >= disponibleDesde;

console.log('now:', now.toISOString());
console.log('disponibleDesde:', disponibleDesde.toISOString());
console.log('disponible:', disponible);
