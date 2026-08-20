import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Iniciando recálculo retroactivo de progreso ---')

  // Buscar todos los cursos que tienen al menos un examen publicado
  const cursosConExamenes = await prisma.curso.findMany({
    where: {
      examenes: {
        some: {
          esta_publicado: true
        }
      }
    },
    include: {
      examenes: {
        where: { esta_publicado: true }
      }
    }
  })

  console.log(`Encontrados ${cursosConExamenes.length} cursos con exámenes publicados.`)

  for (const curso of cursosConExamenes) {
    const totalExamenes = curso.examenes.length
    console.log(`\nProcesando curso: ${curso.titulo} (Total exámenes: ${totalExamenes})`)

    // Encontrar todos los progresos de este curso
    const progresos = await prisma.progresoCurso.findMany({
      where: { curso_id: curso.id },
      include: {
        usuario: true
      }
    })

    console.log(`> Evaluando ${progresos.length} estudiantes inscritos/con progreso.`)

    for (const progreso of progresos) {
      // Buscar intentos de examen del alumno para este curso
      const examenesAprobados = await prisma.examen.count({
        where: {
          curso_id: curso.id,
          esta_publicado: true,
          intentos: {
            some: {
              usuario_id: progreso.usuario_id,
              // Check if puntaje is >= puntaje_aprobacion. 
              // Wait, Prisma can't easily compare a field with another field in a relation directly without raw query or advanced syntax in some cases,
              // Let's just fetch the best attempt for each exam for this user.
            }
          }
        }
      })

      // We need a more precise count of approved exams for this user:
      let aprobados = 0;
      for (const examen of curso.examenes) {
        const mejorIntento = await prisma.intentoExamen.findFirst({
          where: {
            examen_id: examen.id,
            usuario_id: progreso.usuario_id
          },
          orderBy: {
            puntaje: 'desc'
          }
        });

        if (mejorIntento && mejorIntento.puntaje !== null && mejorIntento.puntaje >= examen.puntaje_aprobacion) {
          aprobados++;
        }
      }

      const nuevoPorcentaje = Math.round((aprobados / totalExamenes) * 100)

      if (progreso.porcentaje_progreso !== nuevoPorcentaje) {
        await prisma.progresoCurso.update({
          where: { id: progreso.id },
          data: { porcentaje_progreso: nuevoPorcentaje }
        })
        console.log(`  - Estudiante ${progreso.usuario.correo}: actualizado de ${progreso.porcentaje_progreso}% a ${nuevoPorcentaje}%`)
      }
    }
  }

  // Ahora procesar los cursos SIN exámenes para asegurar que su progreso esté basado estrictamente en lecciones
  const cursosSinExamenes = await prisma.curso.findMany({
    where: {
      examenes: {
        none: { esta_publicado: true }
      }
    }
  })

  console.log(`\nEncontrados ${cursosSinExamenes.length} cursos sin exámenes.`)

  for (const curso of cursosSinExamenes) {
    const totalLecciones = await prisma.leccion.count({
      where: { modulo: { curso_id: curso.id } }
    })

    const progresos = await prisma.progresoCurso.findMany({
      where: { curso_id: curso.id },
      include: { usuario: true }
    })

    for (const progreso of progresos) {
      let nuevoPorcentaje = 100
      
      if (totalLecciones > 0) {
        const leccionesCompletadas = await prisma.progresoLeccion.count({
          where: {
            usuario_id: progreso.usuario_id,
            esta_completado: true,
            leccion: { modulo: { curso_id: curso.id } }
          }
        })
        nuevoPorcentaje = Math.round((leccionesCompletadas / totalLecciones) * 100)
      }

      if (progreso.porcentaje_progreso !== nuevoPorcentaje) {
        await prisma.progresoCurso.update({
          where: { id: progreso.id },
          data: { porcentaje_progreso: nuevoPorcentaje }
        })
        console.log(`  - Estudiante ${progreso.usuario.correo}: actualizado de ${progreso.porcentaje_progreso}% a ${nuevoPorcentaje}% (Lecciones)`)
      }
    }
  }

  console.log('\n--- Recálculo retroactivo finalizado ---')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
