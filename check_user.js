const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.usuario.findUnique({
      where: { correo: 'jose@gmail.com' },
      include: {
        inscripciones: {
          include: {
            curso: true
          }
        }
      }
    });
    console.log('Usuario:', user?.correo, 'Inscripciones:', user?.inscripciones?.length);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
