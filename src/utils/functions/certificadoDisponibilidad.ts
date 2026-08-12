export type UnidadEsperaIpg = 'DIAS' | 'HORAS' | 'MINUTOS'

export type CipEntregaRango = {
  id: string
  pagos_desde: string
  pagos_hasta: string
  fecha_entrega: string
  hora: string
}

export type CertificadoDisponibilidad = {
  habilitado: boolean
  disponible: boolean
  disponibleDesde: Date | null
  enEspera: boolean
  mensaje: string | null
}

function parseDateOnly(value: string): Date | null {
  if (!value) return null
  if (value.includes('T')) return new Date(value)
  const [y, m, d] = value.split('-').map(Number)

  if (!y || !m || !d) return null
  
return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function parseDateTime(fecha: string, hora: string): Date | null {
  const base = parseDateOnly(fecha)

  if (!base) return null
  const [hh = '0', mm = '0'] = (hora || '00:00').split(':')

  base.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0)
  
return base
}

function addEspera(from: Date, valor: number, unidad: UnidadEsperaIpg): Date {
  const result = new Date(from)
  const amount = Math.max(0, Number(valor) || 0)

  if (unidad === 'HORAS') result.setHours(result.getHours() + amount)
  else if (unidad === 'MINUTOS') result.setMinutes(result.getMinutes() + amount)
  else result.setDate(result.getDate() + amount)

  return result
}

export function addEsperaIpgPreview(valor: number, unidad: UnidadEsperaIpg, from = new Date()) {
  return addEspera(from, valor, unidad)
}

/**
 * Calcula si el certificado ya puede verse/descargarse tras la habilitación admin.
 */
export function resolveCertificadoDisponibilidad(opts: {
  tipo: 'ipg' | 'cip'
  habilitado: boolean
  habilitadoEn: Date | null
  ipgEsperaValor?: number | null
  ipgEsperaUnidad?: string | null
  cipEntregas?: CipEntregaRango[] | null
  fechaPago?: Date | null
  fechaEntregaEstimada?: Date | null
  now?: Date
}): CertificadoDisponibilidad {
  const now = opts.now ?? new Date()

  // Ajustar fechaEntregaEstimada a la medianoche de Perú (UTC-5)
  const fechaEstimadaPeru = opts.fechaEntregaEstimada ? new Date(opts.fechaEntregaEstimada) : null

  if (fechaEstimadaPeru && fechaEstimadaPeru.getUTCHours() === 0) {
    fechaEstimadaPeru.setUTCHours(5)
  }

  if (!opts.habilitado) {
    return {
      habilitado: false,
      disponible: false,
      disponibleDesde: null,
      enEspera: false,
      mensaje: null,
    }
  }

  if (opts.tipo === 'ipg') {
    const inicio = opts.habilitadoEn ?? now
    const unidad = (opts.ipgEsperaUnidad || 'DIAS').toUpperCase() as UnidadEsperaIpg
    const valor = opts.ipgEsperaValor ?? 0
    const disponibleDesde = fechaEstimadaPeru ?? addEspera(inicio, valor, unidad)
    const disponible = now >= disponibleDesde

    return {
      habilitado: true,
      disponible,
      disponibleDesde,
      enEspera: !disponible,
      mensaje: disponible ? null : 'Tu certificado IPG estará disponible en la fecha indicada.',
    }
  }

  // CIP: fecha de entrega según el periodo en que el alumno pagó o fue habilitado
  const entregas = Array.isArray(opts.cipEntregas) ? opts.cipEntregas : []

  // Prioriza la fecha de habilitación admin; si no hay, usa pago/inscripción
  const fechaReferencia = opts.habilitadoEn ?? opts.fechaPago ?? null

  if (!fechaReferencia || entregas.length === 0) {
    // Sin rangos: disponible apenas se habilita
    const disponibleDesde = opts.habilitadoEn ?? now
    const disponible = now >= disponibleDesde

    return {
      habilitado: true,
      disponible,
      disponibleDesde,
      enEspera: !disponible,
      mensaje: disponible
        ? null
        : 'Tu certificado CIP aún no está disponible.',
    }
  }

  const refDay = new Date(fechaReferencia)

  const match = entregas.find(rango => {
    const desde = parseDateOnly(rango.pagos_desde)
    const hasta = parseDateOnly(rango.pagos_hasta)

    if (!desde || !hasta) return false
    if (!rango.pagos_hasta.includes('T')) hasta.setHours(23, 59, 59, 999)
    
    return refDay >= desde && refDay <= hasta
  })

  if (!match) {
    return {
      habilitado: true,
      disponible: false,
      disponibleDesde: null,
      enEspera: true,
      mensaje:
        'Tu fecha de habilitación / pago no coincide con ningún periodo de entrega configurado para el certificado CIP.',
    }
  }

  const disponibleDesde = fechaEstimadaPeru ?? parseDateTime(match.fecha_entrega, match.hora) ?? opts.habilitadoEn ?? now
  const disponible = now >= disponibleDesde

  return {
    habilitado: true,
    disponible,
    disponibleDesde,
    enEspera: !disponible,
    mensaje: disponible ? null : 'Tu certificado CIP estará disponible en la fecha indicada.',
  }
}

export function validateCipEntregasNoOverlap(rangos: CipEntregaRango[]): string | null {
  const sorted = [...rangos].sort((a, b) => a.pagos_desde.localeCompare(b.pagos_desde))

  for (let i = 0; i < sorted.length; i++) {
    const actual = sorted[i]
    const desde = parseDateOnly(actual.pagos_desde)
    const hasta = parseDateOnly(actual.pagos_hasta)

    if (!desde || !hasta) return 'Todas las fechas de habilitación / pago son obligatorias'
    if (hasta < desde) return 'En cada periodo, "hasta" debe ser mayor o igual a "desde"'
    if (!actual.fecha_entrega) return 'La fecha de entrega es obligatoria'
    if (!actual.hora) return 'La hora de entrega es obligatoria'

    if (i > 0) {
      const prevHasta = parseDateOnly(sorted[i - 1].pagos_hasta)

      if (prevHasta && desde <= prevHasta) {
        return 'Los periodos de habilitación / pago no pueden superponerse'
      }
    }
  }

  return null
}
