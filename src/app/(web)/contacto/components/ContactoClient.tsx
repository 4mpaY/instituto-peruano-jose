'use client'

import Link from 'next/link'

import { Phone, Mail, MapPin } from 'lucide-react'

import ScrollReveal from '@/features/web/home/components/ScrollReveal'
import { useConfig } from '@/contexts/ConfigContext'

export function ContactList() {
  const configs = useConfig()
  const waNumber = configs.WHATSAPP_NUMERO || '51901931739'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
      {[
        { icon: MapPin, title: 'Ubicación', info: 'Arequipa, Perú' },
        { icon: Phone, title: 'WhatsApp', info: `+${waNumber}`, href: `https://wa.me/${waNumber}` },
        { icon: Mail, title: 'Email', info: 'ipg.ingenieros.contacto@gmail.com', href: 'mailto:ipg.ingenieros.contacto@gmail.com' },
      ].map((item, i) => (
        <ScrollReveal key={i} delay={i * 0.1}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
              border: '1.5px solid hsl(214,20%,91%)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              transition: 'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget

              el.style.transform = 'translateY(-4px)'
              el.style.boxShadow = '0 12px 32px rgba(var(--web-primary-rgb, 37, 146, 127),0.12)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget

              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(var(--web-primary-rgb, 37, 146, 127), 0.1)', marginBottom: '1.25rem' }}>
              <item.icon style={{ width: '28px', height: '28px', color: 'var(--web-primary, #25927F)' }} />
            </div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              {item.title}
            </h3>
            {item.href ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--web-dark, #025E44)', textDecoration: 'none' }}>
                {item.info}
              </a>
            ) : (
              <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b' }}>
                {item.info}
              </p>
            )}
          </div>
        </ScrollReveal>
      ))}
    </div>
  )
}

export function ContactActions() {
  const configs = useConfig()
  const waNumber = configs.WHATSAPP_NUMERO || '51901931739'

  return (
    <ScrollReveal>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: '9999px',
            backgroundColor: 'var(--web-primary, #25927F)', color: '#ffffff', fontFamily: 'Poppins, sans-serif',
            fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none', transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--web-dark, #025E44)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--web-primary, #25927F)' }}
        >
          <Phone size={18} />
          Enviar WhatsApp
        </a>
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', padding: '0.875rem 2rem', borderRadius: '9999px',
            border: '2px solid var(--web-primary, #25927F)', color: 'var(--web-primary, #25927F)',
            fontFamily: 'Poppins, sans-serif', fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--web-primary, #25927F)'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--web-primary, #25927F)'
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </ScrollReveal>
  )
}
