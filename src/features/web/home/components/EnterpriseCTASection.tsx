'use client'

/* ─────────────────────────────────────────────
   EnterpriseCTASection — fondo Lime
   CTA para agendar reunión corporativa.
   ───────────────────────────────────────────── */

import { Calendar, Zap, Shield, HeadphonesIcon } from 'lucide-react'

// Simple WhatsApp SVG icon
const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
)

import { useConfig } from '@/contexts/ConfigContext'

import ScrollReveal from './ScrollReveal'
import { sectionH2, sectionDesc, cardTitle, cardBody, smallText } from './typography'

const WHATSAPP_MSG = encodeURIComponent('Hola, me gustaría agendar una reunión para explorar sus planes corporativos.')

const bullets = [
  { icon: Zap, text: 'Planes desde 5 hasta 100+ colaboradores' },
  { icon: Shield, text: 'Facturación a nombre de empresa con RUC' },
  { icon: HeadphonesIcon, text: 'Soporte dedicado 24 / 7' },
]

export default function EnterpriseCTASection() {
  const configs = useConfig()
  const waNumber = configs.WHATSAPP_NUMERO_EMPRESAS || configs.WHATSAPP_NUMERO || '51901931739'
  const waLink = `https://wa.me/${waNumber}?text=${WHATSAPP_MSG}`

  return (
    <section
      style={{
        backgroundColor: 'var(--web-light, #BDD962)',
        padding: '5rem 1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decoración geométrica fondo */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          backgroundColor: 'rgba(var(--web-dark-rgb, 2, 94, 68),0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          backgroundColor: 'rgba(var(--web-dark-rgb, 2, 94, 68),0.06)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          {/* ── Izquierda: texto ── */}
          <ScrollReveal direction="left">
            <div>
              {/* Eyebrow */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(var(--web-dark-rgb, 2, 94, 68),0.12)',
                  borderRadius: '999px',
                  padding: '0.375rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <Calendar size={14} color="var(--web-dark, #025E44)" />
                <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--web-dark, #025E44)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                  Para empresas
                </span>
              </div>

              <h2 style={{ ...sectionH2, marginBottom: '1rem' }}>
                ¿Capacitas equipos<br />en tu empresa?
              </h2>
              <p style={{ ...sectionDesc, color: 'rgba(10,10,10,0.6)', marginBottom: '2rem', maxWidth: '440px' }}>
                Agenda una reunión gratuita con nuestro equipo y descubre cómo podemos diseñar un plan de formación a medida para tus colaboradores.
              </p>

              {/* Bullets */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
                {bullets.map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(var(--web-dark-rgb, 2, 94, 68),0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <b.icon size={16} color="var(--web-dark, #025E44)" />
                    </div>
                    <span style={{ ...cardBody, color: '#0A0A0A', fontWeight: 500 }}>
                      {b.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* ── Derecha: botones ── */}
          <ScrollReveal direction="right" delay={0.15}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: '2.5rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(var(--web-light-rgb, 189, 217, 98),0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    border: '2px solid rgba(var(--web-light-rgb, 189, 217, 98),0.3)',
                  }}
                >
                  <Calendar size={36} color="var(--web-dark, #025E44)" />
                </div>
                <h3 style={{ ...cardTitle, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  Reunión sin costo
                </h3>
                <p style={cardBody}>
                  30 minutos para entender tus necesidades y presentarte nuestra propuesta de valor.
                </p>
              </div>

              {/* Botón principal */}
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '14px',
                  backgroundColor: 'var(--web-dark, #025E44)',
                  color: '#ffffff',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  textDecoration: 'none',
                  marginBottom: '0.75rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(var(--web-dark-rgb, 2, 94, 68),0.25)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement

                  el.style.backgroundColor = '#014d37'
                  el.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement

                  el.style.backgroundColor = 'var(--web-dark, #025E44)'
                  el.style.transform = 'scale(1)'
                }}
              >
                <Calendar size={18} />
                Agendar reunión gratuita
              </a>

              {/* Botón secundario WhatsApp */}
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.625rem',
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '14px',
                  backgroundColor: 'transparent',
                  color: '#25D366',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  textDecoration: 'none',
                  border: '2px solid #25D366',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement

                  el.style.backgroundColor = '#25D366'
                  el.style.color = '#ffffff'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement

                  el.style.backgroundColor = 'transparent'
                  el.style.color = '#25D366'
                }}
              >
                <WhatsAppIcon size={18} />
                Hablar por WhatsApp
              </a>

              {/* Nota */}
              <p style={{ ...smallText, textAlign: 'center', marginTop: '1rem' }}>
                Sin compromisos · Respuesta en menos de 24 h
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
