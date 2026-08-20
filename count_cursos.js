const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const cursos = await prisma.curso.count();
    console.log('Total cursos en la base de datos:', cursos);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
