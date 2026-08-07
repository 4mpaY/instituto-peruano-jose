export const dynamic = 'force-dynamic'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { requireAuth } from '@/utils/libs/auth-helpers'
import {
  getInscripcionCertificadoHabilitacion,
  resolveCertificadoPagoEstado,
} from '@/app/api/_shared/certificados/getInscripcionCertificadoHabilitacion'
import { calcularElegibilidad, ensureCertificado, EnsureCertificadoError } from '@/app/api/_shared/certificados/ensureCertificado'
import { resolveCertificadoDisponibilidad, type CipEntregaRango } from '@/utils/functions/certificadoDisponibilidad'
import {
  resolvePrecioCertificadoCip,
  resolvePrecioCertificadoIpg,
} from '@/utils/functions/certificadoPrecios'

/**
 * GET /api/estudiante/certificado?cursoId=xxx
 * Obtiene los certificados existentes (IPG/CIP) + datos de elegibilidad del estudiante
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { searchParams } = new URL(request.url)
    const cursoId = searchParams.get('cursoId')

    if (!cursoId) {
      return ApiResponse.error(request, 'El ID del curso es requerido', 400)
    }

    const [certificados, elegibilidad, inscripcionHab, curso, usuarioActual, inscripcionPedido, pedidosCertCompletados] = await Promise.all([
      prisma.certificado.findMany({
        where: { usuario_id: auth.user.id, curso_id: cursoId },
        include: {
          curso: { select: { titulo: true } },
          usuario: { select: { nombre: true, apellido: true } }
        }
      }),
      calcularElegibilidad(auth.user.id, cursoId),
      getInscripcionCertificadoHabilitacion(auth.user.id, cursoId),
      prisma.curso.findUnique({
        where: { id: cursoId },
        select: {
          precio_certificado: true,
          titulo: true,
          moneda: true,
          certificado_ipg_espera_valor: true,
          certificado_ipg_espera_unidad: true,
          certificado_cip_entregas: true,
          tipo_emision: true,
        },
      }),
      prisma.usuario.findUnique({ 
        where: { id: auth.user.id }, 
        select: { nombre: true, apellido: true, tipo_documento: true, numero_documento: true, celular: true } 
      }),
      prisma.inscripcion.findUnique({
        where: { usuario_id_curso_id: { usuario_id: auth.user.id, curso_id: cursoId } },
        select: {
          inscrito_en: true,
          pedido: { select: { pagado_en: true, creado_en: true } },
        },
      }),
      prisma.$queryRaw<
        Array<{ fecha_entrega_estimada: Date | null, certificado_tipo: string | null }>
      >`
        SELECT p.fecha_entrega_estimada, d.certificado_tipo::text AS certificado_tipo
        FROM pedidos p
        JOIN detalles_pedido d ON d.pedido_id = p.id
        WHERE p.usuario_id = ${auth.user.id}
          AND p.estado = 'COMPLETADO'
          AND d.curso_id = ${cursoId}
          AND (p.tipo = 'CERTIFICADO'::"TipoPedido" OR d.certificado_tipo IS NOT NULL)
        ORDER BY p.creado_en DESC
      `,
    ])

    // Verificar documento directamente en BD (evita depender del JWT, que puede quedar desactualizado)
    const documentoCompleto = !!usuarioActual?.numero_documento?.trim()

    const certIpg = certificados.find(c => c.tipo === 'IPG') ?? null
    const certCip = certificados.find(c => c.tipo === 'CIP') ?? null

    const precioCert = curso?.precio_certificado ? Number(curso.precio_certificado) : null

    const [preciosRow] = await prisma.$queryRaw<
      Array<{ precio_certificado_ipg: any; precio_certificado_cip: any }>
    >`
      SELECT precio_certificado_ipg, precio_certificado_cip FROM cursos WHERE id = ${cursoId}
    `

    const precioIpg = resolvePrecioCertificadoIpg({
      precio_certificado: precioCert,
      precio_certificado_ipg: preciosRow?.precio_certificado_ipg,
    })

    const precioCip = resolvePrecioCertificadoCip({
      precio_certificado: precioCert,
      precio_certificado_cip: preciosRow?.precio_certificado_cip,
    })

    const tienePrecioTramite = precioIpg != null || precioCip != null

    const cipEntregas = (Array.isArray(curso?.certificado_cip_entregas)
      ? curso?.certificado_cip_entregas
      : []) as CipEntregaRango[]

    const esperaIpg = Number(curso?.certificado_ipg_espera_valor ?? 0) > 0

    const esAsincrono = (curso as any)?.tipo_emision === 'ASINCRONO'

    const requiereHabilitacionExplicita = esAsincrono
      ? tienePrecioTramite || esperaIpg || cipEntregas.length > 0
      : true

    const { ipgHabilitado, cipHabilitado, pagoPendiente } = resolveCertificadoPagoEstado(
      inscripcionHab,
      precioCert,
      { requiereHabilitacion: requiereHabilitacionExplicita }
    )

    const fechaPago =
      inscripcionPedido?.pedido?.pagado_en ||
      inscripcionPedido?.pedido?.creado_en ||
      inscripcionPedido?.inscrito_en ||
      null

    // Si hay precio o tiempo de espera, el admin controla la liberación
    const requiereHabilitacionIpg = precioIpg != null || esperaIpg
    const requiereHabilitacionCip = precioCip != null || cipEntregas.length > 0

    // Extraer fecha estimada de pedidos completados
    const fechaEstimadaIpg = pedidosCertCompletados.find(p => p.certificado_tipo === 'IPG' || !p.certificado_tipo)?.fecha_entrega_estimada ?? null
    const fechaEstimadaCip = pedidosCertCompletados.find(p => p.certificado_tipo === 'CIP')?.fecha_entrega_estimada ?? null

    const dispIpg = resolveCertificadoDisponibilidad({
      tipo: 'ipg',
      habilitado: ipgHabilitado,
      habilitadoEn: inscripcionHab?.certificado_ipg_habilitado_en ?? null,
      ipgEsperaValor: curso?.certificado_ipg_espera_valor,
      ipgEsperaUnidad: curso?.certificado_ipg_espera_unidad,
      fechaEntregaEstimada: fechaEstimadaIpg,
    })

    const dispCip = resolveCertificadoDisponibilidad({
      tipo: 'cip',
      habilitado: cipHabilitado,
      habilitadoEn: inscripcionHab?.certificado_cip_habilitado_en ?? null,
      cipEntregas,
      fechaPago,
      fechaEntregaEstimada: fechaEstimadaCip,
    })

    const ipgDescargable =
      elegibilidad.evaluacionesOk &&
      (requiereHabilitacionIpg
        ? ipgHabilitado && dispIpg.disponible
        : !!certIpg && !dispIpg.enEspera)

    const cipDescargable =
      elegibilidad.evaluacionesOk &&
      (requiereHabilitacionCip
        ? cipHabilitado && dispCip.disponible
        : !!certCip && !dispCip.enEspera)

    const toResumen = (c: typeof certIpg) =>
      c
        ? {
            id: c.id,
            codigoVerificacion: c.codigo_verificacion,
            emitidoEn: c.emitido_en,
            cursoTitulo: c.curso.titulo,
            nombreCompleto: `${c.usuario.nombre} ${c.usuario.apellido}`
          }
        : null

    const pedidosCert = await prisma.$queryRaw<
      Array<{
        id: string
        numero_pedido: number
        creado_en: Date
        certificado_tipo: string | null
        total: unknown
        comprobante_url: string | null
        fecha_entrega_estimada: Date | null
        numero_comprobante: string | null
        referencia_pago: string | null
        estado: string
      }>
    >`
      SELECT
        p.id,
        p.numero_pedido,
        p.creado_en,
        p.fecha_entrega_estimada,
        d.certificado_tipo::text AS certificado_tipo,
        p.total,
        p.comprobante_url,
        p.numero_comprobante,
        p.referencia_pago,
        p.estado::text AS estado
      FROM pedidos p
      JOIN detalles_pedido d ON d.pedido_id = p.id
      WHERE p.usuario_id = ${auth.user.id}
        AND p.estado IN ('PENDIENTE', 'COMPLETADO')
        AND d.curso_id = ${cursoId}
        AND (
          p.tipo = 'CERTIFICADO'::"TipoPedido"
          OR d.certificado_tipo IS NOT NULL
        )
      ORDER BY p.creado_en DESC
    `

    const { estimarDisponibilidadAlTramitar } = await import('@/utils/functions/certificadoPrecios')

    const historialSolicitudes = pedidosCert.map(p => {
      const tipo = String(p.certificado_tipo || 'IPG').toUpperCase() === 'CIP' ? 'CIP' : 'IPG'

      const disp = estimarDisponibilidadAlTramitar({
        tipo: tipo === 'CIP' ? 'cip' : 'ipg',
        ipgEsperaValor: curso?.certificado_ipg_espera_valor,
        ipgEsperaUnidad: curso?.certificado_ipg_espera_unidad,
        cipEntregas,
      })

      const fechaEstimadaPeru = p.fecha_entrega_estimada ? new Date(p.fecha_entrega_estimada) : null

      if (fechaEstimadaPeru && fechaEstimadaPeru.getUTCHours() === 0) {
        fechaEstimadaPeru.setUTCHours(5)
      }

      return {
        pedidoId: p.id,
        numeroPedido: p.numero_pedido,
        certificadoTipo: tipo,
        total: Number(p.total),
        creadoEn: p.creado_en,
        tieneComprobante: !!p.comprobante_url,
        etiquetaEntrega: disp.etiqueta,
        disponibleDesde: fechaEstimadaPeru ?? disp.disponibleDesde,
        nombreTipo: tipo === 'CIP' ? 'Colegio de Ingenieros' : 'IPG Ingenieros',
        comprobanteUrl: p.comprobante_url,
        numeroComprobante: p.numero_comprobante,
        referenciaPago: p.referencia_pago,
        estado: p.estado,
      }
    })

    const solicitudesPendientes = historialSolicitudes.filter(s => s.estado === 'PENDIENTE')

    const tiposPendientes = new Set(solicitudesPendientes.map(s => s.certificadoTipo))

    // Solo un tipo de certificado por curso (IPG o CIP).
    // No bloquear por registros Certificado huérfanos sin habilitación/descarga
    // (p. ej. tras borrar un pedido CERTIFICADO y deshabilitar en inscripción).
    const yaTramitoAlgunCertificado =
      ipgDescargable ||
      cipDescargable ||
      ipgHabilitado ||
      cipHabilitado ||
      dispIpg.enEspera ||
      dispCip.enEspera ||
      tiposPendientes.size > 0

    const tiposTramitables = {
      ipg: precioIpg != null && !yaTramitoAlgunCertificado,
      cip: precioCip != null && !yaTramitoAlgunCertificado,
    }

    const tieneAlgunTipoTramitable = tiposTramitables.ipg || tiposTramitables.cip

    const tramitarDisponible =
      (!!elegibilidad.puedeTramitar || !!elegibilidad.evaluacionesOk || !!elegibilidad.isEligible) &&
      tienePrecioTramite &&
      tieneAlgunTipoTramitable &&
      !yaTramitoAlgunCertificado

    return ApiResponse.success(request, {
      // Solo exponer como obtenido si está habilitado (o curso sin gate admin)
      certificado: ipgDescargable
        ? toResumen(certIpg)
        : cipDescargable
          ? toResumen(certCip)
          : null,
      historialSolicitudes,
      cursoTitulo: curso?.titulo ?? null,
      elegibilidad,
      pagoPendiente,
      precioCertificado: precioCert,
      preciosCertificado: {
        ipg: precioIpg,
        cip: precioCip,
        moneda: (curso as any)?.moneda || 'PEN',
      },
      tramitarDisponible,
      tiposTramitables,
      solicitudesPendientes,
      cursoCertificacion: {
        id: cursoId,
        titulo: curso?.titulo ?? '',
        moneda: (curso as any)?.moneda || 'PEN',
        precio_certificado: precioCert,
        precio_certificado_ipg: precioIpg,
        precio_certificado_cip: precioCip,
        certificado_ipg_espera_valor: curso?.certificado_ipg_espera_valor ?? 0,
        certificado_ipg_espera_unidad: curso?.certificado_ipg_espera_unidad ?? 'DIAS',
        certificado_cip_entregas: cipEntregas,
      },

      // Flags explícitos para el front (evita depender de campos opcionales)
      puedeTramitar: !!elegibilidad.puedeTramitar,
      evaluacionesOk: !!elegibilidad.evaluacionesOk,
      documentoCompleto,
      certificadosHabilitados: {
        ipg: ipgHabilitado,
        cip: cipHabilitado,
      },
      usuarioDatosEnvio: usuarioActual ? {
        nombre: usuarioActual.nombre,
        apellido: usuarioActual.apellido,
        tipo_documento: usuarioActual.tipo_documento,
        numero_documento: usuarioActual.numero_documento,
        celular: usuarioActual.celular
      } : null,
      plantillasPreview: [
        {
          id: 'minimalista',
          nombre: 'Certificado IPG',
          thumbnail: '/images/plantillas-certificado/minimalista.png',
          habilitado: ipgDescargable,
          enEspera: dispIpg.enEspera,
          disponibleDesde: dispIpg.disponibleDesde,
          mensajeEspera: dispIpg.mensaje,
          certificadoId: ipgDescargable ? (certIpg?.id ?? null) : null,
          codigoVerificacion: ipgDescargable ? (certIpg?.codigo_verificacion ?? null) : null,
          emitidoEn: ipgDescargable ? (certIpg?.emitido_en ?? null) : null,
        },
        {
          id: 'colegio_ingenieros',
          nombre: 'Certificado CIP',
          thumbnail: '/images/plantillas-certificado/colegio_ingenieros.png',
          habilitado: cipDescargable,
          enEspera: dispCip.enEspera,
          disponibleDesde: dispCip.disponibleDesde,
          mensajeEspera: dispCip.mensaje,
          certificadoId: cipDescargable ? (certCip?.id ?? null) : null,
          codigoVerificacion: cipDescargable ? (certCip?.codigo_verificacion ?? null) : null,
          emitidoEn: cipDescargable ? (certCip?.emitido_en ?? null) : null,
        },
      ],
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * POST /api/estudiante/certificado
 * Genera (o devuelve, si ya existe) el certificado del tipo pedido, validando
 * inscripción, habilitación de pago y evaluaciones aprobadas.
 * Body: { cursoId: string, tipo?: 'IPG' | 'CIP' }  (tipo por defecto: IPG)
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { cursoId, tipo: tipoBody } = await request.json()

    if (!cursoId) {
      return ApiResponse.error(request, 'El ID del curso es requerido', 400)
    }

    const tipo: 'IPG' | 'CIP' = String(tipoBody).toUpperCase() === 'CIP' ? 'CIP' : 'IPG'

    try {
      const certificado = await ensureCertificado(auth.user.id, cursoId, tipo)

      return ApiResponse.success(
        request,
        {
          certificado: {
            id: certificado.id,
            codigoVerificacion: certificado.codigo_verificacion,
            emitidoEn: certificado.emitido_en,
            cursoTitulo: certificado.curso.titulo,
            nombreCompleto: `${certificado.usuario.nombre} ${certificado.usuario.apellido}`
          }
        },
        201
      )
    } catch (err) {
      if (err instanceof EnsureCertificadoError) {
        const status = err.code === 'CURSO_NO_ENCONTRADO' ? 404 : 403

        return ApiResponse.error(request, err.message, status)
      }

      throw err
    }
  } catch (error) {
    return handleApiError(error, request)
  }
}
