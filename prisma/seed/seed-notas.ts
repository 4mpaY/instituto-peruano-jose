/**
 * Seed de prueba para el sistema de edición de notas.
 * Agrega 4 exámenes al curso de Costos y Presupuestos,
 * inscribe al alumno de prueba y crea intentos con notas variadas.
 *
 * Ejecutar: pnpm db:seed:notas
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const opciones = (correcta: number, textos: string[]) =>
  textos.map((texto, i) => ({ texto, es_correcta: i === correcta, orden: i }))

async function main() {
  console.log('🌱 Seed de notas iniciado...')

  // ── Usuarios requeridos ───────────────────────────────────────────────────
  const alumno = await prisma.usuario.findUnique({ where: { correo: 'alumno@gmail.com' } })

  if (!alumno) {
    throw new Error('❌ No existe alumno@gmail.com — ejecuta primero pnpm db:main:seed')
  }

  const curso = await prisma.curso.findUnique({ where: { slug: 'costos-presupuestos-obra-s10' } })

  if (!curso) {
    throw new Error('❌ No existe el curso "costos-presupuestos-obra-s10" — ejecuta primero pnpm db:main:seed')
  }

  console.log(`✅ Curso encontrado: ${curso.titulo}`)

  // ── Limpiar exámenes anteriores del seed (para poder re-ejecutar) ─────────
  await prisma.examen.deleteMany({
    where: {
      curso_id: curso.id,
      titulo: { startsWith: '[TEST]' }
    }
  })

  // ── Crear 4 exámenes con preguntas ────────────────────────────────────────
  const examenesData = [
    {
      titulo: '[TEST] Evaluación 01 — Fundamentos de Costos',
      peso: 25,
      preguntas: [
        {
          texto: '¿Qué representa el costo directo en un presupuesto de obra?',
          opciones: opciones(0, [
            'El costo de materiales, mano de obra y equipos directamente utilizados',
            'Los gastos administrativos de la empresa',
            'Las utilidades del contratista',
            'El IGV aplicado al presupuesto'
          ])
        },
        {
          texto: '¿Qué significa APU?',
          opciones: opciones(2, [
            'Administración de Proyectos Urbanos',
            'Actualización de Precios Unitarios',
            'Análisis de Precios Unitarios',
            'Asignación de Presupuesto Universal'
          ])
        },
        {
          texto: '¿Cuál es la unidad de medida típica para excavación de zanjas?',
          opciones: opciones(1, ['m²', 'm³', 'ml', 'und'])
        },
        {
          texto: '¿Qué incluye el costo indirecto de una obra?',
          opciones: opciones(3, [
            'Materiales de construcción',
            'Mano de obra calificada',
            'Alquiler de equipos pesados',
            'Gastos generales y utilidades'
          ])
        }
      ]
    },
    {
      titulo: '[TEST] Evaluación 02 — Metrados y Partidas',
      peso: 25,
      preguntas: [
        {
          texto: '¿Qué son los metrados en un proyecto de construcción?',
          opciones: opciones(1, [
            'El presupuesto total del proyecto',
            'La cuantificación de los trabajos a ejecutar por partidas',
            'Los planos de la obra',
            'El contrato de obra'
          ])
        },
        {
          texto: '¿Qué norma regula la elaboración de metrados en Perú?',
          opciones: opciones(2, ['NTE E.030', 'NTE E.060', 'NTE E.020', 'RNE Título V'])
        },
        {
          texto: '¿Cómo se calcula el volumen de concreto en columnas rectangulares?',
          opciones: opciones(0, [
            'Sección transversal × altura de la columna',
            'Perímetro × altura',
            'Área total × cantidad de estribos',
            'Peso del acero / densidad del concreto'
          ])
        },
        {
          texto: '¿Qué es una partida en un presupuesto de obra?',
          opciones: opciones(3, [
            'Un documento legal del contrato',
            'Un plano de detalle estructural',
            'Un reporte de avance diario',
            'Un trabajo específico con unidad de medida, metrado y precio unitario'
          ])
        }
      ]
    },
    {
      titulo: '[TEST] Evaluación 03 — S10 Presupuestos',
      peso: 25,
      preguntas: [
        {
          texto: '¿Para qué sirve el software S10 en obras de construcción?',
          opciones: opciones(0, [
            'Elaborar presupuestos y análisis de precios unitarios',
            'Diseñar estructuras en 3D',
            'Calcular análisis sísmico',
            'Dibujar planos de arquitectura'
          ])
        },
        {
          texto: '¿Qué se ingresa primero al crear un proyecto en S10?',
          opciones: opciones(2, [
            'Los subcontratos',
            'La fórmula polinómica',
            'Los datos generales del proyecto (nombre, fecha, moneda)',
            'Los recursos de mano de obra'
          ])
        },
        {
          texto: '¿Qué es un recurso en S10?',
          opciones: opciones(1, [
            'Un plano de detalle',
            'Material, mano de obra o equipo usado en las partidas',
            'Un proveedor de materiales',
            'Un subcontratista'
          ])
        },
        {
          texto: '¿Cómo se actualiza el precio de un recurso en S10 para todos los APU al mismo tiempo?',
          opciones: opciones(3, [
            'Editando cada APU manualmente',
            'Reimportando el proyecto desde cero',
            'Usando el módulo de cronograma',
            'Actualizando el precio en la base de recursos del proyecto'
          ])
        }
      ]
    },
    {
      titulo: '[TEST] Evaluación 04 — MS Project y Control',
      peso: 25,
      preguntas: [
        {
          texto: '¿Qué representa la ruta crítica en MS Project?',
          opciones: opciones(0, [
            'La secuencia de actividades que determina la duración mínima del proyecto',
            'Las actividades con mayor holgura',
            'El presupuesto más alto del proyecto',
            'Las actividades completadas a la fecha'
          ])
        },
        {
          texto: '¿Qué muestra la curva S en el control de una obra?',
          opciones: opciones(2, [
            'El número de trabajadores por semana',
            'Los precios unitarios históricos',
            'El avance planificado vs. real acumulado en el tiempo',
            'La forma física de la obra'
          ])
        },
        {
          texto: '¿Cuándo se genera una ampliación de plazo en un contrato de obra?',
          opciones: opciones(1, [
            'Cuando el contratista trabaja más lento',
            'Cuando ocurren causas no atribuibles al contratista que afectan la ruta crítica',
            'Cuando se termina el presupuesto',
            'Cuando llueve más de 2 días seguidos'
          ])
        },
        {
          texto: '¿Qué es el EVM (Earned Value Management)?',
          opciones: opciones(3, [
            'Un tipo de contrato de obra',
            'Un software de diseño estructural',
            'Un método de valorización mensual',
            'Una metodología para medir el desempeño de costo y plazo de un proyecto'
          ])
        }
      ]
    }
  ]

  const examenesCreados: { id: string; titulo: string; peso: number }[] = []

  for (const examenData of examenesData) {
    const examen = await prisma.examen.create({
      data: {
        titulo: examenData.titulo,
        tipo: 'INTERMEDIO',
        peso: examenData.peso,
        puntaje_aprobacion: 60,
        intentos_maximos: 3,
        esta_publicado: true,
        curso_id: curso.id,
        preguntas: {
          create: examenData.preguntas.map((p, orden) => ({
            texto: p.texto,
            tipo: 'OPCION_MULTIPLE',
            orden,
            opciones: { create: p.opciones }
          }))
        }
      }
    })

    examenesCreados.push({ id: examen.id, titulo: examen.titulo, peso: examen.peso })
    console.log(`  ✅ Examen creado: ${examen.titulo}`)
  }

  // ── Inscripción del alumno ────────────────────────────────────────────────
  const inscripcion = await prisma.inscripcion.upsert({
    where: { usuario_id_curso_id: { usuario_id: alumno.id, curso_id: curso.id } },
    update: {},
    create: {
      usuario_id: alumno.id,
      curso_id: curso.id,
      estado: 'ACTIVO'
    }
  })

  await prisma.progresoCurso.upsert({
    where: { usuario_id_curso_id: { usuario_id: alumno.id, curso_id: curso.id } },
    update: {},
    create: { usuario_id: alumno.id, curso_id: curso.id, porcentaje_progreso: 75 }
  })

  console.log(`✅ Alumno inscrito (inscripcion_id: ${inscripcion.id})`)

  // ── Crear intentos de examen con notas variadas ───────────────────────────
  // Notas en escala vigesimal (se convierten a % para almacenar)
  const notasVigesimales = [16, 14, 18, 12] // N1=16, N2=14, N3=18, N4=12

  let sumaPonderada = 0
  let pesoTotal = 0

  for (let i = 0; i < examenesCreados.length; i++) {
    const examen = examenesCreados[i]
    const notaVigesimal = notasVigesimales[i]
    const puntajePorcentaje = notaVigesimal * 5 // convertir 0-20 → 0-100
    const aprobado = puntajePorcentaje >= 60

    // Eliminar intentos anteriores del seed para este alumno+examen
    await prisma.intentoExamen.deleteMany({
      where: { usuario_id: alumno.id, examen_id: examen.id }
    })

    await prisma.intentoExamen.create({
      data: {
        usuario_id: alumno.id,
        examen_id: examen.id,
        puntaje: puntajePorcentaje,
        esta_aprobado: aprobado,
        enviado_en: new Date()
      }
    })

    sumaPonderada += puntajePorcentaje * examen.peso
    pesoTotal += examen.peso

    console.log(`  📝 N${i + 1}: ${notaVigesimal}/20 (${puntajePorcentaje}%) — ${aprobado ? 'APROBADO' : 'DESAPROBADO'}`)
  }

  // ── Actualizar nota_final en la inscripción ───────────────────────────────
  const notaFinalPorcentaje = pesoTotal > 0 ? sumaPonderada / pesoTotal : 0
  const estadoNota = notaFinalPorcentaje >= 60 ? 'APROBADO' : 'DESAPROBADO'

  await prisma.inscripcion.update({
    where: { id: inscripcion.id },
    data: { nota_final: notaFinalPorcentaje, estado_nota: estadoNota }
  })

  const promedioVigesimal = (notaFinalPorcentaje * 0.2).toFixed(1)

  console.log('')
  console.log('✅ Seed de notas completado!')
  console.log('')
  console.log('📊 Resumen del alumno de prueba:')
  console.log(`   Alumno:   alumno@gmail.com / Alumno123@`)
  console.log(`   Curso:    ${curso.titulo}`)
  console.log(`   N1: ${notasVigesimales[0]}/20  N2: ${notasVigesimales[1]}/20  N3: ${notasVigesimales[2]}/20  N4: ${notasVigesimales[3]}/20`)
  console.log(`   Promedio: ${promedioVigesimal}/20 — ${estadoNota}`)
  console.log('')
  console.log('👉 Ve a Admin → Cursos → "Elaboración de Costos..." → ícono de personas')
  console.log('   Ahí verás el ícono de lápiz azul en la columna Acciones para editar notas.')
}

main()
  .catch((e: any) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
