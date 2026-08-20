import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const curso = await prisma.curso.findFirst({
    where: {
      titulo: {
        contains: 'industria',
        mode: 'insensitive'
      }
    }
  })

  if (!curso) {
    console.log('No se encontró el curso de Industria 5.0')
    return
  }

  console.log('Agregando evaluaciones a:', curso.titulo)

  // Crear Evaluación 1
  await prisma.examen.create({
    data: {
      curso_id: curso.id,
      titulo: 'Evaluación 1: Conceptos Básicos',
      descripcion: 'Prueba inicial sobre los conceptos más obvios.',
      esta_publicado: true,
      puntaje_aprobacion: 60,
      peso: 1,
      preguntas: {
        create: [
          {
            texto: '¿De qué color es el caballo blanco de San Martín?',
            orden: 1,
            tipo: 'OPCION_MULTIPLE',
            opciones: {
              create: [
                { texto: 'Blanco', es_correcta: true, orden: 1 },
                { texto: 'Negro', es_correcta: false, orden: 2 },
                { texto: 'Rojo', es_correcta: false, orden: 3 }
              ]
            }
          },
          {
            texto: '¿Cuánto es 2 + 2?',
            orden: 2,
            tipo: 'OPCION_MULTIPLE',
            opciones: {
              create: [
                { texto: '4', es_correcta: true, orden: 1 },
                { texto: '5', es_correcta: false, orden: 2 },
                { texto: '22', es_correcta: false, orden: 3 }
              ]
            }
          }
        ]
      }
    }
  })

  // Crear Evaluación 2
  await prisma.examen.create({
    data: {
      curso_id: curso.id,
      titulo: 'Evaluación 2: Conceptos Avanzados',
      descripcion: 'Segunda prueba con preguntas muy difíciles y obvias.',
      esta_publicado: true,
      puntaje_aprobacion: 60,
      peso: 1,
      preguntas: {
        create: [
          {
            texto: '¿Cuál es la capital de Perú?',
            orden: 1,
            tipo: 'OPCION_MULTIPLE',
            opciones: {
              create: [
                { texto: 'Lima', es_correcta: true, orden: 1 },
                { texto: 'Santiago', es_correcta: false, orden: 2 },
                { texto: 'Bogotá', es_correcta: false, orden: 3 }
              ]
            }
          },
          {
            texto: '¿El agua moja?',
            orden: 2,
            tipo: 'OPCION_MULTIPLE',
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
  })

  console.log('Evaluaciones creadas con éxito.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
