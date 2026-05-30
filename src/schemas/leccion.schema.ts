import { z } from 'zod'

// ---------------------------------------------------------------------------
// Crear Lección
// ---------------------------------------------------------------------------
export const crearLeccionSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  contenido: z.string().max(10000, 'El contenido no puede exceder 10000 caracteres').optional().nullable(),
  duracion: z.coerce.number().int().min(0).optional().nullable(),
  enlace_reunion: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  es_en_vivo: z.boolean().optional().default(false),
  fecha_programada: z.string().datetime().optional().nullable(),
  fecha_fin: z.string().datetime().optional().nullable(),
  recursos: z.array(z.any()).optional(),
  es_vista_previa: z.boolean().optional()
})

export type CrearLeccionDto = z.infer<typeof crearLeccionSchema>

// ---------------------------------------------------------------------------
// Actualizar Lección
// ---------------------------------------------------------------------------
export const actualizarLeccionSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .optional(),
  contenido: z.string().max(10000, 'El contenido no puede exceder 10000 caracteres').optional().nullable(),
  duracion: z.coerce.number().int().min(0).optional().nullable(),
  enlace_reunion: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  es_en_vivo: z.boolean().optional(),
  fecha_programada: z.string().datetime().optional().nullable(),
  fecha_fin: z.string().datetime().optional().nullable(),
  recursos: z.array(z.any()).optional(),
  estado: z.enum(['BORRADOR', 'PUBLICADO']).optional(),
  es_vista_previa: z.boolean().optional()
})

export type ActualizarLeccionDto = z.infer<typeof actualizarLeccionSchema>

// ---------------------------------------------------------------------------
// Reordenar Lecciones
// ---------------------------------------------------------------------------
export const reordenarLeccionesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        orden: z.number().int().min(0)
      })
    )
    .min(1, 'Se requiere al menos un item')
})

export type ReordenarLeccionesDto = z.infer<typeof reordenarLeccionesSchema>
