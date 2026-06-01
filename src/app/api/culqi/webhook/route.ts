import { NextResponse } from 'next/server'

import { culqi } from '@/lib/culqi'

export async function POST(req: Request) {
  try {
    const payload = await req.text()
    const signature = req.headers.get('x-culqi-signature') ?? ''

    if (!culqi.verificarFirma(payload, signature)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    // Ignorar eventos de suscripciones de Culqi (se eliminaron en el código)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[CULQI_WEBHOOK_ERROR]', error)

    return NextResponse.json({ error: 'Error al procesar webhook' }, { status: 500 })
  }
}
