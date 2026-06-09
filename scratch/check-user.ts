import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.usuario.findUnique({ where: { correo: 'jose@gmail.com' } })
  console.log('USER_CHECK:', JSON.stringify(user))
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
