import { z } from 'zod'

// ---------------------------------------------------------------------------
// Crear Curso (Paso 1 del wizard: info básica)
// ---------------------------------------------------------------------------
export const crearCursoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  descripcion: z.string().trim().max(5000, 'La descripción no puede exceder 5000 caracteres').optional(),
  categoria_id: z.string().uuid('ID de categoría inválido').optional().nullable(),
  profesor_id: z.string().uuid('ID de profesor inválido'),
  tipo_emision: z.enum(['SINCRONO', 'ASINCRONO', 'MIXTO']).default('ASINCRONO'),

  // Paso 2: Configuración y precio (opcional al crear)
  es_gratis: z.boolean().default(false),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo').default(0),
  precio_falso: z.coerce.number().min(0, 'El precio falso no puede ser negativo').default(0),
  moneda: z.string().max(3).default('PEN'),
  duracion: z.string().max(50).optional().nullable(),
  codigo: z.string().max(20).optional().nullable(),

  // Paso 3: Media (opcional al crear)
  miniatura: z.string().optional().nullable(),
  video_presentacion: z.string().optional().nullable(),
  brochure: z.string().optional().nullable(),
  fecha_inicio: z.string().optional().nullable(),
  fecha_fin: z.string().optional().nullable(),
  vigencia_meses: z.coerce.number().int().positive().optional().nullable(),
  nivel: z.enum(['BASICO', 'INTERMEDIO', 'AVANZADO']).default('BASICO')
})

export type CrearCursoDto = z.infer<typeof crearCursoSchema>

// ---------------------------------------------------------------------------
// Actualizar Curso
// ---------------------------------------------------------------------------
export const actualizarCursoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .optional(),
  descripcion: z.string().trim().max(5000, 'La descripción no puede exceder 5000 caracteres').optional().nullable(),
  categoria_id: z.string().uuid('ID de categoría inválido').optional().nullable(),
  profesor_id: z.string().uuid('ID de profesor inválido').optional(),
  tipo_emision: z.enum(['SINCRONO', 'ASINCRONO', 'MIXTO']).optional(),
  nivel: z.enum(['BASICO', 'INTERMEDIO', 'AVANZADO']).optional(),
  es_gratis: z.boolean().optional(),
  es_privado: z.boolean().optional(),
  completar_automatico: z.boolean().optional(),
  precio_certificado: z.coerce.number().min(0).optional().nullable(),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo').optional(),
  precio_falso: z.coerce.number().min(0, 'El precio falso no puede ser negativo').optional(),
  moneda: z.string().max(3).optional(),
  duracion: z.string().max(50).optional().nullable(),
  codigo: z.string().max(20).optional().nullable(),
  miniatura: z.string().optional().nullable(),
  video_presentacion: z.string().optional().nullable(),
  brochure: z.string().optional().nullable(),
  fecha_inicio: z.string().optional().nullable(),
  fecha_fin: z.string().optional().nullable(),
  vigencia_meses: z.coerce.number().int().positive().optional().nullable(),
  objetivos: z.array(z.string()).optional(),
  metodologia: z.array(z.any()).optional(),
  beneficios: z.array(z.any()).optional(),
  incluye: z.array(z.any()).optional()
})

export type ActualizarCursoDto = z.infer<typeof actualizarCursoSchema>

// ---------------------------------------------------------------------------
// Cambiar estado del curso
// ---------------------------------------------------------------------------
export const cambiarEstadoCursoSchema = z.object({
  estado: z.enum(['BORRADOR', 'PUBLICADO', 'ARCHIVADO'])
})

export type CambiarEstadoCursoDto = z.infer<typeof cambiarEstadoCursoSchema>

// ---------------------------------------------------------------------------
// Query params para listar cursos
// ---------------------------------------------------------------------------
export const listarCursosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  buscar: z.string().optional(),
  estado: z.enum(['BORRADOR', 'PUBLICADO', 'ARCHIVADO', '']).optional(),
  categoria_id: z.string().uuid().optional(),
  profesor_id: z.string().uuid().optional()
})

export type ListarCursosQuery = z.infer<typeof listarCursosQuerySchema>
