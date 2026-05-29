import { NextResponse } from 'next/server'
import { culqi } from '@/lib/culqi'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const payload = await req.text()
    const signature = req.headers.get('x-culqi-signature') ?? ''

    if (!culqi.verificarFirma(payload, signature)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    const { type, data } = JSON.parse(payload)
    const id = data.object.id

    if (type === 'subscription.payment.succeeded') {
      await prisma.suscripcion.updateMany({
        where: { culqi_suscripcion_id: id },
        data: {
          estado: 'ACTIVO',
          fecha_fin: new Date(data.object.current_period_end * 1000)
        }
      })
    }

    if (type === 'subscription.payment.failed') {
      await prisma.suscripcion.updateMany({
        where: { culqi_suscripcion_id: id },
        data: { estado: 'VENCIDO' }
      })
    }

    if (type === 'subscription.cancelled') {
      await prisma.suscripcion.updateMany({
        where: { culqi_suscripcion_id: id },
        data: { estado: 'CANCELADO' }
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[CULQI_WEBHOOK_ERROR]', error)

    return NextResponse.json({ error: 'Error al procesar webhook' }, { status: 500 })
  }
}
