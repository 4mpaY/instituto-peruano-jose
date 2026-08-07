const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE inscripciones SET certificado_cip_habilitado = true, certificado_habilitado = true WHERE id = 'acb94eff-8cee-4a81-bf56-eda64e03829b'`;
  console.log('Fixed DB');
}

main();
