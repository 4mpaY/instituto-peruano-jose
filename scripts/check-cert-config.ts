import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cursos = await prisma.curso.findMany({
    where: {
      titulo: {
        contains: 'Gestión de Conflictos'
      }
    },
    select: {
      titulo: true,
      certificado_cip_entregas: true,
      certificado_ipg_espera_valor: true,
      certificado_ipg_espera_unidad: true
    }
  })

  console.dir(cursos, { depth: null })
}

main().finally(() => prisma.$disconnect())
