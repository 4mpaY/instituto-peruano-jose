'use client'

/* ─────────────────────────────────────────────
   CompaniesSection — B2B informativo
   • Stats destacadas
   • Lista de beneficios
   • Botón WhatsApp
   ───────────────────────────────────────────── */

import { CheckCircle, Users, Building2, TrendingUp } from 'lucide-react'

// Simple WhatsApp SVG icon
const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
)

import { useConfig } from '@/contexts/ConfigContext'

import ScrollReveal from './ScrollReveal'
import { eyebrow, sectionH2, sectionDesc, cardTitle, cardBody, smallText } from './typography'

const WHATSAPP_MSG = encodeURIComponent('Hola, me interesa conocer las opciones corporativas para capacitar a mi equipo.')

const stats = [
  { icon: Building2, value: 'Empresas', label: 'Descuentos por volumen' },
  { icon: Users, value: 'Equipos', label: 'Crecimiento profesional' },
  { icon: TrendingUp, value: 'Reportes', label: 'Seguimiento de avance' },
]

const benefits = [
  'Descuentos especiales por volumen de inscripciones',
  'Accesos personalizados para cada colaborador',
  'Asesoría personalizada para elegir la ruta de aprendizaje ideal',
  'Certificados válidos que respaldan las habilidades de tu equipo',
]

export default function CompaniesSection() {
  const configs = useConfig()
  const waNumber = configs.WHATSAPP_NUMERO_EMPRESAS || configs.WHATSAPP_NUMERO || '51901931739'
  const waLink = `https://wa.me/${waNumber}?text=${WHATSAPP_MSG}`

  return (
    <section style={{ backgroundColor: 'hsl(167, 30%, 96%)', padding: '5rem 1rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* ── Izquierda ── */}
          <ScrollReveal direction="left">
            <div>
              <p style={eyebrow}>Soluciones corporativas</p>
              <h2 style={sectionH2}>
                Capacita a tu equipo<br />
                <span style={{ color: 'var(--web-primary, #25927F)' }}>sin complicaciones</span>
              </h2>
              <p style={{ ...sectionDesc, marginBottom: '2rem' }}>
                Ofrecemos planes especiales para empresas que quieren mantener a sus colaboradores actualizados y certificados en las últimas tendencias del sector.
              </p>

              {/* Beneficios */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
                {benefits.map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <CheckCircle size={18} style={{ color: 'var(--web-primary, #25927F)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ ...cardBody, color: '#334155' }}>{b}</span>
                  </li>
                ))}
              </ul>

              {/* CTA WhatsApp */}
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.875rem 2rem',
                  borderRadius: '14px',
                  backgroundColor: '#025f4b',
                  color: '#ffffff',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(2, 95, 75, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement

                  el.style.backgroundColor = '#03725b'
                  el.style.transform = 'scale(1.03)'
                  el.style.boxShadow = '0 6px 25px rgba(2, 95, 75, 0.4)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement

                  el.style.backgroundColor = '#025f4b'
                  el.style.transform = 'scale(1)'
                  el.style.boxShadow = '0 4px 20px rgba(2, 95, 75, 0.3)'
                }}
              >
                <WhatsAppIcon size={20} />
                Consultar por WhatsApp
              </a>
            </div>
          </ScrollReveal>

          {/* ── Derecha: stats ── */}
          <ScrollReveal direction="right" delay={0.15}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {stats.map((stat, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    border: '1.5px solid hsl(167, 30%, 89%)',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement

                    el.style.transform = 'translateX(8px)'
                    el.style.boxShadow = '0 8px 32px rgba(var(--web-primary-rgb, 37, 146, 127),0.12)'
                    el.style.borderColor = 'var(--web-primary, #25927F)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement

                    el.style.transform = 'translateX(0)'
                    el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'
                    el.style.borderColor = 'hsl(167, 30%, 89%)'
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(var(--web-primary-rgb, 37, 146, 127),0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <stat.icon size={28} color="var(--web-primary, #25927F)" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#0A0A0A', lineHeight: 1, letterSpacing: '-0.03em' }}>
                      {stat.value}
                    </div>
                    <div style={{ ...smallText, color: '#64748b', marginTop: '0.25rem' }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}

              {/* Card decorativa */}
              <div
                style={{
                  borderRadius: '20px',
                  padding: '1.5rem 2rem',
                  background: 'linear-gradient(135deg, var(--web-dark, #025E44) 0%, var(--web-primary, #25927F) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <span style={{ fontSize: '2rem' }}>🏆</span>
                <div>
                  <div style={{ ...cardTitle, color: '#ffffff', marginBottom: '0.25rem' }}>
                    Certificados con validez empresarial
                  </div>
                  <div style={{ ...smallText, color: 'rgba(255,255,255,0.65)' }}>
                    Reconocidos por las principales empresas del sector
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
