export const dynamic = 'force-dynamic'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { calcularElegibilidad } from '@/app/api/_shared/certificados/ensureCertificado'
import {
  getInscripcionCertificadoHabilitacion,
  resolveCertificadoPagoEstado,
} from '@/app/api/_shared/certificados/getInscripcionCertificadoHabilitacion'
import {
  resolvePrecioCertificadoCip,
  resolvePrecioCertificadoIpg,
} from '@/utils/functions/certificadoPrecios'
import type { CipEntregaRango } from '@/utils/functions/certificadoDisponibilidad'

/**
 * GET /api/estudiante/certificados/tramitables
 * Cursos del estudiante elegibles para tramitar certificado (sin cert habilitado).
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const inscripciones = await prisma.inscripcion.findMany({
      where: { usuario_id: auth.user.id, estado: 'ACTIVO' },
      include: {
        curso: {
          select: {
            id: true,
            titulo: true,
            slug: true,
            miniatura: true,
            moneda: true,
            precio_certificado: true,
            certificado_ipg_espera_valor: true,
            certificado_ipg_espera_unidad: true,
            certificado_cip_entregas: true,
          },
        },
      },
    })

    const tramitables = []

    for (const insc of inscripciones) {
      const curso = insc.curso

      const [preciosRow] = await prisma.$queryRaw<
        Array<{ precio_certificado_ipg: any; precio_certificado_cip: any }>
      >`
        SELECT precio_certificado_ipg, precio_certificado_cip FROM cursos WHERE id = ${curso.id}
      `

      const precioCert = curso.precio_certificado ? Number(curso.precio_certificado) : null

      const precioIpg = resolvePrecioCertificadoIpg({
        precio_certificado: precioCert,
        precio_certificado_ipg: preciosRow?.precio_certificado_ipg,
      })

      const precioCip = resolvePrecioCertificadoCip({
        precio_certificado: precioCert,
        precio_certificado_cip: preciosRow?.precio_certificado_cip,
      })

      if (precioIpg == null && precioCip == null) continue

      const elegibilidad = await calcularElegibilidad(auth.user.id, curso.id)

      if (!elegibilidad.puedeTramitar) continue

      const hab = await getInscripcionCertificadoHabilitacion(auth.user.id, curso.id)

      const cipEntregas = (Array.isArray(curso.certificado_cip_entregas)
        ? curso.certificado_cip_entregas
        : []) as CipEntregaRango[]

      const esperaIpg = Number(curso.certificado_ipg_espera_valor ?? 0) > 0

      const requiereHabilitacion =
        precioIpg != null || precioCip != null || esperaIpg || cipEntregas.length > 0

      const { pagoPendiente, ipgHabilitado, cipHabilitado } = resolveCertificadoPagoEstado(
        hab,
        precioCert,
        { requiereHabilitacion }
      )

      if (!pagoPendiente && (ipgHabilitado || cipHabilitado)) continue

      tramitables.push({
        cursoId: curso.id,
        titulo: curso.titulo,
        slug: curso.slug,
        miniatura: curso.miniatura,
        cursoCertificacion: {
          id: curso.id,
          titulo: curso.titulo,
          moneda: curso.moneda || 'PEN',
          precio_certificado: precioCert,
          precio_certificado_ipg: precioIpg,
          precio_certificado_cip: precioCip,
          certificado_ipg_espera_valor: curso.certificado_ipg_espera_valor ?? 0,
          certificado_ipg_espera_unidad: curso.certificado_ipg_espera_unidad ?? 'DIAS',
          certificado_cip_entregas: cipEntregas,
        },
      })
    }

    return ApiResponse.success(request, { tramitables })
  } catch (error) {
    return handleApiError(error, request)
  }
}
