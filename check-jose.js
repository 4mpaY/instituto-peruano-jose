const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const user = await prisma.usuario.findUnique({ where: { correo: 'jose@gmail.com' }, include: { inscripciones: true } });
    console.log(user.inscripciones);
}
check().finally(() => prisma.$disconnect());
