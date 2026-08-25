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
  metodo_pago_manual_id: z.string().optional().nullable(),
  mensaje: z.string().trim().max(500, 'El mensaje no puede exceder 500 caracteres').optional(),
  tipo_comprobante: z.string().optional().nullable(),
  numero_comprobante: z.string().optional().nullable(),
  tipo_pedido: z.enum(['CURSO', 'CERTIFICADO']).default('CURSO'),
  tipo_certificado: z.enum(['IPG', 'CIP']).optional().nullable(),
  fecha_entrega_estimada: z.union([z.string(), z.date()]).optional().nullable(),
})

export type CrearPedidoManualDto = z.infer<typeof crearPedidoManualSchema>

/**
 * Schema para query params de listado de pedidos
 */
export const listarPedidosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(5000).default(10),

  // TODOS por defecto: los pedidos de certificado quedan PENDIENTES hasta validar pago
  estado: z.string().default('TODOS'),
  buscar: z.string().trim().optional(),
  nro_pedido: z.string().trim().optional(),
  nombre: z.string().trim().optional(),
  cursoId: z.string().trim().optional()
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
  numero_comprobante: z.string().optional().nullable(),
  referencia_pago: z.string().trim().max(200).optional().nullable(),
  fecha_entrega_estimada: z.union([z.string(), z.date()]).optional().nullable(),
  comprobante_url: z.string().optional().nullable(),
})

export type UpdatePedidoDto = z.infer<typeof updatePedidoSchema>
