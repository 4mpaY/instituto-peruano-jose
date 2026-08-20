import type { CertificadoTipo } from '@prisma/client'

import prisma from '@/utils/libs/prisma'
import { resolveCertificadoDisponibilidad } from '@/utils/functions/certificadoDisponibilidad'

import {
  getInscripcionCertificadoHabilitacion,
  resolveCertificadoPagoEstado
} from './getInscripcionCertificadoHabilitacion'

export type EnsureCertificadoErrorCode =
  | 'NO_INSCRITO'
  | 'CURSO_NO_ENCONTRADO'
  | 'PAGO_PENDIENTE'
  | 'EN_ESPERA'
  | 'PROGRESO_INCOMPLETO'
  | 'PROMEDIO_INSUFICIENTE'

export class EnsureCertificadoError extends Error {
  code: EnsureCertificadoErrorCode

  constructor(code: EnsureCertificadoErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

/** Calcula progreso y promedio de evaluaciones del estudiante en un curso.
 *  Los exámenes sin intentar cuentan como 0.
 *
 *  Pedido y descarga del certificado: solo exigen evaluaciones aprobadas
 *  (+ compra/habilitación del tipo IPG o CIP cuando aplica).
 *  El % de lecciones se informa pero ya no bloquea. */
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
  const examenesRealizados = examenes.filter(ex => ex.intentos.length > 0).length

  let promedioScore = 0
  let promedioMinimo = 60 // umbral por defecto si no hay exámenes

  if (totalExamenes > 0) {
    const sumScores = examenes.reduce((acc, ex) => acc + (ex.intentos[0]?.puntaje ?? 0), 0)
    const sumMinimos = examenes.reduce((acc, ex) => acc + (ex.puntaje_aprobacion ?? 60), 0)

    promedioScore = Math.round((sumScores / totalExamenes) * 10) / 10
    promedioMinimo = Math.round((sumMinimos / totalExamenes) * 10) / 10
  }

  const evaluacionesOk = totalExamenes === 0 || promedioScore >= promedioMinimo

  /** Pedido de certificado: solo evaluaciones. */
  const puedeTramitar = evaluacionesOk

  /** Emisión / descarga: evaluaciones (+ compra del tipo se valida aparte). */
  const isEligible = evaluacionesOk

  return {
    progreso,
    promedioScore,
    promedioMinimo,
    isEligible,
    puedeTramitar,
    evaluacionesOk,
    totalExamenes,
    examenesRealizados,
  }
}

/**
 * Devuelve el certificado (usuario, curso, tipo) existente, o lo crea si el alumno
 * está inscrito, habilitado para ese tipo (si el curso requiere pago) y aprobó
 * las evaluaciones. Usado por auto-emisión IPG y creación perezosa CIP al descargar.
 */
async function assertDisponibilidadCertificado(
  usuarioId: string,
  cursoId: string,
  tipo: CertificadoTipo,
  curso: {
    precio_certificado?: unknown
    certificado_ipg_espera_valor?: number | null
    certificado_ipg_espera_unidad?: string | null
    certificado_cip_entregas?: unknown
    tipo_emision?: string | null
  }
) {
  const { resolvePrecioCertificadoCip, resolvePrecioCertificadoIpg } = await import(
    '@/utils/functions/certificadoPrecios'
  )

  const [preciosRow] = await prisma.$queryRaw<
    Array<{ precio_certificado_ipg: unknown; precio_certificado_cip: unknown }>
  >`SELECT precio_certificado_ipg, precio_certificado_cip FROM cursos WHERE id = ${cursoId}`

  const precioCert = curso.precio_certificado != null ? Number(curso.precio_certificado) : null

  const precioTipo =
    tipo === 'CIP'
      ? resolvePrecioCertificadoCip({
          precio_certificado: precioCert,
          precio_certificado_cip: preciosRow?.precio_certificado_cip,
        })
      : resolvePrecioCertificadoIpg({
          precio_certificado: precioCert,
          precio_certificado_ipg: preciosRow?.precio_certificado_ipg,
        })

  const habilitacion = await getInscripcionCertificadoHabilitacion(usuarioId, cursoId)

  const esAsincrono = curso.tipo_emision === 'ASINCRONO'

  const requiereHabilitacionExplicita = esAsincrono
    ? precioTipo != null || Number(curso.certificado_ipg_espera_valor ?? 0) > 0 || (Array.isArray(curso.certificado_cip_entregas) && curso.certificado_cip_entregas.length > 0)
    : true

  const { ipgHabilitado, cipHabilitado } = resolveCertificadoPagoEstado(habilitacion, precioCert, {
    requiereHabilitacion: requiereHabilitacionExplicita,
  })

  const habilitadoParaTipo = tipo === 'CIP' ? cipHabilitado : ipgHabilitado

  if (requiereHabilitacionExplicita && !habilitadoParaTipo) {
    throw new EnsureCertificadoError(
      'PAGO_PENDIENTE',
      `Debes tener registrado el pago y habilitado el certificado ${tipo === 'CIP' ? 'del Colegio de Ingenieros' : 'IPG'} para poder descargarlo.`
    )
  }

  const esperaIpgConfigurada = Number(curso.certificado_ipg_espera_valor ?? 0) > 0
  const cipEntregas = Array.isArray(curso.certificado_cip_entregas) ? curso.certificado_cip_entregas : []
  const esperaCipConfigurada = cipEntregas.length > 0

  if (!habilitadoParaTipo) {
    if (tipo === 'IPG' && esperaIpgConfigurada) {
      throw new EnsureCertificadoError(
        'PAGO_PENDIENTE',
        'Tu certificado IPG aún no ha sido habilitado. Comunícate con nosotros.'
      )
    }

    if (tipo === 'CIP' && esperaCipConfigurada) {
      throw new EnsureCertificadoError(
        'PAGO_PENDIENTE',
        'Tu certificado CIP aún no ha sido habilitado. Comunícate con nosotros.'
      )
    }

    return
  }

  const inscPedido = await prisma.inscripcion.findUnique({
    where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } },
    select: {
      inscrito_en: true,
      pedido: { select: { pagado_en: true, creado_en: true } },
    },
  })

  const pedidosCert = await prisma.$queryRaw<
    Array<{ fecha_entrega_estimada: Date | null, certificado_tipo: string | null }>
  >`
    SELECT p.fecha_entrega_estimada, d.certificado_tipo::text AS certificado_tipo
    FROM pedidos p
    JOIN detalles_pedido d ON d.pedido_id = p.id
    WHERE p.usuario_id = ${usuarioId}
      AND p.estado = 'COMPLETADO'
      AND d.curso_id = ${cursoId}
      AND (p.tipo = 'CERTIFICADO'::"TipoPedido" OR d.certificado_tipo IS NOT NULL)
  `

  const fechaPago =
    inscPedido?.pedido?.creado_en || inscPedido?.pedido?.pagado_en || inscPedido?.inscrito_en || null

  const fechaEstimada = pedidosCert.find(p => 
    tipo === 'CIP' ? p.certificado_tipo === 'CIP' : (p.certificado_tipo === 'IPG' || !p.certificado_tipo)
  )?.fecha_entrega_estimada ?? null

  const disponibilidad = resolveCertificadoDisponibilidad({
    tipo: tipo === 'CIP' ? 'cip' : 'ipg',
    habilitado: true,
    habilitadoEn:
      tipo === 'CIP'
        ? habilitacion?.certificado_cip_habilitado_en ?? null
        : habilitacion?.certificado_ipg_habilitado_en ?? null,
    ipgEsperaValor: curso.certificado_ipg_espera_valor,
    ipgEsperaUnidad: curso.certificado_ipg_espera_unidad,
    cipEntregas: cipEntregas as any,
    fechaPago,
    fechaEntregaEstimada: fechaEstimada,
  })

  if (!disponibilidad.disponible) {
    throw new EnsureCertificadoError(
      'EN_ESPERA',
      disponibilidad.mensaje || 'El certificado aún no está disponible por el tiempo de espera configurado.'
    )
  }

  return disponibilidad
}

export async function ensureCertificado(usuarioId: string, cursoId: string, tipo: CertificadoTipo) {
  const existente = await prisma.certificado.findUnique({
    where: { usuario_id_curso_id_tipo: { usuario_id: usuarioId, curso_id: cursoId, tipo } },
    include: {
      curso: {
        select: {
          titulo: true,
          precio_certificado: true,
          certificado_ipg_espera_valor: true,
          certificado_ipg_espera_unidad: true,
          certificado_cip_entregas: true,
          tipo_emision: true,
        },
      },
      usuario: { select: { nombre: true, apellido: true } }
    }
  })

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

  const disponibilidad = await assertDisponibilidadCertificado(usuarioId, cursoId, tipo, curso)

  const elegibilidad = await calcularElegibilidad(usuarioId, cursoId)

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
      inicio_curso: (existente?.datos as any)?.emision_manual 
        ? (existente?.datos as any)?.fechas?.inicio_curso 
        : (curso.fecha_inicio || inscripcion.inscrito_en),
      culminacion: (existente?.datos as any)?.emision_manual 
        ? (existente?.datos as any)?.fechas?.culminacion 
        : (curso.fecha_fin || inscripcion.completado_en || new Date()),
      emision: (existente?.datos as any)?.emision_manual 
        ? (existente?.datos as any)?.fechas?.emision 
        : (fechaEstimada || existente?.emitido_en || disponibilidad.disponibleDesde || new Date())
    }
  }

  if (existente) {
    return prisma.certificado.update({
      where: { id: existente.id },
      data: { datos: datosSnapshot as any },
      include: {
        curso: { select: { titulo: true } },
        usuario: { select: { nombre: true, apellido: true } }
      }
    })
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
