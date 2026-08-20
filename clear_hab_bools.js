const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const u = await prisma.usuario.findFirst({where:{correo:'jose@gmail.com'}});
    const c = await prisma.curso.findFirst({where:{slug:{contains: 'ind2'}}});
    
    if (u && c) {
        const upd = await prisma.inscripcion.updateMany({
            where: { usuario_id: u.id, curso_id: c.id },
            data: { 
                certificado_cip_habilitado: false,
                certificado_ipg_habilitado: false,
                certificado_habilitado: false,
                certificado_cip_habilitado_en: null,
                certificado_ipg_habilitado_en: null
            }
        });
        console.log('Updated inscripcion:', upd.count);
    }
}
main().finally(() => prisma.$disconnect());
