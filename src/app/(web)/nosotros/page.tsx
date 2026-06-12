import Link from 'next/link'

import { ArrowRight } from 'lucide-react'

import prisma from '@/utils/libs/prisma'
import ScrollReveal from '@/features/web/home/components/ScrollReveal'
import ProfessorsCarousel from '@/features/web/nosotros/components/ProfessorsCarousel'
import { MisionVisionSection, ValoresSection } from '@/features/web/nosotros/components/NosotrosInteractive'

export const metadata = {
  title: 'Quiénes Somos | IPG Ingenieros',
  description: 'Conoce el Instituto Peruano de Gestión Ambiental, Seguridad y Calidad IPG Ingenieros. Nuestra misión, visión, valores y el equipo de profesionales detrás de nuestra plataforma educativa.',
  alternates: { canonical: 'https://ipgingenierosperu.com/nosotros' },
  openGraph: {
    title: 'Quiénes Somos — IPG Ingenieros',
    description: 'Instituto Peruano de Gestión Ambiental, Seguridad y Calidad. Formando profesionales en Lima, Perú.',
    url: 'https://ipgingenierosperu.com/nosotros',
    type: 'website',
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'Equipo IPG Ingenieros' }],
  },
}

async function getTeachers() {
  try {
    return await prisma.usuario.findMany({
      where: { rol: 'PROFESOR' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        slug: true,
        avatar: true,
        cargo: true,
        biografia: true,
        _count: { select: { cursos_dictados: true } },
      },
      orderBy: { cursos_dictados: { _count: 'desc' } },
      take: 12,
    })
  } catch {
    return []
  }
}

export default async function NosotrosPage() {
  const teachers = await getTeachers()

  return (
    <>
      {/* ── 1. HERO SOBRE NOSOTROS ─────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--web-dark-deep, #012d22) 0%, var(--web-dark, #025E44) 45%, var(--web-dark-mid, #0f4438) 100%)',
          padding: '6rem 1.5rem 5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow */}
        <div aria-hidden style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--web-primary-rgb, 37, 146, 127),0.22) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '3.5rem',
              alignItems: 'center',
            }}
          >
            {/* Left: stats visual */}
            <ScrollReveal direction="left">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Card principal */}
                <div
                  style={{
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(16px)',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,var(--web-dark, #025E44),var(--web-primary, #25927F))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.75rem' }}>
                    🎓
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plataforma educativa</div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>Formación profesional</div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.8125rem', color: 'var(--web-light, #BDD962)', fontWeight: 600 }}>especializada y certificada</div>
                  </div>
                </div>

                {/* Stats 2×2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { emoji: '👩‍🎓', value: '+1,200', label: 'Estudiantes formados' },
                    { emoji: '📚', value: '+80', label: 'Cursos disponibles' },
                    { emoji: '👨‍🏫', value: '+30', label: 'Docentes expertos' },
                    { emoji: '🏆', value: '98%', label: 'Tasa de satisfacción' },
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1.5px solid rgba(255,255,255,0.09)',
                        backdropFilter: 'blur(12px)',
                        padding: '1.125rem 1.25rem',
                      }}
                    >
                      <span style={{ fontSize: '1.375rem' }}>{s.emoji}</span>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--web-light, #BDD962)', lineHeight: 1, marginTop: '0.5rem' }}>{s.value}</div>
                      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '3px', lineHeight: 1.3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Certificado badge */}
                <div
                  style={{
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(var(--web-light-rgb, 189, 217, 98),0.12) 0%, rgba(var(--web-primary-rgb, 37, 146, 127),0.12) 100%)',
                    border: '1.5px solid rgba(var(--web-light-rgb, 189, 217, 98),0.25)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                  }}
                >
                  <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>📜</div>
                  <div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--web-light, #BDD962)', lineHeight: 1 }}>Certificados con validez empresarial</div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>Reconocidos por las principales empresas del sector</div>
                  </div>
                </div>

              </div>
            </ScrollReveal>

            {/* Right: text */}
            <ScrollReveal direction="right" delay={0.1}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(var(--web-light-rgb, 189, 217, 98),0.12)',
                    border: '1px solid rgba(var(--web-light-rgb, 189, 217, 98),0.25)',
                    borderRadius: '999px',
                    padding: '0.375rem 1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--web-light, #BDD962)', boxShadow: '0 0 6px var(--web-light, #BDD962)' }} />
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: 'var(--web-light, #BDD962)', fontWeight: 600 }}>
                    Sobre nosotros
                  </span>
                </div>

                <h1
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.15,
                    marginBottom: '1.25rem',
                  }}
                >
                  Somos calidad y{' '}
                  <span style={{ color: 'var(--web-light, #BDD962)' }}>responsabilidad</span>{' '}
                  a tu servicio
                </h1>

                <p
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '1rem',
                    color: 'rgba(255,255,255,0.65)',
                    lineHeight: 1.75,
                    maxWidth: '480px',
                    marginBottom: '2.5rem',
                  }}
                >
                  Somos una plataforma educativa especializada en la formación profesional de alto impacto.
                  Ofrecemos cursos diseñados por expertos del sector, con certificaciones reconocidas
                  que impulsan tu desarrollo profesional y el de tu equipo.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Link
                    href="/cursos"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.875rem 1.75rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--web-light, #BDD962)',
                      color: '#0A0A0A',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(var(--web-light-rgb, 189, 217, 98),0.35)',
                    }}
                  >
                    Ver cursos <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/contacto"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.875rem 1.75rem',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      textDecoration: 'none',
                      border: '1.5px solid rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    Trabaja con nosotros
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 2. BANNER ISO ─────────────────────────────── */}
      {/* <section
        style={{
          backgroundColor: '#0A0A0A',
          padding: '2.5rem 1.5rem',
          borderTop: '1px solid rgba(var(--web-primary-rgb, 37, 146, 127),0.2)',
          borderBottom: '1px solid rgba(var(--web-primary-rgb, 37, 146, 127),0.2)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '52px', height: '52px', borderRadius: '14px',
              backgroundColor: 'rgba(var(--web-primary-rgb, 37, 146, 127),0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid rgba(var(--web-primary-rgb, 37, 146, 127),0.3)', flexShrink: 0,
            }}
          >
            <Award size={28} color="var(--web-primary, #25927F)" />
          </div>
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Calidad certificada:{' '}
              <span style={{ color: 'var(--web-light, #BDD962)' }}>ISO 9001:2015</span> e{' '}
              <span style={{ color: 'var(--web-light, #BDD962)' }}>ISO 21001:2018</span>
            </div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Comprometidos con los más altos estándares de calidad educativa y de gestión
            </div>
          </div>
        </div>
      </section> */}

      {/* ── 3. MISIÓN / VISIÓN (client component) ─────── */}
      <MisionVisionSection />

      {/* ── 4. VALORES (client component) ─────────────── */}
      <ValoresSection />

      {/* ── 5. PROFESORES ─────────────────────────────── */}
      <ProfessorsCarousel teachers={JSON.parse(JSON.stringify(teachers))} />
    </>
  )
}
