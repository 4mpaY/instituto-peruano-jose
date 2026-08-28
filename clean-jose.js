const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    const correo = 'jose@gmail.com';
    const user = await prisma.usuario.findUnique({ where: { correo } });
    
    if (!user) {
        console.log("User not found");
        return;
    }

    console.log("Found user:", user.id);

    // Delete Certificados
    const certResult = await prisma.certificado.deleteMany({
        where: { usuario_id: user.id }
    });
    console.log("Deleted certificados:", certResult.count);

    // Reset Inscripciones
    const updateResult = await prisma.inscripcion.updateMany({
        where: { usuario_id: user.id },
        data: {
            certificado_habilitado: false,
            certificado_ipg_habilitado: false,
            certificado_cip_habilitado: false,
            certificado_ipg_habilitado_en: null,
            certificado_cip_habilitado_en: null
        }
    });
    console.log("Reset inscripciones:", updateResult.count);

    // Find Pedidos of type CERTIFICADO
    const pedidos = await prisma.pedido.findMany({
        where: {
            usuario_id: user.id,
            tipo: 'CERTIFICADO'
        },
        include: {
            detalles: true
        }
    });

    console.log("Found Pedidos to delete:", pedidos.length);

    for (const p of pedidos) {
        await prisma.detallePedido.deleteMany({
            where: { pedido_id: p.id }
        });
        await prisma.pedido.delete({
            where: { id: p.id }
        });
        console.log("Deleted pedido:", p.id);
    }
}

clean().catch(console.error).finally(() => prisma.$disconnect());
