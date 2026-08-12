import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const courseSlug = 'seguridad-salud-ocupacional-obras';
  
  const course = await prisma.curso.findUnique({ where: { slug: courseSlug } });
  
  if (!course) {
    console.error('Course not found:', courseSlug);
    return;
  }

  // Create a test module
  const module = await prisma.modulo.create({
    data: {
      titulo: 'Módulo de Prueba 1 - Introducción',
      orden: Math.floor(Math.random() * 1000) + 100, // random order to avoid constraint
      curso_id: course.id,
      lecciones: {
        create: [
          {
            titulo: 'Lección de prueba 1',
            orden: 1,
            contenido: 'Contenido de prueba para la lección 1',
            es_vista_previa: true,
            estado: 'PUBLICADO'
          },
          {
            titulo: 'Lección de prueba 2',
            orden: 2,
            contenido: 'Contenido de prueba para la lección 2',
            es_vista_previa: false,
            estado: 'PUBLICADO'
          }
        ]
      }
    }
  });
  console.log('Created module with ID:', module.id);
}
main().finally(() => prisma.$disconnect());
