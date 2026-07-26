import { z } from 'zod'

/**
 * Schema para crear usuario (Admin)
 */
export const crearUsuarioSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido'),
  contrasena: z
    .string()
    .trim()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
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
    .enum(['DNI', 'CE', 'PASAPORTE', 'OTRO'])
    .optional()
    .default('DNI'),
  numero_documento: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  celular: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{9,20}$/, 'Formato de celular inválido (puede incluir +)')
    .optional()
    .or(z.literal('')),
  rol: z
    .enum(['ADMIN', 'PROFESOR', 'ESTUDIANTE'])
    .optional()
    .default('ESTUDIANTE'),
  biografia: z
    .string()
    .trim()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional(),
  avatar: z
    .string()
    .trim()
    .url('URL de avatar inválida')
    .optional(),
  esta_activo: z
    .boolean()
    .optional()
    .default(true),
  cargo: z
    .string()
    .trim()
    .max(100, 'El cargo no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  firma: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
}).superRefine((data, ctx) => {
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

export type CrearUsuarioDto = z.infer<typeof crearUsuarioSchema>

/**
 * Schema para actualizar usuario
 */
export const actualizarUsuarioSchema = z.object({
  correo: z
    .string()
    .trim()
    .email('Correo electrónico inválido')
    .optional(),
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .optional(),
  apellido: z
    .string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .optional(),
  tipo_documento: z
    .enum(['DNI', 'CE', 'PASAPORTE', 'OTRO'])
    .optional(),
  numero_documento: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  celular: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{9,20}$/, 'Formato de celular inválido (puede incluir +)')
    .optional()
    .or(z.literal('')),
  rol: z
    .enum(['ADMIN', 'PROFESOR', 'ESTUDIANTE'])
    .optional(),
  biografia: z
    .string()
    .trim()
    .optional(),
  avatar: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  esta_activo: z
    .boolean()
    .optional(),
  contrasena: z
    .string()
    .trim()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .optional(),
  cargo: z
    .string()
    .trim()
    .max(100, 'El cargo no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  firma: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
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

export type ActualizarUsuarioDto = z.infer<typeof actualizarUsuarioSchema>

/**
 * Schema para actualizar perfil propio
 */
export const actualizarPerfilSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .optional(),
  apellido: z
    .string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .optional(),
  tipo_documento: z
    .enum(['DNI', 'CE', 'PASAPORTE', 'OTRO'])
    .optional(),
  numero_documento: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  celular: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{9,20}$/, 'Formato de celular inválido (puede incluir +)')
    .optional()
    .or(z.literal('')),
  biografia: z
    .string()
    .trim()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional(),
  avatar: z
    .string()
    .trim()
    .url('URL de avatar inválida')
    .optional(),
  cargo: z
    .string()
    .trim()
    .max(100, 'El cargo no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  firma: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
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

export type ActualizarPerfilDto = z.infer<typeof actualizarPerfilSchema>

/**
 * Schema para query params de listado de usuarios
 */
export const listarUsuariosQuerySchema = z.object({
  page: z
    .coerce
    .number()
    .int()
    .positive()
    .default(1),
  limit: z
    .coerce
    .number()
    .int()
    .positive()
    .max(1000)
    .default(10),
  rol: z
    .enum(['ADMIN', 'PROFESOR', 'ESTUDIANTE'])
    .optional(),
  buscar: z
    .string()
    .trim()
    .optional(),
  esta_activo: z
    .coerce
    .boolean()
    .optional()
})

export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>
