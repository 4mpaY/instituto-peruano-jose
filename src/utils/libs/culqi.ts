import crypto from 'crypto'

const BASE = 'https://api.culqi.com/v2'
const KEY = process.env.CULQI_SECRET_KEY!

async function req(method: string, path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await res.json()

  if (!res.ok) throw new Error(data.user_message ?? 'Error Culqi')

  return data
}

export const culqi = {
  crearCliente: (email: string, nombre: string, apellido: string) =>
    req('POST', '/customers', {
      email,
      first_name: nombre,
      last_name: apellido,
      address: '-',
      address_city: 'Lima',
      country_code: 'PE',
      phone_number: '999999999'
    }),

  crearSuscripcion: (plan_id: string, token_id: string, metadata?: object) =>
    req('POST', '/subscriptions', { plan_id, token_id, metadata }),

  cancelarSuscripcion: (id: string) => req('DELETE', `/subscriptions/${id}`),

  verificarFirma: (payload: string, firma: string) => {
    const expected = crypto.createHmac('sha256', process.env.CULQI_WEBHOOK_SECRET!).update(payload).digest('hex')

    return expected === firma
  }
}
