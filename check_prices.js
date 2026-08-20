const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const c = await prisma.curso.findFirst({where:{slug:{contains: 'industria'}}});
    console.log(c.titulo, c.precio_certificado, c.precio_certificado_ipg, c.precio_certificado_cip);
}
main().finally(() => prisma.$disconnect());
