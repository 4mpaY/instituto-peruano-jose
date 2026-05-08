import React from 'react'

import Link from 'next/link'

import { Phone, Mail, MapPin, BookOpenCheck, Facebook } from 'lucide-react'

import { getConfigs } from '@/utils/libs/config'
import HydratedDate from '@/utils/components/HydratedDate'
import Logo from '@components/layout/shared/Logo'


// Simple WhatsApp SVG icon
const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
)

const staticSocialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/ipgingenierosinst/', icon: <Facebook size={20} /> }
]

interface WebFooterProps {
  platformName?: string
  rutasHabilitado?: boolean
}

const WebFooter = async ({ platformName = 'Aula Virtual', rutasHabilitado = true }: WebFooterProps) => {
  const configs = await getConfigs()
  const waNumber = configs.WHATSAPP_NUMERO || '51901931739'

  const socialLinks = [
    ...staticSocialLinks,
    { label: 'WhatsApp', href: `https://wa.me/${waNumber}`, icon: <WhatsAppIcon size={20} /> },
  ]

  return (
    <footer style={{ backgroundColor: '#0A0A0A', color: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Contact */}
          <div>
            <h4
              className="mb-4"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: '#ffffff' }}
            >
              Contacto
            </h4>
            <ul className="space-y-3" style={{ opacity: 0.8 }}>
              <li className="flex items-start gap-2" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem' }}>
                <Phone size={16} className="flex-shrink-0 mt-0.5" />
                <span>+51 901 931 739</span>
              </li>
              <li className="flex items-start gap-2" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem' }}>
                <Mail size={16} className="flex-shrink-0 mt-0.5" />
                <span>ipg.ingenieros.contacto@gmail.com</span>
              </li>
              <li className="flex items-start gap-2" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem' }}>
                <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                <span>Lima, Miraflores</span>
              </li>
            </ul>
          </div>

          {/* Formación */}
          <div className="pt-4 md:pt-0">
            <h4
              className="mb-4"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: '#ffffff' }}
            >
              Formación
            </h4>
            <ul className="space-y-2 list-none pl-0 m-0" style={{ opacity: 0.8 }}>
              {([
                { label: 'Cursos', href: '/cursos' },
                ...(rutasHabilitado ? [{ label: 'Rutas', href: '/rutas' }] : []),
              ] as { label: string; href: string }[]).map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="no-underline transition-opacity hover:opacity-100"
                    style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Más Información */}
          <div className="pt-4 md:pt-0">
            <h4
              className="mb-4"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: '#ffffff' }}
            >
              Más Información
            </h4>
            <ul className="space-y-2 list-none pl-0 m-0" style={{ opacity: 0.8 }}>
              {[
                { label: 'Nosotros', href: '/nosotros' },
                { label: 'Términos y condiciones', href: '/terminos-y-condiciones' },
                { label: 'Libro de reclamaciones', href: '/libro-de-reclamaciones', icon: <BookOpenCheck size={13} /> },
                { label: 'Política de Devoluciones', href: '/politica-de-cambios-y-devoluciones' },
              ].map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="no-underline transition-opacity hover:opacity-100 inline-flex items-center gap-1.5"
                    style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}
                  >
                    {link.icon ?? null}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Síguenos */}
          <div>
            <h4
              className="mb-4"
              style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: '#ffffff' }}
            >
              Síguenos
            </h4>

            {/* Social icons row */}
            <div className="flex items-center gap-3 mb-5">
              {socialLinks.map(social => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="no-underline transition-opacity hover:opacity-70"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  {social.icon}
                </Link>
              ))}
            </div>

            {/* Validar Certificado button */}
            <Link
              href="/verificar-certificado"
              className="no-underline inline-block text-center transition-opacity hover:opacity-90"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#ffffff',
                backgroundColor: 'var(--web-dark, #025E44)',
                borderRadius: '9999px',
                padding: '0.5rem 1.25rem',
              }}
            >
              Validar Certificado
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <p
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.8125rem',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              © <HydratedDate date={new Date()} format="year" /> {platformName}. Todos los derechos reservados.
            </p>
          </div>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            Desarrollado por{' '}
            <Link
              href="https://flyup.pe"
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline hover:opacity-80"
              style={{ color: 'var(--web-light, #BDD962)', fontWeight: 600 }}
            >
              Fly
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default WebFooter
