const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const c = await prisma.curso.update({
        where: { slug: 'ind2' },
        data: {
            precio_certificado_ipg: 100,
            precio_certificado_cip: 150
        }
    });
    console.log('Prices updated:', c.precio_certificado_ipg, c.precio_certificado_cip);
}
main().finally(() => prisma.$disconnect());
