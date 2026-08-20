import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cursos = await prisma.curso.findMany({
    where: {
      titulo: {
        contains: 'Algoritmos'
      }
    },
    select: {
      id: true,
      titulo: true,
      fecha_inicio: true,
      fecha_fin: true,
      inscripciones: {
        select: {
          usuario: { select: { nombre: true, apellido: true } }
        }
      },
      certificados: {
        select: {
          id: true,
          tipo: true,
          usuario: { select: { nombre: true, apellido: true } },
          emitido_en: true,
          datos: true
        }
      }
    }
  })

  console.dir(cursos, { depth: null })
}

main().finally(() => prisma.$disconnect())
