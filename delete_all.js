const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const u = await prisma.usuario.findFirst({where:{correo:'jose@gmail.com'}});
    const c = await prisma.curso.findFirst({where:{slug:{contains: 'ind2'}}});
    
    if (u && c) {
        // Delete certificates
        const delCerts = await prisma.certificado.deleteMany({
            where: { usuario_id: u.id, curso_id: c.id }
        });
        console.log('Deleted certificates:', delCerts.count);

        // Find certificate orders
        const pedidos = await prisma.pedido.findMany({
            where: {
                usuario_id: u.id,
                detalles: { some: { curso_id: c.id } },
                OR: [
                    { tipo: 'CERTIFICADO' },
                    { detalles: { some: { certificado_tipo: { not: null } } } }
                ]
            },
            select: { id: true }
        });

        const pedidoIds = pedidos.map(p => p.id);
        
        if (pedidoIds.length > 0) {
            // Delete order details
            const delDetalles = await prisma.detallePedido.deleteMany({
                where: { pedido_id: { in: pedidoIds } }
            });
            console.log('Deleted order details:', delDetalles.count);
            
            // Delete orders
            const delPedidos = await prisma.pedido.deleteMany({
                where: { id: { in: pedidoIds } }
            });
            console.log('Deleted orders:', delPedidos.count);
        } else {
            console.log('No orders to delete.');
        }
    } else {
        console.log('User or Course not found');
    }
}
main().finally(() => prisma.$disconnect());
