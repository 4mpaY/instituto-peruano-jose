export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

import { buildCertificadoData } from '@/app/api/_shared/certificados/buildCertificadoData'
import { getConfigs } from '@/utils/libs/config'
import { getGenerator, PLANTILLAS, plantillaFromTipo } from '@/app/api/_shared/certificados/generators'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { getInscripcionCertificadoHabilitacion } from '@/app/api/_shared/certificados/getInscripcionCertificadoHabilitacion'

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

    const [inscripcionPago, cursoPago] = await Promise.all([
      getInscripcionCertificadoHabilitacion(certificado.usuario_id, certificado.curso_id),
      prisma.curso.findUnique({
        where: { id: certificado.curso_id },
        select: { precio_certificado: true },
      }),
    ])

    const precioCert = cursoPago?.precio_certificado ? Number(cursoPago.precio_certificado) : null
    const requierePago = !!precioCert && precioCert > 0

    const plantilla = plantillaFromTipo(certificado.tipo)

    if (requierePago && auth.user.rol !== 'ADMIN') {
      const habilitado =
        certificado.tipo === 'CIP'
          ? inscripcionPago?.certificado_cip_habilitado
          : inscripcionPago?.certificado_ipg_habilitado || (inscripcionPago?.certificado_habilitado && !inscripcionPago?.certificado_cip_habilitado)

      if (!habilitado) {
        return NextResponse.json(
          { error: 'Este certificado no está habilitado para tu inscripción' },
          { status: 403 }
        )
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
