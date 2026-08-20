const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const c = await prisma.curso.findMany({select:{id:true, titulo:true, slug:true, precio_certificado_ipg:true, precio_certificado_cip:true, precio_certificado:true}});
    console.log(c.map(x => `${x.titulo} -> ${x.slug} (IPG:${x.precio_certificado_ipg}, CIP:${x.precio_certificado_cip}, Gen:${x.precio_certificado})`).join('\n'));
}
main().finally(() => prisma.$disconnect());
