import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const usuario = await prisma.usuario.findUnique({ where: { correo: 'jose@gmail.com' } })
  if (!usuario) { console.log('❌ Usuario jose@gmail.com no encontrado'); return }

  const curso = await prisma.curso.findUnique({ where: { slug: 'curso-prueba-evaluaciones' } })
  if (!curso) { console.log('❌ Curso no encontrado'); return }

  await prisma.inscripcion.upsert({
    where: { usuario_id_curso_id: { usuario_id: usuario.id, curso_id: curso.id } },
    update: {},
    create: { usuario_id: usuario.id, curso_id: curso.id, estado: 'ACTIVO', certificado_habilitado: false },
  })

  console.log(`✅ ${usuario.correo} inscrito en "${curso.titulo}"`)
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
