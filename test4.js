const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const id = '0e9cd065-b3fa-4814-9613-65c9464a9353';
  
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nombre: true, apellido: true, correo: true, avatar: true } },
      cupon: true,
      metodo_pago_manual: true,
      detalles: {
        include: {
          curso: { select: { id: true, titulo: true, miniatura: true, precio: true, certificado_ipg_espera_valor: true, certificado_ipg_espera_unidad: true, certificado_cip_entregas: true } }
        }
      }
    }
  });

  const [tipoRow] = await prisma.$queryRaw`
    SELECT tipo::text AS tipo FROM pedidos WHERE id = ${id}
  `;

  const certs = await prisma.$queryRaw`
    SELECT id, certificado_tipo::text AS certificado_tipo
    FROM detalles_pedido WHERE pedido_id = ${id}
  `;

  const certById = new Map(certs.map(c => [c.id, c.certificado_tipo]));

  const { resolveCertificadoDisponibilidad } = await import('./src/utils/functions/certificadoDisponibilidad.ts');

  let fechaEntregaDefault = null;

  if (tipoRow?.tipo === 'CERTIFICADO' && pedido.detalles.length > 0) {
    const detalle = pedido.detalles[0];
    const certTipo = certById.get(detalle.id) || 'IPG';
    
    const disp = resolveCertificadoDisponibilidad({
      tipo: certTipo === 'CIP' ? 'cip' : 'ipg',
      habilitado: true,
      habilitadoEn: pedido.creado_en || pedido.pagado_en,
      ipgEsperaValor: detalle.curso.certificado_ipg_espera_valor,
      ipgEsperaUnidad: detalle.curso.certificado_ipg_espera_unidad,
      cipEntregas: detalle.curso.certificado_cip_entregas,
      fechaPago: pedido.creado_en || pedido.pagado_en,
    });
    
    fechaEntregaDefault = disp.disponibleDesde;
  }

  console.log('SUCCESS');
}

run().catch(console.error).finally(() => prisma.$disconnect());
