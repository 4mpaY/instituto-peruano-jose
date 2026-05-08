'use client'

import { useState } from 'react'

import { useConfig } from '@/contexts/ConfigContext'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
)

const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  left: '64px',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'rgba(15, 23, 42, 0.85)',
  color: '#ffffff',
  fontSize: '0.72rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  padding: '5px 10px',
  borderRadius: '6px',
  pointerEvents: 'none',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
}

export default function FloatingContactButtons() {
  const [hoveredWa, setHoveredWa] = useState(false)
  const [hoveredPhone, setHoveredPhone] = useState(false)
  const configs = useConfig()
  const waNumber = configs.WHATSAPP_NUMERO || '51901931739'
  const phoneNumber = waNumber.startsWith('+') ? waNumber : `+${waNumber}`

  return (
    <div
      style={{
        position: 'fixed',
        left: '20px',
        bottom: '40px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* WhatsApp */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: '#25D366',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: hoveredWa ? '0 6px 20px rgba(37, 211, 102, 0.6)' : '0 4px 16px rgba(37, 211, 102, 0.45)',
            transform: hoveredWa ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            textDecoration: 'none',
          }}
          onMouseEnter={() => setHoveredWa(true)}
          onMouseLeave={() => setHoveredWa(false)}
        >
          <WhatsAppIcon />
        </a>
        {hoveredWa && <span style={tooltipStyle}>Escríbenos al WhatsApp</span>}
      </div>

      {/* Llamada */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <a
          href={`tel:${phoneNumber}`}
          aria-label="Llamar al negocio"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: '#02115C',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: hoveredPhone ? '0 6px 20px rgba(2, 17, 92, 0.55)' : '0 4px 16px rgba(2, 17, 92, 0.4)',
            transform: hoveredPhone ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            textDecoration: 'none',
          }}
          onMouseEnter={() => setHoveredPhone(true)}
          onMouseLeave={() => setHoveredPhone(false)}
        >
          <PhoneIcon />
        </a>
        {hoveredPhone && <span style={tooltipStyle}>Llámanos</span>}
      </div>
    </div>
  )
}
