const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const u = await prisma.usuario.findFirst({where:{correo:'jose@gmail.com'}});
    if(u) {
        const deleted = await prisma.certificado.deleteMany({where:{usuario_id:u.id}});
        console.log('Deleted certificates:', deleted.count);
    }
}
main().finally(() => prisma.$disconnect());
