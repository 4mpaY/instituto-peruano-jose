const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const u = await prisma.usuario.findFirst({where:{correo:'jose@gmail.com'}});
    const c = await prisma.curso.findFirst({where:{slug:{contains: 'ind2'}}});
    console.log('User:', u?.id, 'Course:', c?.id);

    const pedidosCertCompletados = await prisma.$queryRaw`
        SELECT p.fecha_entrega_estimada, d.certificado_tipo::text AS certificado_tipo, p.creado_en, p.pagado_en
        FROM pedidos p
        JOIN detalles_pedido d ON d.pedido_id = p.id
        WHERE p.usuario_id = ${u.id}
          AND p.estado = 'COMPLETADO'
          AND d.curso_id = ${c.id}
          AND (p.tipo = 'CERTIFICADO'::"TipoPedido" OR d.certificado_tipo IS NOT NULL)
        ORDER BY p.creado_en DESC
    `;
    console.log('pedidosCertCompletados:', pedidosCertCompletados);
    
    console.log('cipEntregas from curso:', JSON.stringify(c.certificado_cip_entregas, null, 2));

    const inscripcionHab = await prisma.inscripcion.findUnique({
        where: { usuario_id_curso_id: { usuario_id: u.id, curso_id: c.id } },
        select: { certificado_cip_habilitado_en: true }
    });
    console.log('inscripcionHab:', inscripcionHab);
}
main().finally(() => prisma.$disconnect());
