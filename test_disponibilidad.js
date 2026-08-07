const { resolveCertificadoDisponibilidad } = require('./src/utils/functions/certificadoDisponibilidad');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const pedidosCertCompletados = await prisma.$queryRaw`
        SELECT p.fecha_entrega_estimada, d.certificado_tipo::text AS certificado_tipo
        FROM pedidos p
        JOIN detalles_pedido d ON d.pedido_id = p.id
        WHERE p.usuario_id = 'c1c1fce9-4a0d-4340-9a4d-b942bc3c4b12'
          AND p.estado = 'COMPLETADO'
          AND d.curso_id = 'ea96a199-b859-4c92-ba34-6e167703792f'
          AND (p.tipo = 'CERTIFICADO'::"TipoPedido" OR d.certificado_tipo IS NOT NULL)
        ORDER BY p.creado_en DESC
      `;
  
  const fechaEstimadaCip = pedidosCertCompletados.find(p => p.certificado_tipo === 'CIP')?.fecha_entrega_estimada ?? null;
  console.log('fechaEstimadaCip from DB:', fechaEstimadaCip);

  const dispCip = resolveCertificadoDisponibilidad({
    tipo: 'cip',
    habilitado: true,
    habilitadoEn: new Date('2026-08-07T00:48:58Z'),
    cipEntregas: [],
    fechaPago: new Date('2026-08-07T00:48:58Z'),
    fechaEntregaEstimada: fechaEstimadaCip,
    now: new Date('2026-08-07T01:45:00Z') // Mock now (Peru 8:45 PM on Aug 6)
  });

  console.log('dispCip:', dispCip);
}
test();
