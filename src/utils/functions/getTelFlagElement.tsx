import * as Flags from 'country-flag-icons/react/3x2'

import type { MuiTelInputCountry } from 'mui-tel-input'

/**
 * Renderiza banderas locales (bundled) en vez de las que trae mui-tel-input
 * por defecto, que se cargan desde flagcdn.com y fallan si ese dominio está
 * bloqueado o inaccesible.
 */
export function getTelFlagElement(isoCode: MuiTelInputCountry, { countryName }: { countryName: string }) {
  const FlagComponent = (Flags as Record<string, React.ComponentType<React.SVGAttributes<HTMLElement>>>)[isoCode]

  if (!FlagComponent) return null

  return <FlagComponent aria-label={countryName} style={{ width: 26, height: 20, borderRadius: 2 }} />
}
