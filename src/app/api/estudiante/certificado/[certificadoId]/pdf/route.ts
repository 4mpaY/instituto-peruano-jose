export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

import { buildCertificadoData } from '@/app/api/_shared/certificados/buildCertificadoData'
import { getConfigs } from '@/utils/libs/config'
import { getGenerator, PLANTILLAS, plantillaFromTipo } from '@/app/api/_shared/certificados/generators'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { getInscripcionCertificadoHabilitacion } from '@/app/api/_shared/certificados/getInscripcionCertificadoHabilitacion'
import { calcularElegibilidad } from '@/app/api/_shared/certificados/ensureCertificado'
import {
  resolvePrecioCertificadoCip,
  resolvePrecioCertificadoIpg,
} from '@/utils/functions/certificadoPrecios'

/**
 * GET /api/estudiante/certificado/[certificadoId]/pdf
 * Descarga el PDF del certificado (Estudiante).
 * La plantilla se resuelve directamente del tipo (IPG/CIP) del certificado.
 */
export async function GET(request: Request, { params }: { params: { certificadoId: string } }) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { certificadoId } = params
    const reqUrl = new URL(request.url)
    const previewFlag = reqUrl.searchParams.get('preview') === 'true'

    // ── Carga paralela principal ──────────────────────────────────────
    const [certificado, configs] = await Promise.all([
      prisma.certificado.findUnique({
        where: { id: certificadoId },
        include: {
          curso: {
            select: {
              titulo: true,
              duracion: true,
              nivel: true,
              fecha_inicio: true,
              vigencia_meses: true,
              tipo_emision: true,
              profesor: {
                select: { nombre: true, apellido: true, cargo: true, firma: true }
              }
            }
          },
          usuario: { select: { nombre: true, apellido: true } }
        }
      }),
      getConfigs()
    ])

    if (!certificado) {
      return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 })
    }

    // ── Verificar ownership ──────────────────────────────────────────
    if (certificado.usuario_id !== auth.user.id && auth.user.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const [inscripcionPago, cursoPago, inscripcionPedido, preciosRows] = await Promise.all([
      getInscripcionCertificadoHabilitacion(certificado.usuario_id, certificado.curso_id),
      prisma.curso.findUnique({
        where: { id: certificado.curso_id },
        select: {
          precio_certificado: true,
          certificado_ipg_espera_valor: true,
          certificado_ipg_espera_unidad: true,
          certificado_cip_entregas: true,
        },
      }),
      prisma.inscripcion.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: certificado.usuario_id,
            curso_id: certificado.curso_id,
          },
        },
        select: {
          inscrito_en: true,
          pedido: { select: { pagado_en: true, creado_en: true } },
        },
      }),
      prisma.$queryRaw<
        Array<{ precio_certificado_ipg: unknown; precio_certificado_cip: unknown }>
      >`SELECT precio_certificado_ipg, precio_certificado_cip FROM cursos WHERE id = ${certificado.curso_id}`,
    ])

    const preciosRow = preciosRows?.[0]
    const precioCert = cursoPago?.precio_certificado ? Number(cursoPago.precio_certificado) : null

    const precioTipo =
      certificado.tipo === 'CIP'
        ? resolvePrecioCertificadoCip({
            precio_certificado: precioCert,
            precio_certificado_cip: preciosRow?.precio_certificado_cip,
          })
        : resolvePrecioCertificadoIpg({
            precio_certificado: precioCert,
            precio_certificado_ipg: preciosRow?.precio_certificado_ipg,
          })

    const requierePago = precioTipo != null && precioTipo > 0
    const esperaIpg = Number(cursoPago?.certificado_ipg_espera_valor ?? 0) > 0

    const cipEntregas = Array.isArray(cursoPago?.certificado_cip_entregas)
      ? cursoPago?.certificado_cip_entregas
      : []

    const requiereHabilitacion =
      certificado.tipo === 'CIP'
        ? requierePago || cipEntregas.length > 0
        : requierePago || esperaIpg

    const plantilla = plantillaFromTipo(certificado.tipo)

    if (auth.user.rol !== 'ADMIN') {
      const elegibilidad = await calcularElegibilidad(certificado.usuario_id, certificado.curso_id)

      if (!elegibilidad.evaluacionesOk) {
        return NextResponse.json(
          {
            error:
              elegibilidad.totalExamenes > 0
                ? `Debes aprobar las evaluaciones antes de descargar (promedio: ${elegibilidad.promedioScore}% / mínimo: ${elegibilidad.promedioMinimo}%).`
                : 'No puedes descargar el certificado en este momento.',
          },
          { status: 403 }
        )
      }

      const habilitado =
        certificado.tipo === 'CIP'
          ? !!inscripcionPago?.certificado_cip_habilitado
          : !!(inscripcionPago?.certificado_ipg_habilitado || (inscripcionPago?.certificado_habilitado && !inscripcionPago?.certificado_cip_habilitado))

      if (requiereHabilitacion && !habilitado) {
        return NextResponse.json(
          {
            error:
              'Debes haber comprado y tener habilitado este certificado (IPG o Colegio de Ingenieros) para descargarlo.',
          },
          { status: 403 }
        )
      }

      if (habilitado) {
        const { resolveCertificadoDisponibilidad } = await import('@/utils/functions/certificadoDisponibilidad')

        const fechaPago =
          inscripcionPedido?.pedido?.pagado_en ||
          inscripcionPedido?.pedido?.creado_en ||
          inscripcionPedido?.inscrito_en ||
          null

        const disponibilidad = resolveCertificadoDisponibilidad({
          tipo: certificado.tipo === 'CIP' ? 'cip' : 'ipg',
          habilitado: true,
          habilitadoEn:
            certificado.tipo === 'CIP'
              ? inscripcionPago?.certificado_cip_habilitado_en ?? null
              : inscripcionPago?.certificado_ipg_habilitado_en ?? null,
          ipgEsperaValor: cursoPago?.certificado_ipg_espera_valor,
          ipgEsperaUnidad: cursoPago?.certificado_ipg_espera_unidad,
          cipEntregas: cipEntregas as any,
          fechaPago,
        })

        if (!disponibilidad.disponible) {
          return NextResponse.json(
            { error: disponibilidad.mensaje || 'El certificado aún no está disponible' },
            { status: 403 }
          )
        }
      }
    }

    // ── Carga secundaria ──────────────────────────────────────────────
    const [inscripcion, usuarioCompleto, intentosExamen, modulosCurso] = await Promise.all([
      prisma.inscripcion.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: certificado.usuario_id,
            curso_id: certificado.curso_id
          }
        },
        select: { completado_en: true, inscrito_en: true, nota_final: true }
      }),
      prisma.usuario.findUnique({
        where: { id: certificado.usuario_id },
        select: { avatar: true }
      }),
      prisma.intentoExamen.findMany({
        where: {
          usuario_id: certificado.usuario_id,
          esta_aprobado: true,
          examen: { curso_id: certificado.curso_id, modulo_id: { not: null } }
        },
        select: { puntaje: true, examen: { select: { modulo_id: true, peso: true } } },
        orderBy: { enviado_en: 'desc' }
      }),
      prisma.modulo.findMany({
        where: { curso_id: certificado.curso_id },
        orderBy: { orden: 'asc' },
        select: {
          id: true,
          titulo: true,
          orden: true,
          lecciones: {
            orderBy: { orden: 'asc' },
            select: { id: true, titulo: true, orden: true, duracion: true, contenido: true, subtemas: true }
          }
        }
      })
    ])

    // fecha_fin del curso
    const [cursoFechaFinRow] = await prisma.$queryRaw<Array<{ fecha_fin: Date | null }>>`
      SELECT fecha_fin FROM cursos WHERE id = ${certificado.curso_id}
    `

    const cursoFechaFin = cursoFechaFinRow?.fecha_fin ?? null

    // ── Gerente General (fallback al primer admin del sistema) ───────────
    const gerenteGeneralId = configs.CERTIFICADO_GERENTE_GENERAL_ID

    const gerenteGeneral = gerenteGeneralId
      ? await prisma.usuario.findUnique({
          where: { id: gerenteGeneralId },
          select: { nombre: true, apellido: true, cargo: true, firma: true }
        })
      : await prisma.usuario.findFirst({
          where: { rol: 'ADMIN' },
          select: { nombre: true, apellido: true, cargo: true, firma: true },
          orderBy: { creado_en: 'asc' }
        })

    // ── Construir datos del certificado ───────────────────────────────
    const diseno = PLANTILLAS[plantilla].diseño

    const certData = await buildCertificadoData({
      certificado: { ...certificado, curso: { ...certificado.curso, modulos: modulosCurso } } as any,
      configs,
      inscripcion,
      usuarioAvatar: usuarioCompleto?.avatar,
      intentosExamen,
      cursoFechaFin,
      reqUrl,
      previewFlag,
      gerenteGeneral,
      diseno,
    })

    // ── Seleccionar plantilla y generar PDF ───────────────────────────
    const generarPDF = getGenerator(plantilla)
    const pdfBuffer = await generarPDF(certData)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${previewFlag ? 'inline' : 'attachment'}; filename="certificado-${certificado.codigo_verificacion}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache'
      }
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
