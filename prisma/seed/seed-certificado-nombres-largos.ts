import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const CURSO_SLUG = 'curso-certificado-nombres-largos'
const ESTUDIANTE_CORREO = 'certificado.largo@test.local'
const ESTUDIANTE_PASSWORD = 'Alumno123!'

const NOMBRE_LARGO = 'Angel Elias Juan David Mateo'
const APELLIDO_LARGO = 'Elias Ricse De La Cruz'

const TITULO_CURSO_LARGO =
  'Gestión de Calidad y Seguridad Alimentaria, Sistemas HACCP, BPM, SOP y SSOP, Auditorías Internas y Normativa ISO 22000'

async function main() {
  console.log('🌱 Seed: certificado con nombres largos...\n')

  const profesor = await prisma.usuario.findFirst({
    where: { rol: 'PROFESOR', esta_activo: true },
    orderBy: { creado_en: 'asc' },
  })

  if (!profesor) {
    throw new Error('No hay profesor en la BD. Ejecuta primero pnpm db:seed o crea un profesor.')
  }

  let categoria = await prisma.categoria.findFirst({ where: { esta_activo: true } })

  if (!categoria) {
    categoria = await prisma.categoria.create({
      data: {
        nombre: 'Pruebas Certificados',
        slug: 'pruebas-certificados',
        esta_activo: true,
      },
    })
  }

  const ahora = new Date()
  const inicioCurso = new Date(ahora)
  inicioCurso.setMonth(inicioCurso.getMonth() - 2)
  const finCurso = new Date(ahora)
  finCurso.setMonth(finCurso.getMonth() - 1)

  const curso = await prisma.curso.upsert({
    where: { slug: CURSO_SLUG },
    update: {
      titulo: TITULO_CURSO_LARGO,
      estado: 'PUBLICADO',
      duracion: '140 horas académicas',
      fecha_inicio: inicioCurso,
      es_gratis: true,
    },
    create: {
      titulo: TITULO_CURSO_LARGO,
      slug: CURSO_SLUG,
      codigo: 'CERT-LARGO',
      descripcion: 'Curso de prueba para validar el diseño del certificado con títulos y nombres extensos.',
      precio: 0,
      precio_falso: 0,
      moneda: 'PEN',
      nivel: 'INTERMEDIO',
      estado: 'PUBLICADO',
      tipo_emision: 'ASINCRONO',
      es_gratis: true,
      duracion: '140 horas académicas',
      fecha_inicio: inicioCurso,
      profesor_id: profesor.id,
      categoria_id: categoria.id,
      modulos: {
        create: [
          {
            titulo: 'Módulo de prueba certificado',
            orden: 0,
            lecciones: {
              create: [
                {
                  titulo: 'Lección única de prueba para emisión de certificado',
                  contenido: '<ul><li>Tema de prueba 1</li><li>Tema de prueba 2</li></ul>',
                  orden: 0,
                  duracion: 60,
                  estado: 'PUBLICADO',
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      modulos: { include: { lecciones: true } },
      profesor: { select: { nombre: true, apellido: true, cargo: true, firma: true } },
    },
  })

  await prisma.$executeRaw`UPDATE cursos SET fecha_fin = ${finCurso} WHERE id = ${curso.id}`

  const passwordHash = await bcrypt.hash(ESTUDIANTE_PASSWORD, 10)

  const estudiante = await prisma.usuario.upsert({
    where: { correo: ESTUDIANTE_CORREO },
    update: {
      nombre: NOMBRE_LARGO,
      apellido: APELLIDO_LARGO,
      esta_activo: true,
    },
    create: {
      correo: ESTUDIANTE_CORREO,
      contrasena: passwordHash,
      nombre: NOMBRE_LARGO,
      apellido: APELLIDO_LARGO,
      numero_documento: '99887766',
      rol: 'ESTUDIANTE',
      esta_activo: true,
    },
  })

  const inscripcion = await prisma.inscripcion.upsert({
    where: {
      usuario_id_curso_id: { usuario_id: estudiante.id, curso_id: curso.id },
    },
    update: {
      estado: 'ACTIVO',
      completado_en: ahora,
      nota_final: 18.5,
      estado_nota: 'APROBADO',
      certificado_habilitado: true,
    },
    create: {
      usuario_id: estudiante.id,
      curso_id: curso.id,
      estado: 'ACTIVO',
      completado_en: ahora,
      nota_final: 18.5,
      estado_nota: 'APROBADO',
      certificado_habilitado: true,
    },
  })

  await prisma.progresoCurso.upsert({
    where: {
      usuario_id_curso_id: { usuario_id: estudiante.id, curso_id: curso.id },
    },
    update: { porcentaje_progreso: 100 },
    create: {
      usuario_id: estudiante.id,
      curso_id: curso.id,
      porcentaje_progreso: 100,
    },
  })

  const lecciones = curso.modulos.flatMap(m => m.lecciones)

  for (const leccion of lecciones) {
    await prisma.progresoLeccion.upsert({
      where: {
        usuario_id_leccion_id: { usuario_id: estudiante.id, leccion_id: leccion.id },
      },
      update: { esta_completado: true, completado_en: ahora },
      create: {
        usuario_id: estudiante.id,
        leccion_id: leccion.id,
        esta_completado: true,
        completado_en: ahora,
      },
    })
  }

  const fechaEmision = ahora.toISOString().slice(0, 10).replace(/-/g, '')
  const codigoVerificacion = `CERT-LARGO-${fechaEmision}-99887766-01`

  const datosSnapshot = {
    curso: {
      titulo: curso.titulo,
      duracion: curso.duracion,
      nivel: curso.nivel,
      tipo_emision: curso.tipo_emision,
      fecha_inicio: curso.fecha_inicio,
    },
    usuario: { nombre: estudiante.nombre, apellido: estudiante.apellido },
    profesor: {
      nombre: curso.profesor.nombre,
      apellido: curso.profesor.apellido,
      cargo: curso.profesor.cargo,
      firma: curso.profesor.firma,
    },
    fechas: {
      inicio_curso: inscripcion.inscrito_en,
      culminacion: inscripcion.completado_en,
      emision: ahora,
    },
  }

  const certificado = await prisma.certificado.upsert({
    where: {
      usuario_id_curso_id_tipo: { usuario_id: estudiante.id, curso_id: curso.id, tipo: 'IPG' },
    },
    update: {
      codigo_verificacion: codigoVerificacion,
      datos: datosSnapshot,
      emitido_en: ahora,
    },
    create: {
      usuario_id: estudiante.id,
      curso_id: curso.id,
      tipo: 'IPG',
      codigo_verificacion: codigoVerificacion,
      datos: datosSnapshot,
      emitido_en: ahora,
    },
  })

  console.log('✅ Datos de prueba creados:\n')
  console.log('── Estudiante ──')
  console.log(`  Nombre completo: ${estudiante.nombre} ${estudiante.apellido}`)
  console.log(`  Correo:          ${ESTUDIANTE_CORREO}`)
  console.log(`  Contraseña:      ${ESTUDIANTE_PASSWORD}`)
  console.log('\n── Curso ──')
  console.log(`  Título:  ${curso.titulo}`)
  console.log(`  Slug:    /aprender/${curso.slug}`)
  console.log(`  Público: /cursos/${curso.slug}`)
  console.log('\n── Certificado ──')
  console.log(`  ID:      ${certificado.id}`)
  console.log(`  Código:  ${certificado.codigo_verificacion}`)
  console.log(`  PDF:     /api/estudiante/certificado/${certificado.id}/pdf`)
  console.log(`  Verificar: /verificar-certificado/${certificado.codigo_verificacion}`)
  console.log('\nInicia sesión como estudiante, entra al curso y descarga el certificado.')
}

main()
  .catch(e => {
    console.error('❌', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
