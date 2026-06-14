import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creando curso de prueba con evaluaciones...')

  const profesor = await prisma.usuario.findFirst({ where: { rol: 'PROFESOR' } })
  if (!profesor) throw new Error('No hay profesor en la BD. Ejecuta primero el seed principal.')

  // Inscribir a este usuario si existe
  const estudiante = await prisma.usuario.findFirst({ where: { correo: 'flysoft.dev@gmail.com' } })

  // ─── CURSO ───────────────────────────────────────────────────────────────────

  const curso = await prisma.curso.upsert({
    where: { slug: 'curso-prueba-evaluaciones' },
    update: {},
    create: {
      titulo: 'Curso de Prueba — Evaluaciones',
      slug: 'curso-prueba-evaluaciones',
      descripcion: 'Curso pequeño creado para probar el flujo completo de evaluaciones: intermedia y final.',
      precio: 0,
      es_gratis: true,
      moneda: 'PEN',
      nivel: 'BASICO',
      estado: 'PUBLICADO',
      tipo_emision: 'ASINCRONO',
      duracion: '1 hora',
      profesor_id: profesor.id,
      modulos: {
        create: [
          {
            titulo: 'Módulo 1 — Introducción',
            orden: 1,
            lecciones: {
              create: [
                { titulo: 'Lección 1 — Bienvenida', orden: 1, duracion: 5, es_vista_previa: true },
                { titulo: 'Lección 2 — Conceptos básicos', orden: 2, duracion: 8 },
              ],
            },
          },
          {
            titulo: 'Módulo 2 — Desarrollo',
            orden: 2,
            lecciones: {
              create: [
                { titulo: 'Lección 3 — Aplicación práctica', orden: 1, duracion: 10 },
                { titulo: 'Lección 4 — Casos de uso', orden: 2, duracion: 10 },
              ],
            },
          },
        ],
      },
    },
    include: { modulos: true },
  })

  console.log(`✅ Curso creado: ${curso.titulo}`)

  const modulo1 = curso.modulos.find(m => m.orden === 1)!
  const modulo2 = curso.modulos.find(m => m.orden === 2)!

  // ─── EXAMEN INTERMEDIO (Módulo 1) ────────────────────────────────────────────

  const existeIntermedio = await prisma.examen.findFirst({
    where: { curso_id: curso.id, tipo: 'INTERMEDIO' },
  })

  if (!existeIntermedio) {
    const examIntermedio = await prisma.examen.create({
      data: {
        titulo: 'Evaluación del Módulo 1',
        tipo: 'INTERMEDIO',
        puntaje_aprobacion: 60,
        intentos_maximos: 3,
        progreso_minimo: 0,
        esta_publicado: true,
        curso_id: curso.id,
        modulo_id: modulo1.id,
        preguntas: {
          create: [
            {
              texto: '¿Cuál es el objetivo principal del módulo 1?',
              tipo: 'OPCION_MULTIPLE',
              puntos: 1,
              orden: 1,
              opciones: {
                create: [
                  { texto: 'Presentar los conceptos básicos', es_correcta: true, orden: 1 },
                  { texto: 'Desarrollar un proyecto completo', es_correcta: false, orden: 2 },
                  { texto: 'Realizar la evaluación final', es_correcta: false, orden: 3 },
                  { texto: 'Ninguna de las anteriores', es_correcta: false, orden: 4 },
                ],
              },
            },
            {
              texto: 'El módulo 1 incluye una lección de bienvenida.',
              tipo: 'VERDADERO_FALSO',
              puntos: 1,
              orden: 2,
              opciones: {
                create: [
                  { texto: 'Verdadero', es_correcta: true, orden: 1 },
                  { texto: 'Falso', es_correcta: false, orden: 2 },
                ],
              },
            },
            {
              texto: '¿Cuántas lecciones tiene el módulo 1?',
              tipo: 'OPCION_MULTIPLE',
              puntos: 1,
              orden: 3,
              opciones: {
                create: [
                  { texto: '1', es_correcta: false, orden: 1 },
                  { texto: '2', es_correcta: true, orden: 2 },
                  { texto: '3', es_correcta: false, orden: 3 },
                  { texto: '4', es_correcta: false, orden: 4 },
                ],
              },
            },
          ],
        },
      },
    })
    console.log(`✅ Examen intermedio creado: ${examIntermedio.titulo}`)
  } else {
    console.log('ℹ️  Examen intermedio ya existe, se omite.')
  }

  // ─── EXAMEN FINAL ─────────────────────────────────────────────────────────────

  const existeFinal = await prisma.examen.findFirst({
    where: { curso_id: curso.id, tipo: 'FINAL' },
  })

  if (!existeFinal) {
    const examFinal = await prisma.examen.create({
      data: {
        titulo: 'Examen Final',
        tipo: 'FINAL',
        puntaje_aprobacion: 60,
        intentos_maximos: 2,
        progreso_minimo: 80,
        esta_publicado: true,
        curso_id: curso.id,
        modulo_id: modulo2.id,
        preguntas: {
          create: [
            {
              texto: '¿Cuántos módulos tiene este curso?',
              tipo: 'OPCION_MULTIPLE',
              puntos: 1,
              orden: 1,
              opciones: {
                create: [
                  { texto: '1', es_correcta: false, orden: 1 },
                  { texto: '2', es_correcta: true, orden: 2 },
                  { texto: '3', es_correcta: false, orden: 3 },
                  { texto: '4', es_correcta: false, orden: 4 },
                ],
              },
            },
            {
              texto: 'El curso requiere un 80% de progreso para acceder al examen final.',
              tipo: 'VERDADERO_FALSO',
              puntos: 1,
              orden: 2,
              opciones: {
                create: [
                  { texto: 'Verdadero', es_correcta: true, orden: 1 },
                  { texto: 'Falso', es_correcta: false, orden: 2 },
                ],
              },
            },
            {
              texto: '¿Qué tipo de emisión tiene este curso?',
              tipo: 'OPCION_MULTIPLE',
              puntos: 1,
              orden: 3,
              opciones: {
                create: [
                  { texto: 'Síncrono', es_correcta: false, orden: 1 },
                  { texto: 'Asíncrono', es_correcta: true, orden: 2 },
                  { texto: 'Mixto', es_correcta: false, orden: 3 },
                  { texto: 'En vivo', es_correcta: false, orden: 4 },
                ],
              },
            },
            {
              texto: '¿El curso es gratuito?',
              tipo: 'VERDADERO_FALSO',
              puntos: 1,
              orden: 4,
              opciones: {
                create: [
                  { texto: 'Verdadero', es_correcta: true, orden: 1 },
                  { texto: 'Falso', es_correcta: false, orden: 2 },
                ],
              },
            },
            {
              texto: '¿Cuántos intentos máximos tiene el examen final?',
              tipo: 'OPCION_MULTIPLE',
              puntos: 1,
              orden: 5,
              opciones: {
                create: [
                  { texto: '1', es_correcta: false, orden: 1 },
                  { texto: '2', es_correcta: true, orden: 2 },
                  { texto: '3', es_correcta: false, orden: 3 },
                  { texto: 'Ilimitados', es_correcta: false, orden: 4 },
                ],
              },
            },
          ],
        },
      },
    })
    console.log(`✅ Examen final creado: ${examFinal.titulo}`)
  } else {
    console.log('ℹ️  Examen final ya existe, se omite.')
  }

  // ─── INSCRIPCIÓN ──────────────────────────────────────────────────────────────

  if (estudiante) {
    await prisma.inscripcion.upsert({
      where: { usuario_id_curso_id: { usuario_id: estudiante.id, curso_id: curso.id } },
      update: {},
      create: {
        usuario_id: estudiante.id,
        curso_id: curso.id,
        estado: 'ACTIVO',
        certificado_habilitado: false,
      },
    })
    console.log(`✅ ${estudiante.correo} inscrito en el curso`)
  } else {
    console.log('ℹ️  No se encontró flysoft.dev@gmail.com. Inscríbete manualmente desde el admin.')
  }

  console.log('')
  console.log('🎉 Listo!')
  console.log(`   Curso slug: curso-prueba-evaluaciones`)
  console.log(`   URL player: /estudiante/aprender/curso-prueba-evaluaciones`)
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
