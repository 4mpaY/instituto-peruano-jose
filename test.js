const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRaw`
    UPDATE inscripciones
    SET certificado_ipg_habilitado = true,
        certificado_ipg_habilitado_en = NOW(),
        certificado_habilitado = true
    WHERE usuario_id = (SELECT id FROM usuarios WHERE correo = 'jose@gmail.com')
      AND curso_id = 'bb4db797-9541-458f-8d12-60d46dcc6a52'
  `;
  console.log('Fixed IPG');
}
main();
