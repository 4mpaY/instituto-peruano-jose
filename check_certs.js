const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.usuario.findUnique({ where: { correo: 'jose@gmail.com' } });
  const curso = await prisma.curso.findFirst({ where: { titulo: { contains: 'suelo' } } });
  
  if (!user || !curso) {
    console.log('not found');
    return;
  }
  
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { usuario_id_curso_id: { usuario_id: user.id, curso_id: curso.id } }
  });
  
  const certs = await prisma.certificado.findMany({
    where: { usuario_id: user.id, curso_id: curso.id }
  });
  
  console.log('Inscripcion:', inscripcion);
  console.log('Certs:', certs);
}

main().finally(() => prisma.$disconnect());
