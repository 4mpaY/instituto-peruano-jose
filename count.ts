import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.curso.findFirst({ 
    where: { titulo: { contains: 'Seguridad y Salud Ocupacional en Obras' } },
    select: { id: true, slug: true, titulo: true }
  });
  console.log('Course:', course);
}
main().finally(() => prisma.$disconnect());
