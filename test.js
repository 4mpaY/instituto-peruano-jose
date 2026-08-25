const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.pedido.findFirst().then(console.log).finally(() => prisma.$disconnect());
