import { PrismaClient, TipoEmision, EstadoCurso, NivelCurso, EstadoInscripcion, EstadoNota } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed del curso de 12 Módulos para prueba de Certificados...')

  // 1. Buscar profesor o admin existente
  let profesor = await prisma.usuario.findFirst({
    where: { rol: 'PROFESOR' }
  })

  if (!profesor) {
    profesor = await prisma.usuario.findFirst({
      where: { rol: 'ADMIN' }
    })
  }

  if (!profesor) {
    throw new Error('No se encontró ningún usuario (Profesor o Admin) para asignar el curso.')
  }

  // 2. Buscar o crear categoría
  const categoria = await prisma.categoria.upsert({
    where: { slug: 'seguridad-salud-trabajo' },
    update: {},
    create: {
      nombre: 'Seguridad y Salud en el Trabajo',
      slug: 'seguridad-salud-trabajo'
    }
  })

  // 3. Datos del curso
  const cursoData = {
    titulo: 'Diplomado de Especialización en Seguridad y Salud en el Trabajo (SST)',
    slug: 'diplomado-seguridad-salud-trabajo',
    descripcion: 'Programa integral avanzado para liderar la gestión preventiva y cumplir rigurosamente con la Ley N° 29783, reglamentos y modificatorias aplicables a empresas e instituciones públicas.',
    fecha_inicio: new Date(),
    duracion: '120 horas lectivas',
    tipo_emision: TipoEmision.ASINCRONO,
    nivel: NivelCurso.AVANZADO,
    estado: EstadoCurso.PUBLICADO,
    precio: 299,
    es_gratis: false,
    profesor_id: profesor.id,
    categoria_id: categoria.id,
    miniatura: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=800&q=80',
    objetivos: [
      'Entender los principios de la Ley N° 29783 y su aplicación práctica.',
      'Diseñar e implementar Matrices de Identificación de Peligros y Evaluación de Riesgos (IPERC).',
      'Organizar y estructurar el Comité de SST de manera eficiente.',
      'Auditar sistemas de gestión preventivos con enfoque en la mejora continua.'
    ],
    beneficios: [
      { title: 'Conformidad Legal', desc: 'Evita multas de Sunafil asegurando el 100% de cumplimiento.', icon: 'tabler-shield-check' },
      { title: 'Gestión Preventiva', desc: 'Aprende a formular planes anuales y mapas de riesgos.', icon: 'tabler-map-pin' },
      { title: 'Certificación Profesional', desc: 'Duplica tus oportunidades profesionales en el sector industrial.', icon: 'tabler-award' },
      { title: 'Talleres Prácticos', desc: 'Plantillas y casos de estudio reales descargables.', icon: 'tabler-file-text' }
    ],
    metodologia: [
      { title: 'Casos Reales', desc: 'Estudio y resolución de casos reales de fiscalización.', icon: 'tabler-briefcase' },
      { title: 'Taller IPERC', desc: 'Elaboración paso a paso de matrices IPERC de línea base.', icon: 'tabler-tools' }
    ],
    incluye: [
      { text: 'Certificado de Aprobación Oficial por 120 horas', active: true },
      { text: '12 Módulos especializados de contenido riguroso', active: true },
      { text: 'Plantillas de Planes Anuales y Reglamento Interno', active: true },
      { text: 'Acceso ilimitado al foro de consultas con expertos', active: true }
    ]
  }

  const curso = await prisma.curso.upsert({
    where: { slug: cursoData.slug },
    update: cursoData,
    create: cursoData
  })

  console.log(`Curso creado/actualizado: "${curso.titulo}"`)

  // 4. Módulos y Lecciones
  const estructuraTemario = [
    {
      titulo: 'LEY N° 29783 - PRINCIPIOS Y MODIFICATORIAS',
      lecciones: [
        'Introducción y principios de la Ley 29783',
        'Pirámide de KELSEN y jerarquía legal',
        'La Ley N° 29783 y su reglamento D.S. 005',
        'Resolución Ministerial 050 - 2013 TR',
        'Modificatoria Ley N° 30222 y D.S. 014'
      ]
    },
    {
      titulo: 'IMPLEMENTACION DE SISTEMA DE GESTION DE SST',
      lecciones: [
        'Círculo de la mejora continua (PHVA)',
        'Documentos del sistema de gestión de SST',
        'Círculo de la mejora continua aplicado a SST',
        'Línea base del sistema de gestión de SST'
      ]
    },
    {
      titulo: 'IPERC DE LINEA BASE',
      lecciones: [
        'Conceptos generales y definiciones de IPERC',
        'Jerarquía de controles operativos',
        'Criterios de elaboración de una matriz IPERC',
        'Diseño y elaboración del IPERC de línea base'
      ]
    },
    {
      titulo: 'COMITÉ DE SEGURIDAD Y SALUD EN EL TRABAJO',
      lecciones: [
        'Conceptos generales del Comité de SST',
        'Requisitos para ser miembro del CSST',
        'Proceso de elección de los representantes',
        'Documentos y actas obligatorias del CSST'
      ]
    },
    {
      titulo: 'PLAN Y PROGRAMA DE SST',
      lecciones: [
        'Normativa legal aplicable y conceptos básicos',
        'Elaboración del Plan Anual de Seguridad y Salud',
        'Elaboración del Programa Anual de SST',
        'Diseño de objetivos e indicadores de gestión',
        'Taller de diseño y estructura de un plan anual'
      ]
    },
    {
      titulo: 'SEGURIDAD BASADA EN EL COMPORTAMIENTO',
      lecciones: [
        'Conducta y comportamiento preventivo',
        'Teoría tricondicional de la conducta',
        'Implementación del programa SBC',
        'Observación y retroalimentación positiva'
      ]
    },
    {
      titulo: 'SUPERVISION TRABAJOS DE ALTO RIESGO',
      lecciones: [
        'Trabajos en altura y andamios',
        'Trabajos en caliente y soldadura',
        'Seguridad en espacios confinados',
        'Seguridad en izaje de cargas pesadas',
        'Permisos escritos de trabajo (PETAR)'
      ]
    },
    {
      titulo: 'AUDITORIAS EN SEGURIDAD Y SALUD EN EL TRABAJO',
      lecciones: [
        'Normativa legal aplicable a auditorías de SST',
        'Conceptos generales y tipos de auditoría',
        'Planificación de la auditoría en SST',
        'Ejecución de la auditoría y reporte final'
      ]
    },
    {
      titulo: 'REPORTE DE ACCIDENTES DE TRABAJO',
      lecciones: [
        'Normativa legal y definiciones de incidentes/accidentes',
        'Elaboración del informe preliminar de incidentes',
        'Flash report y reporte inmediato al Ministerio de Trabajo',
        'Metodología de investigación de accidentes (5 Porqués, Ishikawa)'
      ]
    },
    {
      titulo: 'INSPECCIONES DE TRABAJO POR PARTE DE SUNAFIL',
      lecciones: [
        'Ley general de inspección del trabajo',
        'Facultades del inspector de trabajo de Sunafil',
        'Inspecciones planeadas y no planeadas',
        'Protocolo de atención ante fiscalizaciones'
      ]
    },
    {
      titulo: 'SISTEMA DE GESTION AMBIENTAL ISO 14001',
      lecciones: [
        'Conceptos fundamentales de ISO 14001:2015',
        'Plan de gestión y manejo ambiental',
        'Identificación de aspectos e impactos ambientales',
        'Documentos y herramientas de gestión ambiental'
      ]
    },
    {
      titulo: 'SISTEMA DE GESTION DE LA CALIDAD ISO 9001',
      lecciones: [
        'Los 7 principios fundamentales de la calidad',
        'Estructura de alto nivel de ISO 9001:2015',
        'Control y aseguramiento de la calidad en procesos',
        'Indicadores de calidad y mejora continua'
      ]
    }
  ]

  const leccionesCreadasIds: string[] = []

  for (let i = 0; i < estructuraTemario.length; i++) {
    const modData = estructuraTemario[i]
    const modulo = await prisma.modulo.upsert({
      where: {
        curso_id_orden: {
          curso_id: curso.id,
          orden: i + 1
        }
      },
      update: {
        titulo: modData.titulo
      },
      create: {
        titulo: modData.titulo,
        orden: i + 1,
        curso_id: curso.id
      }
    })

    console.log(`Modulo [${modulo.orden}/12] creado: "${modulo.titulo}"`)

    for (let j = 0; j < modData.lecciones.length; j++) {
      const lecTitulo = modData.lecciones[j]
      const leccion = await prisma.leccion.upsert({
        where: {
          modulo_id_orden: {
            modulo_id: modulo.id,
            orden: j + 1
          }
        },
        update: {
          titulo: lecTitulo
        },
        create: {
          titulo: lecTitulo,
          orden: j + 1,
          modulo_id: modulo.id,
          duracion: 15
        }
      })
      leccionesCreadasIds.push(leccion.id)
    }
    console.log(`  └─ ${modData.lecciones.length} lecciones creadas exitosamente.`)
  }

  // 5. Inscribir y marcar curso como Completado para todos los usuarios Estudiante y Administradores
  const usuariosAInscribir = await prisma.usuario.findMany({
    where: {
      rol: {
        in: ['ESTUDIANTE', 'ADMIN']
      }
    }
  })

  console.log(`\nInscribiendo y marcando el curso como COMPLETADO para ${usuariosAInscribir.length} usuarios...`)

  for (const usuario of usuariosAInscribir) {
    try {
      // Upsert Inscripción
      await prisma.inscripcion.upsert({
        where: {
          usuario_id_curso_id: {
            usuario_id: usuario.id,
            curso_id: curso.id
          }
        },
        update: {
          estado: EstadoInscripcion.COMPLETADO,
          nota_final: 18.5,
          estado_nota: EstadoNota.APROBADO,
          certificado_habilitado: true,
          completado_en: new Date()
        },
        create: {
          usuario_id: usuario.id,
          curso_id: curso.id,
          estado: EstadoInscripcion.COMPLETADO,
          nota_final: 18.5,
          estado_nota: EstadoNota.APROBADO,
          certificado_habilitado: true,
          completado_en: new Date()
        }
      })

      // Upsert Progreso Curso al 100%
      await prisma.progresoCurso.upsert({
        where: {
          usuario_id_curso_id: {
            usuario_id: usuario.id,
            curso_id: curso.id
          }
        },
        update: {
          porcentaje_progreso: 100
        },
        create: {
          usuario_id: usuario.id,
          curso_id: curso.id,
          porcentaje_progreso: 100
        }
      })

      // Marcar todas las lecciones del temario como completadas
      for (const leccionId of leccionesCreadasIds) {
        await prisma.progresoLeccion.upsert({
          where: {
            usuario_id_leccion_id: {
              usuario_id: usuario.id,
              leccion_id: leccionId
            }
          },
          update: {
            esta_completado: true,
            completado_en: new Date()
          },
          create: {
            usuario_id: usuario.id,
            leccion_id: leccionId,
            esta_completado: true,
            completado_en: new Date()
          }
        })
      }

      console.log(`✅ Usuario ${usuario.nombre} ${usuario.apellido} (${usuario.rol}) completado al 100% y certificado habilitado.`)
    } catch (e: any) {
      console.error(`❌ Error al procesar inscripción para ${usuario.nombre}:`, e.message)
    }
  }

  console.log('\n🎉 Seed del Diplomado de SST completado exitosamente con progreso al 100% para todos los usuarios.')
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
