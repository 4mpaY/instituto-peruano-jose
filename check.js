const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name = 'cursos' AND column_name = 'grupo_whatsapp';");
    console.log('Result:', res);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
