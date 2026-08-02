import type { CipEntregaRango, UnidadEsperaIpg } from './certificadoDisponibilidad'
import { addEsperaIpgPreview, resolveCertificadoDisponibilidad } from './certificadoDisponibilidad'

export function resolvePrecioCertificadoIpg(curso: {
  precio_certificado?: unknown
  precio_certificado_ipg?: unknown
}) {
  const ipg = curso.precio_certificado_ipg != null ? Number(curso.precio_certificado_ipg) : null

  if (ipg != null && !Number.isNaN(ipg) && ipg > 0) return ipg
  const legacy = curso.precio_certificado != null ? Number(curso.precio_certificado) : null

  if (legacy != null && !Number.isNaN(legacy) && legacy > 0) return legacy

  return null
}

export function resolvePrecioCertificadoCip(curso: {
  precio_certificado?: unknown
  precio_certificado_cip?: unknown
}) {
  const cip = curso.precio_certificado_cip != null ? Number(curso.precio_certificado_cip) : null

  if (cip != null && !Number.isNaN(cip) && cip > 0) return cip
  const legacy = curso.precio_certificado != null ? Number(curso.precio_certificado) : null

  if (legacy != null && !Number.isNaN(legacy) && legacy > 0) return legacy

  return null
}

/** Fecha estimada de disponibilidad si se tramita ahora (habilitación = ahora). */
export function estimarDisponibilidadAlTramitar(opts: {
  tipo: 'ipg' | 'cip'
  ipgEsperaValor?: number | null
  ipgEsperaUnidad?: string | null
  cipEntregas?: CipEntregaRango[] | null
  now?: Date
}) {
  const now = opts.now ?? new Date()

  if (opts.tipo === 'ipg') {
    const valor = opts.ipgEsperaValor ?? 0
    const unidad = (opts.ipgEsperaUnidad || 'DIAS').toUpperCase() as UnidadEsperaIpg
    const desde = addEsperaIpgPreview(valor, unidad, now)

    return {
      disponibleDesde: desde,
      etiqueta:
        valor > 0
          ? `Entrega aproximada: ${valor} ${unidad === 'HORAS' ? (valor === 1 ? 'hora' : 'horas') : unidad === 'MINUTOS' ? (valor === 1 ? 'minuto' : 'minutos') : valor === 1 ? 'día' : 'días'} después de verificar el pago.`
          : 'Entrega inmediata tras verificar el pago.',
    }
  }

  const disp = resolveCertificadoDisponibilidad({
    tipo: 'cip',
    habilitado: true,
    habilitadoEn: now,
    cipEntregas: opts.cipEntregas,
    fechaPago: now,
    now,
  })

  return {
    disponibleDesde: disp.disponibleDesde,
    etiqueta: disp.disponibleDesde
      ? `Fecha de certificación: ${disp.disponibleDesde.toLocaleDateString('es-PE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}.`
      : (disp.mensaje || 'Fecha de entrega según el periodo de habilitación.'),
  }
}
