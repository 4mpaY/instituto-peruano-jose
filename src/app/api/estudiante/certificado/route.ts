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

    const [certificados, elegibilidad, inscripcionHab, curso, usuarioActual] = await Promise.all([
      prisma.certificado.findMany({
        where: { usuario_id: auth.user.id, curso_id: cursoId },
        include: {
          curso: { select: { titulo: true } },
          usuario: { select: { nombre: true, apellido: true } }
        }
      }),
      calcularElegibilidad(auth.user.id, cursoId),
      getInscripcionCertificadoHabilitacion(auth.user.id, cursoId),
      prisma.curso.findUnique({ where: { id: cursoId }, select: { precio_certificado: true, titulo: true } }),
      prisma.usuario.findUnique({ where: { id: auth.user.id }, select: { numero_documento: true } })
    ])

    // Verificar documento directamente en BD (evita depender del JWT, que puede quedar desactualizado)
    const documentoCompleto = !!usuarioActual?.numero_documento?.trim()

    const certIpg = certificados.find(c => c.tipo === 'IPG') ?? null
    const certCip = certificados.find(c => c.tipo === 'CIP') ?? null

    const precioCert = curso?.precio_certificado ? Number(curso.precio_certificado) : null

    const { ipgHabilitado, cipHabilitado, pagoPendiente } = resolveCertificadoPagoEstado(
      inscripcionHab,
      precioCert
    )

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

    return ApiResponse.success(request, {
      certificado: toResumen(certIpg),
      cursoTitulo: curso?.titulo ?? null,
      elegibilidad,
      pagoPendiente,
      precioCertificado: precioCert,
      documentoCompleto,
      certificadosHabilitados: {
        ipg: ipgHabilitado,
        cip: cipHabilitado,
      },
      plantillasPreview: [
        {
          id: 'minimalista',
          nombre: 'Certificado IPG',
          thumbnail: '/images/plantillas-certificado/minimalista.png',
          habilitado: ipgHabilitado,
          certificadoId: certIpg?.id ?? null,
          codigoVerificacion: certIpg?.codigo_verificacion ?? null,
          emitidoEn: certIpg?.emitido_en ?? null,
        },
        {
          id: 'colegio_ingenieros',
          nombre: 'Certificado CIP',
          thumbnail: '/images/plantillas-certificado/colegio_ingenieros.png',
          habilitado: cipHabilitado,
          certificadoId: certCip?.id ?? null,
          codigoVerificacion: certCip?.codigo_verificacion ?? null,
          emitidoEn: certCip?.emitido_en ?? null,
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
 * inscripción, habilitación de pago y elegibilidad (progreso + evaluaciones).
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
