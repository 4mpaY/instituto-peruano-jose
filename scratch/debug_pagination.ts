import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.usuario.count()

  console.log(`Total usuarios: ${total}`)

  const p2 = await prisma.usuario.findMany({
    skip: 10,
    take: 10,
    orderBy: { creado_en: 'desc' }
  })

  console.log(`Usuarios en página 2 (skip 10, take 10): ${p2.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
