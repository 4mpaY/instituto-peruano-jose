import { PrismaClient, Rol, EstadoCurso, EstadoPedido } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando siembra de datos de prueba...')

  // 1. Obtener datos necesarios
  const profesor = await prisma.usuario.findFirst({
    where: { rol: Rol.PROFESOR }
  }) || await prisma.usuario.findFirst({
    where: { rol: Rol.ADMIN }
  })

  if (!profesor) {
    console.error('No se encontró ningún profesor o admin para asignar los cursos.')
    return
  }

  const estudiante = await prisma.usuario.findFirst({
    where: { rol: Rol.ESTUDIANTE }
  })

  if (!estudiante) {
    console.error('No se encontró ningún estudiante para asignar los pedidos.')
    return
  }

  const categorias = await prisma.categoria.findMany()
  if (categorias.length === 0) {
    console.error('No hay categorías. Ejecuta primero seed_categories.ts')
    return
  }

  // 2. Sembrar 20 Cursos
  console.log('Sembrando 20 cursos...')
  const cursos = []
  for (let i = 1; i <= 20; i++) {
    const titulo = `Curso de Prueba ${i}`
    const slug = `curso-de-prueba-${i}-${Math.random().toString(36).substring(7)}`
    const categoria = categorias[Math.floor(Math.random() * categorias.length)]
    
    const curso = await prisma.curso.create({
      data: {
        titulo,
        slug,
        descripcion: `Descripción detallada del curso de prueba número ${i}`,
        precio: 49.90 + i,
        estado: EstadoCurso.PUBLICADO,
        profesor_id: profesor.id,
        categoria_id: categoria.id,
        nivel: 'BASICO',
      }
    })
    cursos.push(curso)
  }

  // 3. Sembrar 20 Pedidos
  console.log('Sembrando 20 pedidos...')
  const usedCourseIds = new Set<string>()
  
  for (let i = 1; i <= 20; i++) {
    // Buscar un curso que el estudiante no tenga ya
    const availableCursos = cursos.filter(c => !usedCourseIds.has(c.id))
    
    if (availableCursos.length === 0) {
      console.log('No quedan más cursos únicos para asignar a este estudiante.')
      break
    }

    const cursoAleatorio = availableCursos[Math.floor(Math.random() * availableCursos.length)]
    usedCourseIds.add(cursoAleatorio.id)
    
    await prisma.pedido.create({
      data: {
        usuario_id: estudiante.id,
        total: cursoAleatorio.precio,
        estado: EstadoPedido.COMPLETADO,
        metodo_pago: 'IZIPAY',
        transaccion_id: `TX-${Date.now()}-${i}`,
        pagado_en: new Date(),
        detalles: {
          create: {
            curso_id: cursoAleatorio.id,
            precio_unitario: cursoAleatorio.precio,
            subtotal: cursoAleatorio.precio,
            total: cursoAleatorio.precio,
            cantidad: 1
          }
        },
        inscripciones: {
          create: {
            curso_id: cursoAleatorio.id,
            usuario_id: estudiante.id,
          }
        }
      }
    })
  }

  console.log('¡Siembra completada con éxito!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
