import { z } from 'zod'

import { isValidCelular } from '@/utils/functions/validatePhone'

/**
 * Schema para login
 */
export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido'),
  contrasena: z
    .string()
    .trim()
    .min(1, 'La contraseña es requerida')
})

export type LoginDto = z.infer<typeof loginSchema>

/**
 * Schema para registro de usuario
 */
export const registerSchema = z
  .object({
    correo: z
      .string()
      .trim()
      .min(1, 'El correo es requerido')
      .email('Correo electrónico inválido'),
    contrasena: z
      .string()
      .trim()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      ),
    confirmarContrasena: z
      .string()
      .trim()
      .min(1, 'Confirma tu contraseña'),
    nombre: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres'),
    apellido: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'El apellido no puede exceder 50 caracteres'),
    tipo_documento: z
      .enum(['DNI', 'CE', 'PASAPORTE', 'OTRO']),
    numero_documento: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    celular: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine(isValidCelular, 'Número de celular inválido para el país seleccionado')
  })
  .refine((data) => data.contrasena === data.confirmarContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarContrasena']
  })
  .superRefine((data, ctx) => {
    if (data.tipo_documento === 'DNI' && data.numero_documento) {
      if (!/^\d{8}$/.test(data.numero_documento)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El DNI debe tener exactamente 8 dígitos',
          path: ['numero_documento'],
        });
      }
    }
  })

export type RegisterDto = z.infer<typeof registerSchema>

/**
 * Schema para cambiar contraseña
 */
export const changePasswordSchema = z
  .object({
    contrasenaActual: z
      .string()
      .trim()
      .min(1, 'La contraseña actual es requerida'),
    nuevaContrasena: z
      .string()
      .trim()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      ),
    confirmarNuevaContrasena: z
      .string()
      .trim()
      .min(1, 'Confirma tu nueva contraseña')
  })
  .refine((data) => data.nuevaContrasena === data.confirmarNuevaContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarNuevaContrasena']
  })

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>

/**
 * Schema para solicitar recuperación de contraseña
 */
export const forgotPasswordSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido')
})

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>

/**
 * Schema para verificar OTP
 */
export const otpSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido'),
  codigo: z
    .string()
    .trim()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos')
})

export type OtpDto = z.infer<typeof otpSchema>

/**
 * Schema para resetear contraseña con OTP
 */
export const resetPasswordSchema = z
  .object({
    correo: z
      .string()
      .trim()
      .min(1, 'El correo es requerido')
      .email('Correo electrónico inválido'),
    codigo: z
      .string()
      .trim()
      .min(6, 'El código debe tener 6 dígitos')
      .max(6, 'El código debe tener 6 dígitos'),
    nuevaContrasena: z
      .string()
      .trim()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      ),
    confirmarNuevaContrasena: z
      .string()
      .trim()
      .min(1, 'Confirma tu nueva contraseña')
  })
  .refine((data) => data.nuevaContrasena === data.confirmarNuevaContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarNuevaContrasena']
  })

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>
