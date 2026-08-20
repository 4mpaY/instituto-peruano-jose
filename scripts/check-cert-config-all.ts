import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cursos = await prisma.curso.findMany({
    where: {
      certificado_cip_entregas: { not: [] }
    },
    select: {
      titulo: true,
      certificado_cip_entregas: true,
      fecha_inicio: true,
      fecha_fin: true
    }
  })

  console.dir(cursos, { depth: null })
}

main().finally(() => prisma.$disconnect())
