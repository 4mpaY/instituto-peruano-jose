import Link from 'next/link'

import { ArrowRight, CheckCircle, Map } from 'lucide-react'

import prisma from '@/utils/libs/prisma'
import { getConfigs } from '@/utils/libs/config'
import HomeCoursesSection from '@/features/web/home/components/HomeCoursesSection'
import SearchCertificateSection from '@/features/web/home/components/SearchCertificateSection'
import RutasSection from '@/features/web/home/components/RutasSection'
import ScrollReveal from '@/features/web/home/components/ScrollReveal'
import ClientLogosMarquee from '@/features/web/home/components/ClientLogosMarquee'
import HeroVisual from '@/features/web/home/components/HeroVisual'
import ClassFeaturesSection from '@/features/web/home/components/ClassFeaturesSection'
import ProfessorsCarousel from '@/features/web/nosotros/components/ProfessorsCarousel'
import CompaniesSection from '@/features/web/home/components/CompaniesSection'
import EnterpriseCTASection from '@/features/web/home/components/EnterpriseCTASection'

export const metadata = {
  title: 'IPG Ingenieros | Cursos en Gestión Ambiental, Seguridad y Calidad',
  description: 'Formación online especializada del Instituto Peruano de Gestión Ambiental, Seguridad y Calidad. Cursos con certificado verificable, rutas de aprendizaje y capacitación corporativa. Lima, Perú.',
  alternates: { canonical: 'https://ipgingenierosperu.com' },
  openGraph: {
    title: 'IPG Ingenieros — Formación especializada en Gestión Ambiental y Seguridad',
    description: 'Cursos online con certificados verificables en Gestión Ambiental, Seguridad Industrial, ISO y Calidad. Más de 80 cursos y 1 200 estudiantes en Perú.',
    url: 'https://ipgingenierosperu.com',
    type: 'website',
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'IPG Ingenieros — Aula Virtual' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPG Ingenieros | Cursos en Gestión Ambiental y Seguridad',
    description: 'Formación online especializada con certificados verificables. Lima, Perú.',
    images: ['/images/og-default.jpg'],
  },
}

async function getHomeData() {
  try {
    const [coursesRaw, rutasRaw, teachersRaw, configs] = await Promise.all([
      // Cursos
      prisma.curso.findMany({
        where: { estado: 'PUBLICADO' },
        include: {
          profesor: { select: { nombre: true, apellido: true, avatar: true } },
          categoria: { select: { id: true, nombre: true } },
          _count: { select: { modulos: true, inscripciones: true } },
        },
        orderBy: { creado_en: 'desc' },
        take: 6,
      }),

      // Rutas
      prisma.rutaAprendizaje.findMany({
        where: { esta_activo: true },
        include: {
          cursos: {
            take: 4,
            include: { curso: { select: { miniatura: true, titulo: true } } },
          },
        },
        take: 3,
      }),

      // Profesores
      prisma.usuario.findMany({
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
        take: 8,
      }),
      getConfigs(),
    ])

    const courses = await Promise.all(
      coursesRaw.map(async course => {
        const leccionesCount = await prisma.leccion.count({ where: { modulo: { curso_id: course.id } } })

        return { ...course, _count: { ...course._count, lecciones: leccionesCount } }
      })
    )

    const rutas = rutasRaw.map(r => ({
      ...r,
      total_cursos: r.cursos.length,
      cursos: r.cursos.map(c => ({ miniatura: c.curso.miniatura, titulo: c.curso.titulo })),
    }))

    const heroTitle = configs.HOME_HERO_TITLE || 'Aprende sin límites,\ncrece sin fronteras'
    const heroDescription = configs.HOME_HERO_DESCRIPTION || 'Accede a cursos especializados, rutas de aprendizaje y certificaciones diseñadas para impulsar tu carrera profesional.'
    let logos: { label: string; url: string }[] = []

    try { logos = configs.HOME_LOGOS ? JSON.parse(configs.HOME_LOGOS) : [] } catch { logos = [] }

    return {
      courses: JSON.parse(JSON.stringify(courses)),
      rutas: JSON.parse(JSON.stringify(rutas)),
      teachers: JSON.parse(JSON.stringify(teachersRaw)),
      heroTitle,
      heroDescription,
      logos,
    }
  } catch {
    return {
      courses: [], rutas: [], teachers: [],
      heroTitle: 'Aprende sin límites,\ncrece sin fronteras',
      heroDescription: 'Accede a cursos especializados, rutas de aprendizaje y certificaciones diseñadas para impulsar tu carrera profesional.',
      logos: [],
    }
  }
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://ipgingenierosperu.com/#organization',
      name: 'Instituto Peruano de Gestión Ambiental, Seguridad y Calidad IPG Ingenieros S.A.C.',
      alternateName: 'IPG Ingenieros',
      url: 'https://ipgingenierosperu.com',
      logo: 'https://ipgingenierosperu.com/images/logo.svg',
      email: 'ipg.ingenieros.contacto@gmail.com',
      address: { '@type': 'PostalAddress', addressLocality: 'Miraflores', addressRegion: 'Lima', addressCountry: 'PE' },
      sameAs: ['https://www.facebook.com/ipgingenierosinst/'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://ipgingenierosperu.com/#website',
      url: 'https://ipgingenierosperu.com',
      name: 'IPG Ingenieros',
      publisher: { '@id': 'https://ipgingenierosperu.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://ipgingenierosperu.com/cursos?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default async function HomePage() {
  const { courses, rutas, teachers, heroTitle, heroDescription, logos } = await getHomeData()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      {/* ── 1. HERO ─────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--web-dark-deep, #012d22) 0%, var(--web-dark, #025E44) 45%, var(--web-dark-mid, #0f4438) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Patrón de grid decorativo */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow derecho */}
        <div aria-hidden style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(var(--web-primary-rgb, 37, 146, 127),0.25) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '5rem 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>

            {/* ── Izquierda: texto ── */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Eyebrow */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
                style={{ backgroundColor: 'rgba(var(--web-light-rgb, 189, 217, 98),0.15)', border: '1px solid rgba(var(--web-light-rgb, 189, 217, 98),0.3)' }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--web-light, #BDD962)' }} />
                <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: 'var(--web-light, #BDD962)', fontWeight: 600 }}>
                  Plataforma educativa online
                </span>
              </div>

              {/* H1 */}
              <h1
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                  marginBottom: '1.25rem',
                }}
              >
                {heroTitle.split('\n')[0]}
                {heroTitle.split('\n')[1] && (
                  <>
                    <br />
                    <span style={{ color: 'var(--web-light, #BDD962)' }}>{heroTitle.split('\n')[1]}</span>
                  </>
                )}
              </h1>

              {/* Descripción */}
              <p
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1rem',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.75,
                  maxWidth: '480px',
                  marginBottom: '2.5rem',
                }}
              >
                {heroDescription}
              </p>

              {/* Botones */}
              <div className="flex flex-wrap gap-4" style={{ marginBottom: '2.5rem' }}>
                <Link
                  href="/cursos"
                  className="inline-flex items-center gap-2 no-underline rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  style={{ fontFamily: 'Poppins, sans-serif', backgroundColor: 'var(--web-primary, #25927F)', color: '#ffffff', fontSize: '0.9375rem', padding: '0.875rem 1.75rem', boxShadow: '0 4px 20px rgba(var(--web-primary-rgb, 37, 146, 127),0.45)' }}
                >
                  Ver Cursos <ArrowRight size={18} />
                </Link>
                <Link
                  href="/nosotros"
                  className="inline-flex items-center gap-2 no-underline rounded-xl font-semibold transition-all duration-200"
                  style={{ fontFamily: 'Poppins, sans-serif', backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff', fontSize: '0.9375rem', padding: '0.875rem 1.75rem', border: '1.5px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
                >
                  Saber más
                </Link>
              </div>

              {/* Mini stats */}
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {[
                  { value: '+1,200', label: 'Estudiantes' },
                  { value: '+80', label: 'Cursos' },
                  { value: '98%', label: 'Satisfacción' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--web-light, #BDD962)', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Derecha: visual interactivo ── */}
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ── 2. LOGO MARQUEE ─────────────────────────── */}
      <ClientLogosMarquee logos={logos} />

      {/* ── 3. CURSOS DESTACADOS ────────────────────── */}
      <section className="section-container">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Cursos destacados</h2>
              <p className="section-subtitle">Descubre nuestros cursos más recientes</p>
            </div>
            <Link
              href="/cursos"
              className="no-underline hidden sm:inline-flex items-center gap-2 text-sm font-semibold"
              style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--web-primary, #25927F)' }}
            >
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <HomeCoursesSection courses={courses} />
          <div className="flex justify-center mt-8 sm:hidden">
            <Link
              href="/cursos"
              className="no-underline inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm"
              style={{ fontFamily: 'Poppins, sans-serif', backgroundColor: 'var(--web-primary, #25927F)', color: '#ffffff' }}
            >
              Ver todos los cursos <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 4. CARACTERÍSTICAS DE CLASES ────────────── */}
      <ClassFeaturesSection />

      {/* ── 5. RUTAS DE APRENDIZAJE ─────────────────── */}
      {rutas.length > 0 && (
        <section style={{ backgroundColor: 'hsl(210, 15%, 97%)', borderTop: '1px solid hsl(214, 20%, 92%)' }}>
          <div className="section-container">
            <ScrollReveal>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <div
                    className="inline-flex items-center gap-2 mb-3"
                    style={{ color: 'var(--web-primary, #25927F)', fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                  >
                    <Map size={14} /> Especialízate
                  </div>
                  <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Rutas de Aprendizaje</h2>
                  <p className="section-subtitle">Colecciones curadas para llevarte de principiante a experto.</p>
                </div>
                <Link
                  href="/rutas"
                  className="no-underline hidden sm:inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--web-primary, #25927F)' }}
                >
                  Ver todas <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <RutasSection rutas={rutas} embedded />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── 6. PROFESORES ───────────────────────────── */}
      <ProfessorsCarousel teachers={teachers} />

      {/* ── 7. EMPRESAS (B2B informativo) ───────────── */}
      <CompaniesSection />

      {/* ── 8. CTA AGENDAR REUNIÓN ──────────────────── */}
      <EnterpriseCTASection />

      {/* ── 9. VERIFICAR CERTIFICADO ────────────────── */}
      <SearchCertificateSection />

      {/* ── 10. CTA INSCRIPCIÓN ─────────────────────── */}
      <section className="bg-white py-16 text-center" style={{ borderTop: '1px solid hsl(214, 20%, 88%)' }}>
        <div className="max-w-3xl mx-auto px-4">
          <ScrollReveal>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: 'rgba(var(--web-primary-rgb, 37, 146, 127),0.08)', color: 'var(--web-dark, #025E44)' }}
            >
              <CheckCircle size={16} />
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.75rem', fontWeight: 600 }}>
                Únete a miles de estudiantes
              </span>
            </div>
            <h2
              className="mb-4"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em' }}
            >
              ¿Listo para transformar tu carrera?
            </h2>
            <p
              className="mb-8 max-w-xl mx-auto"
              style={{ fontFamily: 'Poppins, sans-serif', color: 'hsl(215, 16%, 47%)', lineHeight: 1.7 }}
            >
              Inscríbete hoy y comienza a aprender con los mejores profesionales del sector.
            </p>
            <Link
              href="/cursos"
              className="no-underline inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105"
              style={{ fontFamily: 'Poppins, sans-serif', backgroundColor: 'var(--web-primary, #25927F)', boxShadow: '0 6px 20px rgba(var(--web-primary-rgb, 37, 146, 127),0.35)' }}
            >
              Inscribirse ahora <ArrowRight size={18} />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
