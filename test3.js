const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const id = '0e9cd065-b3fa-4814-9613-65c9464a9353';
  
  const [tipoRow] = await prisma.$queryRaw`
    SELECT tipo::text AS tipo FROM pedidos WHERE id = ${id}
  `;

  console.log('TIPO:', tipoRow);
}

run().catch(console.error).finally(() => prisma.$disconnect());
