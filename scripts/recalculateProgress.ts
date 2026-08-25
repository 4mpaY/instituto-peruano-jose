import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Modo seguro: Si es true, SOLO imprime los resultados por consola y no guarda nada.
const IS_DRY_RUN = process.argv.includes('--apply') ? false : true

async function main() {
  console.log(`=========================================`)
  console.log(`  RECÁLCULO RETROACTIVO DE PROGRESO     `)
  console.log(`=========================================`)
  if (IS_DRY_RUN) {
    console.log(`⚠️ MODO DE PRUEBA ACTIVO (Dry Run)`)
    console.log(`Ningún cambio será guardado en la base de datos.`)
    console.log(`Para aplicar los cambios reales, ejecuta con el flag --apply`)
  } else {
    console.log(`🚨 MODO APLICAR (¡Escribiendo en BD!)`)
  }
  console.log(`=========================================\n`)

  // Obtener todos los cursos
  const cursos = await prisma.curso.findMany({
    select: { id: true, titulo: true }
  })

  let totalActualizados = 0

  for (const curso of cursos) {
    console.log(`>> Evaluando curso: "${curso.titulo}"`)
    
    // Contar exámenes publicados del curso
    const examenesPublicados = await prisma.examen.findMany({
      where: { curso_id: curso.id, esta_publicado: true },
      select: { id: true, puntaje_aprobacion: true }
    })
    const totalExamenes = examenesPublicados.length

    // Obtener todas las lecciones del curso para contar
    const leccionesDelCurso = await prisma.leccion.findMany({
      where: { modulo: { curso_id: curso.id } },
      select: { id: true }
    })
    const totalLecciones = leccionesDelCurso.length

    // Buscar a todos los alumnos inscritos
    const inscripciones = await prisma.inscripcion.findMany({
      where: { curso_id: curso.id, estado: 'ACTIVO' },
      select: { usuario_id: true, usuario: { select: { correo: true } } }
    })

    if (inscripciones.length === 0) {
      console.log(`   - Sin alumnos activos.\n`)
      continue
    }

    let actualizadosPorCurso = 0

    for (const inscripcion of inscripciones) {
      let nuevoPorcentaje = 0

      if (totalExamenes > 0) {
        // Cálculo basado en exámenes
        let aprobados = 0
        for (const ex of examenesPublicados) {
          const intentoAprobado = await prisma.intentoExamen.findFirst({
            where: {
              usuario_id: inscripcion.usuario_id,
              examen_id: ex.id,
              puntaje: { gte: ex.puntaje_aprobacion }
            }
          })
          if (intentoAprobado) aprobados++
        }
        nuevoPorcentaje = Math.round((aprobados / totalExamenes) * 100)
      } else {
        // Cálculo basado en lecciones
        if (totalLecciones > 0) {
          const completadas = await prisma.progresoLeccion.count({
            where: {
              usuario_id: inscripcion.usuario_id,
              esta_completado: true,
              leccion: { modulo: { curso_id: curso.id } }
            }
          })
          nuevoPorcentaje = Math.round((completadas / totalLecciones) * 100)
        } else {
          nuevoPorcentaje = 100 // Curso vacío = 100% (comportamiento legacy)
        }
      }

      // Consultar progreso actual para no sobreescribir si ya está bien
      const progresoActual = await prisma.progresoCurso.findUnique({
        where: { usuario_id_curso_id: { usuario_id: inscripcion.usuario_id, curso_id: curso.id } }
      })
      const porcentajeActual = progresoActual?.porcentaje_progreso ?? -1

      if (nuevoPorcentaje !== porcentajeActual) {
        console.log(`   * Usuario [${inscripcion.usuario.correo}]: Progreso cambia de ${porcentajeActual === -1 ? '(ninguno)' : porcentajeActual + '%'} a ${nuevoPorcentaje}%`)
        
        if (!IS_DRY_RUN) {
          await prisma.progresoCurso.upsert({
            where: { usuario_id_curso_id: { usuario_id: inscripcion.usuario_id, curso_id: curso.id } },
            update: { porcentaje_progreso: nuevoPorcentaje },
            create: { usuario_id: inscripcion.usuario_id, curso_id: curso.id, porcentaje_progreso: nuevoPorcentaje }
          })
        }
        actualizadosPorCurso++
        totalActualizados++
      }
    }
    
    if (actualizadosPorCurso === 0) {
      console.log(`   - Todos los alumnos están sincronizados.`)
    }
    console.log() // spacer
  }

  console.log(`=========================================`)
  console.log(`FIN. Total de registros ${IS_DRY_RUN ? 'a actualizar' : 'actualizados'}: ${totalActualizados}`)
  if (IS_DRY_RUN && totalActualizados > 0) {
    console.log(`Para guardar estos cambios, ejecuta: pnpm run recalculate-progress -- --apply`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
