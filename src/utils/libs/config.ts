import prisma from './prisma'

/**
 * Utilidad para obtener configuraciones desde la base de datos.
 * Incluye un pequeño caché en memoria para optimizar lecturas frecuentes.
 */

let configCache: Record<string, string> | null = null
let lastFetch = 0
const CACHE_TTL = 1000 * 60 * 5 // 5 minutos (modificado para recarga)

export async function getConfigs(): Promise<Record<string, string>> {
  const now = Date.now()

  if (configCache && now - lastFetch < CACHE_TTL) {
    return configCache
  }

  try {
    const dbConfigs = await prisma.configuracion.findMany()
    const map: Record<string, string> = {}

    dbConfigs.forEach(c => {
      map[c.clave] = c.valor
    })

    configCache = map
    lastFetch = now

    return map
  } catch {
    // Durante el build time, la DB puede no estar disponible.
    // Se retorna un objeto vacío y los valores por defecto del código aplican como fallback.
    return {}
  }
}

export async function getConfig(clave: string, defaultValue: string = ''): Promise<string> {
  const configs = await getConfigs()

  return configs[clave] ?? defaultValue
}

export function clearConfigCache() {
  configCache = null
}
