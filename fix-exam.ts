import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const courseSlug = 'seguridad-salud-ocupacional-obras';
  const course = await prisma.curso.findUnique({ where: { slug: courseSlug }, include: { modulos: true } });
  
  if (course && course.modulos.length > 0) {
    const firstModule = course.modulos[0];
    const updated = await prisma.examen.updateMany({
      where: { curso_id: course.id, tipo: 'INTERMEDIO', modulo_id: null },
      data: { modulo_id: firstModule.id }
    });
    console.log('Updated exams:', updated.count);
  }
}
main().finally(() => prisma.$disconnect());
