import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const curso = await prisma.curso.findUnique({ where: { slug: 'curso-prueba-evaluaciones' } })
  if (!curso) { console.log('❌ Curso no encontrado'); return }

  const ahora = new Date()
  const fin = new Date('2027-12-31T23:59:59Z')

  const result = await prisma.examen.updateMany({
    where: { curso_id: curso.id },
    data: { fecha_inicio: ahora, fecha_fin: fin },
  })

  console.log(`✅ ${result.count} examen(es) actualizados con fechas: ${ahora.toLocaleDateString()} → 31/12/2027`)
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
