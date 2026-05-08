import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const baseUrl = process.env.DATABASE_URL || ''

  const datasourceUrl = baseUrl.includes('?')
    ? `${baseUrl}&connection_limit=2&pool_timeout=10`
    : `${baseUrl}?connection_limit=2&pool_timeout=10`

  return new PrismaClient({ datasourceUrl })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prismaClientSingleton()
}

const prisma = globalForPrisma.prisma

export default prisma

// Triggering reload to pick up new models
