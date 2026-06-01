import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── USUARIOS ────────────────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash('Admin123@', 10)

  await prisma.usuario.upsert({
    where: { correo: 'admin@gmail.com' },
    update: {},
    create: {
      correo: 'admin@gmail.com',
      contrasena: adminPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      numero_documento: '00000001',
      celular: '900000001',
      rol: Rol.ADMIN,
      esta_activo: true
    }
  })

  const profesorPassword = await bcrypt.hash('Profesor123!', 10)

  const profesor = await prisma.usuario.upsert({
    where: { correo: 'profesor@gmail.com' },
    update: {},
    create: {
      correo: 'profesor@gmail.com',
      contrasena: profesorPassword,
      nombre: 'Juan',
      apellido: 'García',
      numero_documento: '00000002',
      celular: '900000002',
      rol: Rol.PROFESOR,
      esta_activo: true
    }
  })

  const alumnoPassword = await bcrypt.hash('Alumno123!', 10)

  await prisma.usuario.upsert({
    where: { correo: 'alumno@gmail.com' },
    update: {},
    create: {
      correo: 'alumno@gmail.com',
      contrasena: alumnoPassword,
      nombre: 'María',
      apellido: 'López',
      numero_documento: '00000003',
      celular: '900000003',
      rol: Rol.ESTUDIANTE,
      esta_activo: true
    }
  })

  console.log('✅ Usuarios creados')

  // ─── CATEGORÍAS ──────────────────────────────────────────────────────────────

  const catProgramacion = await prisma.categoria.upsert({
    where: { slug: 'programacion' },
    update: {},
    create: {
      nombre: 'Programación',
      slug: 'programacion',
      descripcion: 'Cursos de desarrollo de software y programación',
      esta_activo: true,
      orden: 1
    }
  })

  const catMarketing = await prisma.categoria.upsert({
    where: { slug: 'marketing-digital' },
    update: {},
    create: {
      nombre: 'Marketing Digital',
      slug: 'marketing-digital',
      descripcion: 'Cursos de marketing, redes sociales y publicidad digital',
      esta_activo: true,
      orden: 2
    }
  })

  const catDiseno = await prisma.categoria.upsert({
    where: { slug: 'diseno' },
    update: {},
    create: {
      nombre: 'Diseño',
      slug: 'diseno',
      descripcion: 'Cursos de diseño gráfico, UX/UI y multimedia',
      esta_activo: true,
      orden: 3
    }
  })

  console.log('✅ Categorías creadas')

  // ─── CURSOS ──────────────────────────────────────────────────────────────────

  await prisma.curso.upsert({
    where: { slug: 'introduccion-programacion-python' },
    update: {},
    create: {
      titulo: 'Introducción a la Programación con Python',
      slug: 'introduccion-programacion-python',
      descripcion: 'Aprende los fundamentos de la programación usando Python desde cero.',
      precio: 99.00,
      precio_falso: 149.00,
      moneda: 'PEN',
      nivel: 'BASICO',
      estado: 'PUBLICADO',
      tipo_emision: 'ASINCRONO',
      duracion: '20 horas',
      profesor_id: profesor.id,
      categoria_id: catProgramacion.id,
      objetivos: ['Entender la lógica de programación', 'Escribir scripts en Python', 'Crear proyectos básicos'],
      beneficios: ['Acceso de por vida', 'Certificado al completar', 'Material descargable'],
      modulos: {
        create: [
          {
            titulo: 'Fundamentos de Python',
            orden: 0,
            lecciones: {
              create: [
                {
                  titulo: 'Instalación y configuración del entorno',
                  orden: 0,
                  duracion: 15,
                  video_url: 'https://www.youtube.com/watch?v=example1',
                  es_vista_previa: true
                },
                {
                  titulo: 'Variables y tipos de datos',
                  orden: 1,
                  duracion: 20,
                  video_url: 'https://www.youtube.com/watch?v=example2'
                },
                {
                  titulo: 'Estructuras de control',
                  orden: 2,
                  duracion: 25,
                  video_url: 'https://www.youtube.com/watch?v=example3'
                }
              ]
            }
          },
          {
            titulo: 'Funciones y Módulos',
            orden: 1,
            lecciones: {
              create: [
                {
                  titulo: 'Definición de funciones',
                  orden: 0,
                  duracion: 20,
                  video_url: 'https://www.youtube.com/watch?v=example4'
                },
                {
                  titulo: 'Importando módulos',
                  orden: 1,
                  duracion: 15,
                  video_url: 'https://www.youtube.com/watch?v=example5'
                }
              ]
            }
          }
        ]
      }
    }
  })

  await prisma.curso.upsert({
    where: { slug: 'marketing-digital-redes-sociales' },
    update: {},
    create: {
      titulo: 'Marketing Digital y Redes Sociales',
      slug: 'marketing-digital-redes-sociales',
      descripcion: 'Domina las estrategias de marketing digital para hacer crecer tu negocio.',
      precio: 149.00,
      precio_falso: 199.00,
      moneda: 'PEN',
      nivel: 'INTERMEDIO',
      estado: 'PUBLICADO',
      tipo_emision: 'ASINCRONO',
      duracion: '30 horas',
      profesor_id: profesor.id,
      categoria_id: catMarketing.id,
      objetivos: ['Crear estrategias de contenido', 'Gestionar campañas de ads', 'Analizar métricas'],
      beneficios: ['Acceso de por vida', 'Certificado al completar', 'Plantillas incluidas'],
      modulos: {
        create: [
          {
            titulo: 'Fundamentos del Marketing Digital',
            orden: 0,
            lecciones: {
              create: [
                {
                  titulo: 'Introducción al marketing digital',
                  orden: 0,
                  duracion: 20,
                  video_url: 'https://www.youtube.com/watch?v=example6',
                  es_vista_previa: true
                },
                {
                  titulo: 'El embudo de ventas',
                  orden: 1,
                  duracion: 25,
                  video_url: 'https://www.youtube.com/watch?v=example7'
                }
              ]
            }
          },
          {
            titulo: 'Redes Sociales',
            orden: 1,
            lecciones: {
              create: [
                {
                  titulo: 'Estrategia en Instagram',
                  orden: 0,
                  duracion: 30,
                  video_url: 'https://www.youtube.com/watch?v=example8'
                },
                {
                  titulo: 'Facebook Ads desde cero',
                  orden: 1,
                  duracion: 35,
                  video_url: 'https://www.youtube.com/watch?v=example9'
                }
              ]
            }
          }
        ]
      }
    }
  })

  await prisma.curso.upsert({
    where: { slug: 'diseno-ux-ui-figma' },
    update: {},
    create: {
      titulo: 'Diseño UX/UI con Figma',
      slug: 'diseno-ux-ui-figma',
      descripcion: 'Aprende a diseñar interfaces profesionales y experiencias de usuario con Figma.',
      precio: 129.00,
      precio_falso: 179.00,
      moneda: 'PEN',
      nivel: 'BASICO',
      estado: 'PUBLICADO',
      tipo_emision: 'ASINCRONO',
      duracion: '25 horas',
      profesor_id: profesor.id,
      categoria_id: catDiseno.id,
      objetivos: ['Dominar Figma', 'Crear wireframes y prototipos', 'Aplicar principios UX'],
      beneficios: ['Acceso de por vida', 'Certificado al completar', 'Proyectos prácticos'],
      modulos: {
        create: [
          {
            titulo: 'Introducción a Figma',
            orden: 0,
            lecciones: {
              create: [
                {
                  titulo: 'Interfaz y herramientas básicas',
                  orden: 0,
                  duracion: 20,
                  video_url: 'https://www.youtube.com/watch?v=example10',
                  es_vista_previa: true
                },
                {
                  titulo: 'Componentes y Auto Layout',
                  orden: 1,
                  duracion: 25,
                  video_url: 'https://www.youtube.com/watch?v=example11'
                }
              ]
            }
          },
          {
            titulo: 'Principios UX',
            orden: 1,
            lecciones: {
              create: [
                {
                  titulo: 'Investigación de usuarios',
                  orden: 0,
                  duracion: 30,
                  video_url: 'https://www.youtube.com/watch?v=example12'
                },
                {
                  titulo: 'Wireframes y prototipado',
                  orden: 1,
                  duracion: 35,
                  video_url: 'https://www.youtube.com/watch?v=example13'
                }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('✅ Cursos creados')

  // ─── CUPONES ─────────────────────────────────────────────────────────────────

  await prisma.cupon.upsert({
    where: { codigo: 'BIENVENIDO20' },
    update: {},
    create: {
      codigo: 'BIENVENIDO20',
      valor: 20,
      tipo: 'PORCENTAJE',
      limite_uso: 100,
      esta_activo: true,
      fecha_expiracion: new Date('2027-12-31')
    }
  })

  await prisma.cupon.upsert({
    where: { codigo: 'DESCUENTO50' },
    update: {},
    create: {
      codigo: 'DESCUENTO50',
      valor: 50,
      tipo: 'MONTO_FIJO',
      limite_uso: 50,
      esta_activo: true,
      fecha_expiracion: new Date('2027-12-31')
    }
  })

  console.log('✅ Cupones creados')

  // ─── RESUMEN ─────────────────────────────────────────────────────────────────

  console.log('')
  console.log('🎉 Seed completado!')
  console.log('')
  console.log('📋 Credenciales:')
  console.log('   Admin:    admin@gmail.com     / Admin123@')
  console.log('   Profesor: profesor@gmail.com  / Profesor123!')
  console.log('   Alumno:   alumno@gmail.com    / Alumno123!')
  console.log('')
  console.log('🎟️  Cupones:')
  console.log('   BIENVENIDO20 → 20% descuento')
  console.log('   DESCUENTO50  → S/. 50 de descuento')
}

main()
  .catch((e: any) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
