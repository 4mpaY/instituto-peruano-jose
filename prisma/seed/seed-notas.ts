/**
 * Seed de prueba para el sistema de edición de notas.
 * Agrega 4 exámenes al curso de Marketing Digital,
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
    throw new Error('❌ No existe alumno@gmail.com — ejecuta primero pnpm db:seed')
  }

  const curso = await prisma.curso.findUnique({ where: { slug: 'marketing-digital-redes-sociales' } })

  if (!curso) {
    throw new Error('❌ No existe el curso "marketing-digital-redes-sociales" — ejecuta primero pnpm db:seed')
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
      titulo: '[TEST] Evaluación 01 — Fundamentos del Marketing Digital',
      peso: 25,
      preguntas: [
        {
          texto: '¿Qué es el marketing digital?',
          opciones: opciones(2, [
            'La distribución física de productos en tiendas',
            'La publicidad impresa en medios tradicionales',
            'El conjunto de estrategias de marketing aplicadas en canales digitales e internet',
            'El diseño gráfico de logotipos y marcas'
          ])
        },
        {
          texto: '¿Qué representa el embudo de ventas (funnel) en marketing digital?',
          opciones: opciones(0, [
            'El recorrido del cliente desde el conocimiento de la marca hasta la compra',
            'Una herramienta para filtrar correos no deseados',
            'El proceso de diseño de una página web',
            'La gestión del inventario en un e-commerce'
          ])
        },
        {
          texto: '¿Cuál es el objetivo principal del SEO?',
          opciones: opciones(3, [
            'Enviar correos masivos a clientes potenciales',
            'Crear anuncios pagados en Google',
            'Gestionar perfiles en redes sociales',
            'Mejorar el posicionamiento orgánico de un sitio web en motores de búsqueda'
          ])
        },
        {
          texto: '¿Qué es el KPI en marketing digital?',
          opciones: opciones(1, [
            'Un tipo de anuncio en redes sociales',
            'Un indicador clave de rendimiento que mide el éxito de una estrategia',
            'Una plataforma de gestión de contenidos',
            'Un formato de archivo para imágenes digitales'
          ])
        }
      ]
    },
    {
      titulo: '[TEST] Evaluación 02 — Redes Sociales y Contenido',
      peso: 25,
      preguntas: [
        {
          texto: '¿Qué es el engagement en redes sociales?',
          opciones: opciones(0, [
            'El nivel de interacción (likes, comentarios, compartidos) que genera una publicación',
            'El número total de seguidores de una cuenta',
            'El presupuesto invertido en publicidad',
            'La frecuencia de publicación en una red social'
          ])
        },
        {
          texto: '¿Cuál es la principal ventaja del marketing de contenidos?',
          opciones: opciones(2, [
            'Genera resultados inmediatos en ventas',
            'No requiere ningún tipo de inversión',
            'Atrae y fideliza audiencias aportando valor, generando confianza a largo plazo',
            'Permite impactar únicamente a usuarios jóvenes'
          ])
        },
        {
          texto: '¿Qué es un buyer persona?',
          opciones: opciones(3, [
            'Un influencer contratado para promocionar una marca',
            'Un bot automatizado para responder mensajes',
            'El equipo de ventas de una empresa',
            'Una representación semi-ficticia del cliente ideal basada en datos reales'
          ])
        },
        {
          texto: '¿Qué métrica mide el alcance de una publicación en redes sociales?',
          opciones: opciones(1, [
            'CTR (Click Through Rate)',
            'Reach o Alcance — número de usuarios únicos que vieron el contenido',
            'ROI (Return on Investment)',
            'CPC (Costo por Clic)'
          ])
        }
      ]
    },
    {
      titulo: '[TEST] Evaluación 03 — Publicidad Digital (Facebook & Google Ads)',
      peso: 25,
      preguntas: [
        {
          texto: '¿Qué es el CPC en publicidad digital?',
          opciones: opciones(0, [
            'El costo que paga el anunciante cada vez que un usuario hace clic en su anuncio',
            'El número de veces que se muestra un anuncio',
            'El porcentaje de usuarios que compran tras ver un anuncio',
            'El total de impresiones de una campaña'
          ])
        },
        {
          texto: '¿Cuál es la principal diferencia entre Facebook Ads y Google Ads?',
          opciones: opciones(2, [
            'Google Ads es gratuito y Facebook Ads es de pago',
            'Facebook Ads solo funciona en móviles',
            'Google Ads capta demanda existente (intención de búsqueda); Facebook Ads genera demanda mediante segmentación de audiencias',
            'Ambas plataformas funcionan de forma idéntica'
          ])
        },
        {
          texto: '¿Qué es el Pixel de Facebook?',
          opciones: opciones(3, [
            'Una unidad de medida de resolución de imágenes',
            'Un formato de anuncio en Instagram',
            'El tamaño mínimo de una foto en Facebook',
            'Un fragmento de código que rastrea las acciones de los usuarios en un sitio web para optimizar anuncios'
          ])
        },
        {
          texto: '¿Qué indica un CTR alto en una campaña de anuncios?',
          opciones: opciones(1, [
            'Que el anuncio tiene un costo elevado',
            'Que una alta proporción de usuarios que ven el anuncio hacen clic en él',
            'Que la campaña ha gastado todo su presupuesto',
            'Que el anuncio no está llegando a la audiencia correcta'
          ])
        }
      ]
    },
    {
      titulo: '[TEST] Evaluación 04 — Analítica y Métricas Digitales',
      peso: 25,
      preguntas: [
        {
          texto: '¿Para qué sirve Google Analytics?',
          opciones: opciones(0, [
            'Medir y analizar el comportamiento de los visitantes de un sitio web',
            'Crear anuncios pagados en buscadores',
            'Diseñar páginas de aterrizaje (landing pages)',
            'Gestionar campañas de email marketing'
          ])
        },
        {
          texto: '¿Qué es la tasa de conversión?',
          opciones: opciones(2, [
            'El porcentaje de usuarios que abandonan el sitio web',
            'El número de visitas totales de una página',
            'El porcentaje de visitantes que realizan la acción deseada (compra, registro, etc.)',
            'El costo total de una campaña publicitaria'
          ])
        },
        {
          texto: '¿Qué es el ROI en marketing digital?',
          opciones: opciones(3, [
            'Un tipo de anuncio en display',
            'La cantidad de clics en un enlace',
            'El número de nuevos seguidores obtenidos',
            'El retorno sobre la inversión: ganancia neta generada respecto al costo de la campaña'
          ])
        },
        {
          texto: '¿Qué es un A/B test en marketing digital?',
          opciones: opciones(1, [
            'Una técnica de diseño gráfico para comparar colores',
            'Un experimento que compara dos versiones de un elemento (anuncio, landing, email) para determinar cuál tiene mejor rendimiento',
            'Una prueba de velocidad de carga de una página web',
            'Un método para auditar cuentas de redes sociales'
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
  console.log(`   Alumno:   alumno@gmail.com / Alumno123!`)
  console.log(`   Curso:    ${curso.titulo}`)
  console.log(`   N1: ${notasVigesimales[0]}/20  N2: ${notasVigesimales[1]}/20  N3: ${notasVigesimales[2]}/20  N4: ${notasVigesimales[3]}/20`)
  console.log(`   Promedio: ${promedioVigesimal}/20 — ${estadoNota}`)
  console.log('')
  console.log('👉 Ve a Admin → Cursos → "Marketing Digital..." → ícono de personas')
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
