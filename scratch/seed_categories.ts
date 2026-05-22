import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATEGORIA_NAMES = [
  'Tecnología', 'Desarrollo Web', 'Inteligencia Artificial', 'Ciberseguridad',
  'Marketing Digital', 'Diseño Gráfico', 'Fotografía', 'Negocios',
  'Finanzas Personales', 'Idiomas', 'Música', 'Cocina',
  'Salud y Bienestar', 'Deportes', 'Manualidades', 'Cine',
  'Arquitectura', 'Psicología', 'Derecho', 'Historia'
]

async function main() {
  console.log('Sembrando 20 categorías...')

  for (let i = 0; i < CATEGORIA_NAMES.length; i++) {
    const nombre = CATEGORIA_NAMES[i]
    const slug = nombre.toLowerCase().replace(/ /g, '-')

    await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: {
        nombre,
        slug,
        descripcion: `Descripción para la categoría ${nombre}`,
        orden: i
      }
    })
  }

  console.log('¡Categorías sembradas con éxito!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
