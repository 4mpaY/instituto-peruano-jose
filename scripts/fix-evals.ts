import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const examenes = await prisma.examen.findMany({
    where: {
      titulo: {
        contains: 'Evaluación'
      },
      curso: {
        titulo: {
          contains: 'industria',
          mode: 'insensitive'
        }
      }
    }
  })

  console.log(`Encontradas ${examenes.length} evaluaciones.`)

  if (examenes.length >= 2) {
    const cursoId = examenes[0].curso_id

    // Buscar módulos de este curso
    let modulo = await prisma.modulo.findFirst({
      where: { curso_id: cursoId }
    })

    if (!modulo) {
      // Si el curso no tiene módulos, creamos uno
      modulo = await prisma.modulo.create({
        data: {
          curso_id: cursoId,
          titulo: 'Módulo 1: Introducción',
          orden: 1,
          descripcion: 'Módulo generado automáticamente'
        }
      })
      console.log('Módulo creado porque el curso no tenía ninguno.')
    }

    // Actualizar la primera evaluación para que sea un examen intermedio dentro de ese módulo
    await prisma.examen.update({
      where: { id: examenes[0].id },
      data: {
        tipo: 'INTERMEDIO',
        modulo_id: modulo.id,
        orden: 99
      }
    })

    // Actualizar la segunda evaluación para asegurarse de que sea examen final
    await prisma.examen.update({
      where: { id: examenes[1].id },
      data: {
        tipo: 'FINAL',
        modulo_id: null
      }
    })

    console.log(`Listo. La evaluación "${examenes[0].titulo}" ahora es INTERMEDIO y aparecerá dentro del módulo "${modulo.titulo}". La evaluación "${examenes[1].titulo}" es el examen FINAL que aparecerá al fondo.`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
