export function calcularFechaCaducidadCurso(fechaInscripcion: Date, vigenciaMeses?: number | null): Date | null {
  if (!vigenciaMeses || vigenciaMeses <= 0) {
    return null
  }

  const fecha = new Date(fechaInscripcion)
  const diaOriginal = fecha.getDate()
  const horas = fecha.getHours()
  const minutos = fecha.getMinutes()
  const segundos = fecha.getSeconds()
  const milisegundos = fecha.getMilliseconds()

  fecha.setDate(1)
  fecha.setMonth(fecha.getMonth() + vigenciaMeses)

  const ultimoDiaDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate()

  fecha.setDate(Math.min(diaOriginal, ultimoDiaDelMes))
  fecha.setHours(horas, minutos, segundos, milisegundos)

  return fecha
}

export function esAccesoCursoVigente(accesoHasta: Date | null | undefined, referencia = new Date()): boolean {
  return !accesoHasta || referencia <= accesoHasta
}
