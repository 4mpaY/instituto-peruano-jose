import { Prisma } from '@prisma/client'

import prisma from '@/utils/libs/prisma'

export type InscripcionCertHabilitacion = {
  certificado_habilitado: boolean
  certificado_ipg_habilitado: boolean
  certificado_cip_habilitado: boolean
}

/**
 * Lee el estado de habilitación de certificados de una inscripción.
 * Compatible con BD sin migración IPG/CIP (fallback a certificado_habilitado).
 */
export async function getInscripcionCertificadoHabilitacion(
  usuarioId: string,
  cursoId: string
): Promise<InscripcionCertHabilitacion | null> {
  const base = await prisma.inscripcion.findUnique({
    where: { usuario_id_curso_id: { usuario_id: usuarioId, curso_id: cursoId } },
    select: { certificado_habilitado: true },
  })

  if (!base) return null

  try {
    const [extended] = await prisma.$queryRaw<
      Array<{ certificado_ipg_habilitado: boolean; certificado_cip_habilitado: boolean }>
    >(Prisma.sql`
      SELECT certificado_ipg_habilitado, certificado_cip_habilitado
      FROM inscripciones
      WHERE usuario_id = ${usuarioId} AND curso_id = ${cursoId}
    `)

    if (extended) {
      return {
        certificado_habilitado: base.certificado_habilitado,
        certificado_ipg_habilitado: extended.certificado_ipg_habilitado,
        certificado_cip_habilitado: extended.certificado_cip_habilitado,
      }
    }
  } catch {
    // Columnas IPG/CIP aún no migradas
  }

  return {
    certificado_habilitado: base.certificado_habilitado,
    certificado_ipg_habilitado: base.certificado_habilitado,
    certificado_cip_habilitado: false,
  }
}

export function resolveCertificadoPagoEstado(
  inscripcion: InscripcionCertHabilitacion | null,
  precioCert: number | null
) {
  const ipgHabilitado = !!inscripcion?.certificado_ipg_habilitado
  const cipHabilitado = !!inscripcion?.certificado_cip_habilitado
  const legacyHabilitado = !!inscripcion?.certificado_habilitado
  const algunoHabilitado = ipgHabilitado || cipHabilitado || legacyHabilitado
  const pagoPendiente = !!(precioCert && precioCert > 0 && !algunoHabilitado)

  return {
    ipgHabilitado: ipgHabilitado || (legacyHabilitado && !cipHabilitado),
    cipHabilitado,
    algunoHabilitado,
    pagoPendiente,
  }
}

/**
 * Habilita o deshabilita certificado IPG/CIP vía SQL directo.
 * Funciona aunque el cliente Prisma no esté regenerado.
 */
export async function setInscripcionCertificadoHabilitacion(
  inscripcionId: string,
  tipo: 'ipg' | 'cip',
  habilitado: boolean
) {
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id: inscripcionId },
    select: { id: true, usuario_id: true, curso_id: true },
  })

  if (!inscripcion) return null

  if (tipo === 'ipg') {
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE inscripciones
        SET certificado_ipg_habilitado = ${habilitado}
        WHERE id = ${inscripcionId}
      `
    )
  } else {
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE inscripciones
        SET certificado_cip_habilitado = ${habilitado}
        WHERE id = ${inscripcionId}
      `
    )
  }

  const hab = await getInscripcionCertificadoHabilitacion(inscripcion.usuario_id, inscripcion.curso_id)
  const synced = !!(hab?.certificado_ipg_habilitado || hab?.certificado_cip_habilitado)

  await prisma.inscripcion.update({
    where: { id: inscripcionId },
    data: { certificado_habilitado: synced },
  })

  if (!hab) return null

  return {
    id: inscripcion.id,
    usuario_id: inscripcion.usuario_id,
    curso_id: inscripcion.curso_id,
    certificado_habilitado: synced,
    certificado_ipg_habilitado: hab.certificado_ipg_habilitado,
    certificado_cip_habilitado: hab.certificado_cip_habilitado,
  }
}

/**
 * Mapa de habilitación IPG/CIP para todas las inscripciones de un curso.
 */
export async function getCertificadoHabilitacionPorCurso(cursoId: string) {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        certificado_ipg_habilitado: boolean
        certificado_cip_habilitado: boolean
        certificado_habilitado: boolean
      }>
    >(Prisma.sql`
      SELECT id, certificado_ipg_habilitado, certificado_cip_habilitado, certificado_habilitado
      FROM inscripciones
      WHERE curso_id = ${cursoId}
    `)

    return new Map(rows.map(r => [r.id, r]))
  } catch {
    return new Map<string, { certificado_ipg_habilitado: boolean; certificado_cip_habilitado: boolean; certificado_habilitado: boolean }>()
  }
}
