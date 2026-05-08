import Link from 'next/link'
import Image from 'next/image'

import { CheckCircle2 } from 'lucide-react'

import ScrollReveal from '@/features/web/home/components/ScrollReveal'
import { getConfigs } from '@/utils/libs/config'

export const metadata = {
  title: 'Consultoría - ARM',
  description: 'Consultoría en gestión de activos e ISO 55000',
}

export default async function ConsultoriaPage() {
  const configs = await getConfigs()
  const waNumero = configs.WHATSAPP_NUMERO || '51901931739'

  const sections = [
    {
      title: 'Gestión de Activos (ISO 55000)',
      images: [
        '/assets/services/consultoria/gestion-iso-5500.jpeg',
      ],
      items: [
        'Diagnóstico de madurez',
        'Diseño de sistemas de gestión',
        'Roadmap de implementación',
      ],
    },
    {
      title: 'Optimización de Mantenimiento',
      images: [
        '/assets/services/consultoria/optimizacion-de-mantenimiento.jpeg',
      ],
      items: [
        'Estrategias basadas en riesgo',
        'Optimización de planes',
        'Evaluación de criticidad',
        'Implementación 5 \'S\'',
        'Implementación del TPM',
        'Implementación de RCA',
      ],
    },
    {
      title: 'RCM / FMEA',
      images: [
        '/assets/services/consultoria/RCM.jpeg',
      ],
      items: [
        'Análisis funcional',
        'Modos de falla',
        'Estrategias de mitigación',
      ],
    },
    {
      title: 'Auditorías y Diagnósticos',
      images: [
        '/assets/services/consultoria/auditoria-y-diagnostico.jpeg',
      ],
      items: [
        'Evaluación de desempeño',
        'Benchmarking',
        'Recomendaciones ejecutivas',
      ],
    },
    {
      title: 'Planes de Mantenimiento',
      images: [
        '/assets/services/consultoria/planes-de-mantenimiento.jpeg',
      ],
      items: [
        'Estructuración técnica',
        'Estándares y procedimientos',
        'Integración con CMMS',
      ],
    },
  ]

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-24 lg:pb-36 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/assets/services/consultoria/auditoria-y-diagnostico.jpeg"
            alt="Consultoría ARM"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[#02115C]/88" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#02115C] via-[#02115C]/70 to-transparent" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <span className="inline-block text-[#E2231A] text-[10px] font-display font-black uppercase tracking-[0.35em] mb-6 border border-[#E2231A]/50 px-4 py-2 rounded-sm">
              Servicio ARM
            </span>
            <h1 className="text-5xl lg:text-7xl font-display font-black text-white mb-8 uppercase leading-[1.1] tracking-tighter">
              Consultoría en Gestión de Activos y{' '}
              <span className="text-[#E2231A]">Mantenimiento</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-3xl font-sans font-medium">
              Acompañamos a las organizaciones en la implementación de estrategias de gestión de activos y mantenimiento alineadas con ISO 55000 y mejores prácticas internacionales.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Sections */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-32 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {sections.map((section, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.1}>
              <div className="mb-20 last:mb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
                  <div className={idx % 2 === 1 ? 'md:order-2' : ''}>
                    <div className="flex flex-col gap-3 h-full min-h-[380px]">
                      <div className="relative overflow-hidden rounded-2xl shadow-lg flex-1">
                        <Image src={section.images[0]} alt={section.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                      </div>
                      {section.images[1] && (
                        <div className="relative overflow-hidden rounded-2xl shadow-lg h-[150px] shrink-0">
                          <Image src={section.images[1]} alt={section.title} fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={idx % 2 === 1 ? 'md:order-1' : ''}>
                    <div className="bg-white rounded-2xl p-8 shadow-sm h-full flex flex-col justify-center">
                      <span className="text-[10px] font-display font-black text-[#E2231A] uppercase tracking-[0.35em] mb-3 block">
                        {String(idx + 1).padStart(2, '0')} — Consultoría
                      </span>
                      <h3 className="text-3xl font-display font-black text-slate-900 mb-8 uppercase">{section.title}</h3>
                      <ul className="space-y-4">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#E2231A] flex-shrink-0 mt-1" />
                            <span className="text-slate-600 font-sans font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl lg:text-5xl font-display font-black text-slate-900 mb-8 uppercase">
              Transforma tu gestión de activos
            </h2>
            <p className="text-lg text-slate-600 mb-12 font-sans font-medium">
              Alinéate con ISO 55000 e implementa las mejores prácticas internacionales en gestión de mantenimiento y activos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={`https://wa.me/${waNumero}?text=Estoy%20interesado%20en%20el%20servicio%20de%20Consultor%C3%ADa%20en%20Gesti%C3%B3n%20de%20Activos%20y%20Mantenimiento%20de%20ARM`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#02115C] text-white font-sans font-bold uppercase tracking-wider hover:bg-[#0A50A1] transition-all duration-300 text-sm"
              >
                Solicitar Asesoría
              </a>
              <Link href="/" className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#02115C] text-[#02115C] font-sans font-bold uppercase tracking-wider hover:bg-[#02115C] hover:text-white transition-all duration-300 text-sm">
                Volver al inicio
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
