import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}&connection_limit=10&pool_timeout=30`,
      },
    },
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

// Reusar la instancia tanto en desarrollo como en producción
const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

globalForPrisma.prisma = prisma

export default prisma
