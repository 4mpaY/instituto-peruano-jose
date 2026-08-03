import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

const DEFAULT_COUNTRY: CountryCode = 'PE'

/**
 * Normaliza el celular a E.164 (ej. +51987654321).
 * Si viene sin prefijo internacional, asume el país por defecto (PE),
 * igual que MuiTelInput con defaultCountry="PE".
 */
export function normalizeCelular(
  value: string | null | undefined,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): string {
  if (!value || !value.trim()) return ''

  const parsed = parsePhoneNumberFromString(value.trim(), defaultCountry)

  return parsed?.isValid() ? parsed.format('E.164') : value.trim()
}

/**
 * Valida que el celular tenga la cantidad de dígitos correcta para su país
 * (según el prefijo internacional, ej. +51 exige 9 dígitos en Perú).
 * Un valor vacío se considera válido; la obligatoriedad se controla aparte.
 *
 * Acepta números locales sin "+" (comunes al precargar desde BD con MuiTelInput),
 * validándolos con el país por defecto.
 */
export function isValidCelular(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true

  const parsed = parsePhoneNumberFromString(value.trim(), DEFAULT_COUNTRY)

  return !!parsed?.isValid()
}
