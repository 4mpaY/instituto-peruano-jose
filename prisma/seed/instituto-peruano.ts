import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed - Instituto Peruano...')

  // ─── PROFESOR ───────────────────────────────────────────────────────────────

  const profesor = await prisma.usuario.findFirst({
    where: { rol: 'PROFESOR' }
  })

  if (!profesor) {
    throw new Error('No existe un profesor en la base de datos. Ejecuta primero el seed principal.')
  }

  // ─── CATEGORÍA ──────────────────────────────────────────────────────────────

  const categoria = await prisma.categoria.upsert({
    where: { slug: 'calidad-seguridad-alimentaria' },
    update: {},
    create: {
      nombre: 'Calidad y Seguridad Alimentaria',
      slug: 'calidad-seguridad-alimentaria',
      descripcion: 'Cursos de sistemas de gestión de calidad, inocuidad alimentaria, HACCP, BPM y normativas aplicables',
      esta_activo: true,
      orden: 10
    }
  })

  console.log('✅ Categoría creada')

  // ─── CURSO ──────────────────────────────────────────────────────────────────

  await prisma.curso.upsert({
    where: { slug: 'gestion-calidad-seguridad-alimentaria-haccp-bpm-sop-ssop' },
    update: {},
    create: {
      titulo: 'Gestión de calidad y seguridad alimentaria, sistemas HACCP, BPM, SOP y SSOP',
      slug: 'gestion-calidad-seguridad-alimentaria-haccp-bpm-sop-ssop',
      descripcion:
        'Domina los sistemas de gestión de calidad e inocuidad alimentaria. Aprende a implementar HACCP, BPM, SOP y SSOP conforme a las normativas internacionales. Desarrolla habilidades para auditar, evaluar y mejorar continuamente los procesos en la industria alimentaria.',
      precio: 299.0,
      precio_falso: 399.0,
      moneda: 'PEN',
      nivel: 'INTERMEDIO',
      estado: 'PUBLICADO',
      tipo_emision: 'ASINCRONO',
      tipo: 'DIPLOMADO',
      duracion: '40 horas académicas',
      profesor_id: profesor.id,
      categoria_id: categoria.id,
      objetivos: [
        'Comprender los fundamentos de la calidad e inocuidad alimentaria',
        'Implementar sistemas BPM, SOP y SSOP en la industria alimentaria',
        'Diseñar y aplicar el sistema HACCP para el control de peligros',
        'Gestionar sistemas de seguridad alimentaria bajo la norma ISO 22000',
        'Realizar auditorías internas y externas de calidad',
        'Aplicar acciones correctivas y estrategias de mejora continua'
      ],
      beneficios: [
        'Certificado digital con código QR verificable',
        'Acceso de por vida al material',
        'Material descargable incluido',
        'Docentes con experiencia en la industria alimentaria',
        'Enfoque práctico con casos reales'
      ],
      metodologia: [
        'Clases grabadas con material audiovisual de alta calidad',
        'Lecturas complementarias y bibliografía especializada',
        'Casos prácticos y ejercicios de aplicación',
        'Evaluaciones por módulo para afianzar el aprendizaje'
      ],
      incluye: [
        'Acceso a todas las lecciones en video',
        'Material de lectura en PDF',
        'Certificado de finalización verificable',
        'Soporte de docentes'
      ],
      modulos: {
        create: [
          // ─── MÓDULO 1 ──────────────────────────────────────────────────────
          {
            titulo: 'Fundamentos de Calidad e Inocuidad Alimentaria',
            descripcion:
              'Introducción a los conceptos de calidad, sistemas de inocuidad y herramientas de gestión aplicadas a la industria alimentaria.',
            orden: 0,
            lecciones: {
              create: [
                {
                  titulo: 'Fundamentos de calidad y sistemas de inocuidad alimentaria – Parte 1',
                  contenido: `<p>En esta lección abordaremos los pilares fundamentales de la calidad en la industria alimentaria.</p>
<ul>
  <li>Conceptos básicos de calidad</li>
  <li>Herramientas y sistemas de calidad</li>
  <li>Cultura y gestión de la calidad</li>
</ul>`,
                  orden: 0,
                  duracion: 60,
                  es_vista_previa: true,
                  estado: 'PUBLICADO'
                },
                {
                  titulo: 'Fundamentos de calidad y sistemas de inocuidad alimentaria – Parte 2',
                  contenido: `<p>Continuamos con los sistemas de inocuidad y las herramientas clave para su gestión.</p>
<ul>
  <li>Fundamentos de HACCP</li>
  <li>Buenas Prácticas de Manufactura (BPM)</li>
  <li>Programas Operativos Estandarizados de Saneamiento (SSOP)</li>
</ul>`,
                  orden: 1,
                  duracion: 60,
                  estado: 'PUBLICADO'
                }
              ]
            }
          },

          // ─── MÓDULO 2 ──────────────────────────────────────────────────────
          {
            titulo: 'BPM y Programa de Higiene y Saneamiento (SOP y SSOP)',
            descripcion:
              'Diseño, implementación y verificación de programas de higiene y saneamiento en plantas de producción alimentaria.',
            orden: 1,
            lecciones: {
              create: [
                {
                  titulo: 'BPM y programa de higiene y saneamiento (SOP y SSOP) – Parte 1',
                  contenido: `<p>Conoce los requisitos normativos y el diseño de programas de saneamiento efectivos.</p>
<ul>
  <li>Requisitos clave y normativa aplicable</li>
  <li>Diseño y aplicación de SOP y SSOP</li>
  <li>Integración con HACCP</li>
</ul>`,
                  orden: 0,
                  duracion: 60,
                  estado: 'PUBLICADO'
                },
                {
                  titulo: 'BPM y programa de higiene y saneamiento (SOP y SSOP) – Parte 2',
                  contenido: `<p>Control de peligros y mantenimiento de los programas de higiene en operación.</p>
<ul>
  <li>Control de peligros físicos, químicos y biológicos</li>
  <li>Validación y verificación de SSOP</li>
  <li>Monitoreo y mantenimiento de programas de higiene</li>
</ul>`,
                  orden: 1,
                  duracion: 60,
                  estado: 'PUBLICADO'
                }
              ]
            }
          },

          // ─── MÓDULO 3 ──────────────────────────────────────────────────────
          {
            titulo: 'Sistema HACCP',
            descripcion:
              'Implementación del sistema de Análisis de Peligros y Puntos Críticos de Control (HACCP) en la industria alimentaria.',
            orden: 2,
            lecciones: {
              create: [
                {
                  titulo: 'Sistema HACCP',
                  contenido: `<p>Aprende a implementar el sistema HACCP desde sus fundamentos hasta la determinación de los puntos críticos de control.</p>
<ul>
  <li>Preparación para la implementación</li>
  <li>Identificación y análisis de peligros</li>
  <li>Determinación de PCC (Puntos Críticos de Control)</li>
</ul>`,
                  orden: 0,
                  duracion: 90,
                  estado: 'PUBLICADO'
                }
              ]
            }
          },

          // ─── MÓDULO 4 ──────────────────────────────────────────────────────
          {
            titulo: 'Seguridad Alimentaria',
            descripcion:
              'Gestión integral de la seguridad alimentaria bajo el marco de la norma ISO 22000 y la integración de sistemas.',
            orden: 3,
            lecciones: {
              create: [
                {
                  titulo: 'Seguridad Alimentaria',
                  contenido: `<p>Gestión integrada de la seguridad alimentaria con enfoque en la norma ISO 22000 y la documentación del sistema.</p>
<ul>
  <li>Introducción a ISO 22000</li>
  <li>Integración de BPM, HACCP, PHS, POE y POES</li>
  <li>Políticas, objetivos y documentación del SGIA</li>
</ul>`,
                  orden: 0,
                  duracion: 90,
                  estado: 'PUBLICADO'
                }
              ]
            }
          },

          // ─── MÓDULO 5 ──────────────────────────────────────────────────────
          {
            titulo: 'Auditoría, Evaluación y Mejora Continua',
            descripcion:
              'Principios y técnicas de auditoría de sistemas de calidad e inocuidad, acciones correctivas y estrategias de mejora.',
            orden: 4,
            lecciones: {
              create: [
                {
                  titulo: 'Auditoría, evaluación y mejora continua – Parte 1',
                  contenido: `<p>Fundamentos de la auditoría de sistemas de gestión de calidad e inocuidad alimentaria.</p>
<ul>
  <li>Principios y fundamentos de auditoría</li>
  <li>Inspecciones internas y externas</li>
  <li>Análisis de causa raíz</li>
</ul>`,
                  orden: 0,
                  duracion: 60,
                  estado: 'PUBLICADO'
                },
                {
                  titulo: 'Auditoría, evaluación y mejora continua – Parte 2',
                  contenido: `<p>Implementación de acciones correctivas, estrategias de mejora y aprendizaje de casos reales.</p>
<ul>
  <li>Acciones correctivas y preventivas (CAPA)</li>
  <li>Estrategias de mejora continua</li>
  <li>Casos reales y mejores prácticas</li>
</ul>`,
                  orden: 1,
                  duracion: 60,
                  estado: 'PUBLICADO'
                }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('✅ Curso creado: Gestión de calidad y seguridad alimentaria')
  console.log('')
  console.log('🎉 Seed Instituto Peruano completado!')
  console.log('')
  console.log('📚 Curso:')
  console.log('   Gestión de calidad y seguridad alimentaria, sistemas HACCP, BPM, SOP y SSOP')
  console.log('   5 módulos · 8 lecciones · 40 horas académicas')
}

main()
  .catch((e: any) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
