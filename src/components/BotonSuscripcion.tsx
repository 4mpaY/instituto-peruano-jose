'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Culqi: any
    culqi: any
  }
}

type Plan = {
  id: string
  nombre: string
  precio: number
  moneda: string
}

type BotonSuscripcionProps = {
  plan: Plan
}

export function BotonSuscripcion({ plan }: BotonSuscripcionProps) {
  useEffect(() => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-culqi-subscription="true"]')

    const s = existingScript ?? document.createElement('script')

    s.src = 'https://checkout.culqi.com/js/v4'
    s.async = true
    s.dataset.culqiSubscription = 'true'

    const handleLoad = () => {
      if (!window.Culqi) return

      window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || ''
      window.Culqi.settings({
        title: plan.nombre,
        currency: plan.moneda,
        amount: Math.round(plan.precio * 100),
      })

      window.culqi = async () => {
        if (!window.Culqi.token) return

        await fetch('/api/suscripciones/crear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: plan.id, token_id: window.Culqi.token.id }),
        })

        window.location.href = '/dashboard'
      }
    }

    if (!existingScript) {
      s.addEventListener('load', handleLoad)
      document.body.appendChild(s)
    } else if (window.Culqi) {
      handleLoad()
    } else {
      s.addEventListener('load', handleLoad)
    }

    return () => {
      s.removeEventListener('load', handleLoad)
    }
  }, [plan.id, plan.nombre, plan.moneda, plan.precio])

  return (
    <button onClick={() => window.Culqi?.open()}>
      Suscribirse — {plan.moneda} {plan.precio}
    </button>
  )
}
