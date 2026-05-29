import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { culqi } from '@/lib/culqi'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { plan_id, token_id } = await req.json()

    if (!plan_id || !token_id) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const userId = (session as any).user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    const [usuario, plan] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: userId } }),
      prisma.planSuscripcion.findUnique({ where: { id: plan_id } })
    ])

    if (!usuario || !plan) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const customer = await culqi.crearCliente(usuario.correo, usuario.nombre, usuario.apellido)

    const sub = await culqi.crearSuscripcion(plan.culqi_plan_id, token_id, {
      usuario_id: userId,
      customer_id: customer.id
    })

    await prisma.suscripcion.upsert({
      where: { usuario_id_plan_id: { usuario_id: userId, plan_id } },
      create: {
        culqi_suscripcion_id: sub.id,
        estado: 'PENDIENTE',
        usuario_id: userId,
        plan_id
      },
      update: {
        culqi_suscripcion_id: sub.id,
        estado: 'PENDIENTE'
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[SUSCRIPCION_CULQI_ERROR]', error)

    return NextResponse.json({ error: 'Error al crear la suscripción' }, { status: 500 })
  }
}
