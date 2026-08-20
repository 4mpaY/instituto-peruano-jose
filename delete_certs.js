require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.certificado.deleteMany({
        where: { usuario: { correo: 'jose@gmail.com' } }
    });
    console.log('Certificados deleted for jose@gmail.com');
}
main().finally(() => prisma.$disconnect());
