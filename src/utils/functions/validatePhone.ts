import { isValidPhoneNumber } from 'libphonenumber-js'

/**
 * Valida que el celular tenga la cantidad de dígitos correcta para su país
 * (según el prefijo internacional, ej. +51 exige 9 dígitos en Perú).
 * Un valor vacío se considera válido; la obligatoriedad se controla aparte.
 */
export function isValidCelular(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true

  return isValidPhoneNumber(value)
}
