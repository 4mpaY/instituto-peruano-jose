import type { CertificadoTipo } from '@prisma/client'

import prisma from '@/utils/libs/prisma'

import {
  getInscripcionCertificadoHabilitacion,
  resolveCertificadoPagoEstado
} from './getInscripcionCertificadoHabilitacion'

export type EnsureCertificadoErrorCode =
  | 'NO_INSCRITO'
  | 'CURSO_NO_ENCONTRADO'
  | 'PAGO_PENDIENTE'
  | 'PROGRESO_INCOMPLETO'
  | 'PROMEDIO_INSUFICIENTE'

export class EnsureCertificadoError extends Error {
  code: EnsureCertificadoErrorCode

  constructor(code: EnsureCertificadoErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

/** Calcula el promedio ponderado de las evaluaciones del estudiante en un curso.
 *  Los exámenes sin intentar cuentan como 0. */
export async function calcularElegibilidad(usuarioId: string, cursoId: string) {
  const [progresoCurso, examenes] = await Promise.all([
    prisma.progresoCurso.findUnique({
      where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
    }),
    prisma.examen.findMany({
      where: { curso_id: cursoId, esta_publicado: true },
      select: {
        id: true,
        puntaje_aprobacion: true,
        intentos: {
          where: { usuario_id: usuarioId },
          orderBy: { puntaje: 'desc' },
          take: 1,
          select: { puntaje: true }
        }
      }
    })
  ])

  const progreso = progresoCurso?.porcentaje_progreso ?? 0
  const totalExamenes = examenes.length

  let promedioScore = 0
  let promedioMinimo = 60 // umbral por defecto si no hay exámenes

  if (totalExamenes > 0) {
    const sumScores = examenes.reduce((acc, ex) => acc + (ex.intentos[0]?.puntaje ?? 0), 0)
    const sumMinimos = examenes.reduce((acc, ex) => acc + (ex.puntaje_aprobacion ?? 60), 0)

    promedioScore = Math.round((sumScores / totalExamenes) * 10) / 10
    promedioMinimo = Math.round((sumMinimos / totalExamenes) * 10) / 10
  }

  const isEligible = progreso >= 100 && (totalExamenes === 0 || promedioScore >= promedioMinimo)

  return { progreso, promedioScore, promedioMinimo, isEligible, totalExamenes }
}

/**
 * Devuelve el certificado (usuario, curso, tipo) existente, o lo crea si el alumno
 * está inscrito, habilitado para ese tipo (si el curso requiere pago) y es elegible
 * (progreso 100% + promedio de evaluaciones). Usado por la auto-emisión de IPG y
 * por la creación perezosa del CIP al primer intento de descarga.
 */
export async function ensureCertificado(usuarioId: string, cursoId: string, tipo: CertificadoTipo) {
  const existente = await prisma.certificado.findUnique({
    where: { usuario_id_curso_id_tipo: { usuario_id: usuarioId, curso_id: cursoId, tipo } },
    include: {
      curso: { select: { titulo: true } },
      usuario: { select: { nombre: true, apellido: true } }
    }
  })

  if (existente) return existente

  const inscripcion = await prisma.inscripcion.findUnique({
    where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } }
  })

  if (!inscripcion || inscripcion.estado !== 'ACTIVO') {
    throw new EnsureCertificadoError('NO_INSCRITO', 'No estás inscrito en este curso')
  }

  const curso = await prisma.curso.findUnique({
    where: { id: cursoId },
    include: {
      profesor: { select: { nombre: true, apellido: true, cargo: true, firma: true } }
    }
  })

  if (!curso) {
    throw new EnsureCertificadoError('CURSO_NO_ENCONTRADO', 'Curso no encontrado')
  }

  const precioCert = curso.precio_certificado ? Number(curso.precio_certificado) : null

  if (precioCert && precioCert > 0) {
    const habilitacion = await getInscripcionCertificadoHabilitacion(usuarioId, cursoId)
    const { ipgHabilitado, cipHabilitado } = resolveCertificadoPagoEstado(habilitacion, precioCert)
    const habilitadoParaTipo = tipo === 'CIP' ? cipHabilitado : ipgHabilitado

    if (!habilitadoParaTipo) {
      throw new EnsureCertificadoError(
        'PAGO_PENDIENTE',
        `El certificado ${tipo} de este curso requiere un pago previo. Comunícate con nosotros para habilitarlo.`
      )
    }
  }

  const elegibilidad = await calcularElegibilidad(usuarioId, cursoId)

  if (elegibilidad.progreso < 100) {
    throw new EnsureCertificadoError('PROGRESO_INCOMPLETO', 'Debes completar todas las lecciones del curso')
  }

  if (elegibilidad.totalExamenes > 0 && elegibilidad.promedioScore < elegibilidad.promedioMinimo) {
    const notaPromedio = Math.round((elegibilidad.promedioScore / 100) * 20 * 10) / 10
    const notaMinima = Math.round((elegibilidad.promedioMinimo / 100) * 20 * 10) / 10

    throw new EnsureCertificadoError(
      'PROMEDIO_INSUFICIENTE',
      `Tu promedio de evaluaciones es ${notaPromedio}/20. Necesitas al menos ${notaMinima}/20 para obtener el certificado.`
    )
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { nombre: true, apellido: true, numero_documento: true }
  })

  const fechaEmision = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const dni = usuario?.numero_documento?.replace(/\D/g, '') || 'SINDNI'

  const codigoCurso =
    curso.codigo || curso.slug?.slice(0, 12).toUpperCase() || cursoId.slice(0, 8).toUpperCase()

  const codigoVerificacion = `${codigoCurso}-${fechaEmision}-${dni}-01-${tipo}`

  const datosSnapshot = {
    curso: {
      titulo: curso.titulo,
      duracion: curso.duracion,
      nivel: curso.nivel,
      tipo_emision: curso.tipo_emision,
      fecha_inicio: curso.fecha_inicio
    },
    usuario: { nombre: usuario?.nombre ?? '', apellido: usuario?.apellido ?? '' },
    profesor: {
      nombre: curso.profesor.nombre,
      apellido: curso.profesor.apellido,
      cargo: curso.profesor.cargo,
      firma: curso.profesor.firma
    },
    fechas: {
      inicio_curso: curso.tipo_emision === 'SINCRONO' ? curso.fecha_inicio : inscripcion.inscrito_en,
      culminacion: inscripcion.completado_en || new Date(),
      emision: new Date()
    }
  }

  return prisma.certificado.create({
    data: {
      usuario_id: usuarioId,
      curso_id: cursoId,
      tipo,
      codigo_verificacion: codigoVerificacion,
      datos: datosSnapshot as any
    },
    include: {
      curso: { select: { titulo: true } },
      usuario: { select: { nombre: true, apellido: true } }
    }
  })
}
