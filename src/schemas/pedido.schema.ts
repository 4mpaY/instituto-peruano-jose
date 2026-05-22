import { z } from 'zod'
import { MetodoPago } from '@prisma/client'

/**
 * Schema para crear un pedido manual (Admin)
 */
export const crearPedidoManualSchema = z.object({
  usuarios_ids: z.array(z.string().uuid('ID de usuario inválido')).min(1, 'Selecciona al menos un estudiante'),
  cursos_ids: z.array(z.string().uuid('ID de curso inválido')).min(1, 'Selecciona al menos un curso'),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo').max(1000000, 'El precio es demasiado alto'),
  estado: z.enum(['PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'CANCELADO', 'REEMBOLSADO']).default('COMPLETADO'),
  metodo_pago: z.nativeEnum(MetodoPago).default(MetodoPago.TRANSFERENCIA),
  mensaje: z.string().trim().max(500, 'El mensaje no puede exceder 500 caracteres').optional(),
  tipo_comprobante: z.string().optional().nullable(),
  numero_comprobante: z.string().optional().nullable()
})

export type CrearPedidoManualDto = z.infer<typeof crearPedidoManualSchema>

/**
 * Schema para query params de listado de pedidos
 */
export const listarPedidosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(5000).default(10),
  estado: z.string().default('COMPLETADO'),
  buscar: z.string().trim().optional(),
  nro_pedido: z.string().trim().optional(),
  nombre: z.string().trim().optional()
})

export type ListarPedidosQuery = z.infer<typeof listarPedidosQuerySchema>

/**
 * Schema para actualizar un pedido (Admin)
 */
export const updatePedidoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'CANCELADO', 'REEMBOLSADO']),
  metodo_pago: z.nativeEnum(MetodoPago).optional(),
  mensaje: z.string().trim().max(1000).optional().nullable(),
  tipo_comprobante: z.string().optional().nullable(),
  numero_comprobante: z.string().optional().nullable()
})

export type UpdatePedidoDto = z.infer<typeof updatePedidoSchema>
