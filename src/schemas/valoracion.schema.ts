import { z } from 'zod'

export const valoracionSchema = z.object({
  puntuacion: z.number().min(1, 'La puntuación es requerida').max(5),
  comentario: z.string().max(500, 'El comentario no puede exceder los 500 caracteres').optional().nullable()
})

export type ValoracionFormData = z.infer<typeof valoracionSchema>
