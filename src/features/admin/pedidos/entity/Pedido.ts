import type { EstadoPedido, MetodoPago } from '@prisma/client'

export interface Pedido {
  id: string
  numero_pedido: number
  estado: EstadoPedido
  metodo_pago: MetodoPago | null
  total: number
  moneda: string
  mensaje: string | null
  tipo_comprobante: string | null
  numero_comprobante: string | null
  comprobante_url: string | null
  comprobante_subido_en: string | null
  transaccion_id: string | null
  creado_en: string
  pagado_en: string | null
  usuario_id: string
  usuario: {
    id: string
    nombre: string
    apellido: string
    correo: string
    avatar: string | null
  }
  cupon?: {
    codigo: string
  } | null
  metodo_pago_manual?: {
    nombre: string
    numero_cuenta: string | null
    nombre_cuenta: string | null
  } | null
  detalles: DetallePedido[]
}

export interface DetallePedido {
  id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  total: number
  curso_id: string
  curso: {
    titulo: string
  }
}
