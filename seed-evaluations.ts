import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const courseSlug = 'seguridad-salud-ocupacional-obras';
  
  const course = await prisma.curso.findUnique({ where: { slug: courseSlug } });
  
  if (!course) {
    console.error('Course not found:', courseSlug);
    return;
  }

  console.log(`Adding data to course: ${course.titulo} (${course.id})`);

  // const module = await prisma.modulo.create({ ... });

  // Create Evaluation 1
  const exam1 = await prisma.examen.create({
    data: {
      titulo: 'Evaluación Teórica 1',
      descripcion: 'Primera evaluación de prueba',
      orden: 1,
      curso_id: course.id,
      puntaje_aprobacion: 14,
      intentos_maximos: 3,
      esta_publicado: true,
      tipo: 'INTERMEDIO',
      peso: 1,
      preguntas: {
        create: [
          {
            texto: '¿Cuál es el equipo de protección personal principal en obras?',
            tipo: 'OPCION_MULTIPLE',
            puntos: 10,
            orden: 1,
            opciones: {
              create: [
                { texto: 'Casco de seguridad', es_correcta: true, orden: 1 },
                { texto: 'Gorra de sol', es_correcta: false, orden: 2 }
              ]
            }
          },
          {
            texto: '¿Es obligatorio el uso de arnés para trabajos en altura?',
            tipo: 'OPCION_MULTIPLE',
            puntos: 10,
            orden: 2,
            opciones: {
              create: [
                { texto: 'Sí', es_correcta: true, orden: 1 },
                { texto: 'No', es_correcta: false, orden: 2 }
              ]
            }
          }
        ]
      }
    }
  });
  console.log('Created Exam 1:', exam1.id);

  // Create Evaluation 2
  const exam2 = await prisma.examen.create({
    data: {
      titulo: 'Evaluación Final',
      descripcion: 'Segunda evaluación de prueba (Final)',
      orden: 2,
      curso_id: course.id,
      puntaje_aprobacion: 14,
      intentos_maximos: 3,
      esta_publicado: true,
      tipo: 'FINAL',
      peso: 2,
      preguntas: {
        create: [
          {
            texto: '¿Qué norma rige la seguridad en construcción?',
            tipo: 'OPCION_MULTIPLE',
            puntos: 10,
            orden: 1,
            opciones: {
              create: [
                { texto: 'Norma G.050', es_correcta: true, orden: 1 },
                { texto: 'Norma de Tránsito', es_correcta: false, orden: 2 }
              ]
            }
          },
          {
            texto: 'Se deben reportar todos los accidentes',
            tipo: 'OPCION_MULTIPLE',
            puntos: 10,
            orden: 2,
            opciones: {
              create: [
                { texto: 'Verdadero', es_correcta: true, orden: 1 },
                { texto: 'Falso', es_correcta: false, orden: 2 }
              ]
            }
          }
        ]
      }
    }
  });
  console.log('Created Exam 2:', exam2.id);

  console.log('Done!');
}
main().finally(() => prisma.$disconnect());
