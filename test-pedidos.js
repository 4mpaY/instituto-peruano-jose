const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.usuario.findUnique({ where: { correo: 'jose@gmail.com' } });
  const cursoId = 'ea96a199-b859-4c92-ba34-6e167703792f';
  const p = await prisma.$queryRaw`SELECT p.id, p.estado FROM pedidos p JOIN detalles_pedido d ON d.pedido_id = p.id WHERE p.usuario_id = ${u.id} AND d.curso_id = ${cursoId} ORDER BY p.creado_en DESC`;
  console.log('Pedidos:', p);
}
main().finally(() => process.exit(0));
