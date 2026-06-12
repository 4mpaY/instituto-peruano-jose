import React from 'react'

import type { Metadata } from 'next'

import SearchCertificateSection from '@/features/web/home/components/SearchCertificateSection'

export const metadata: Metadata = {
  title: 'Verificar Certificado | IPG Ingenieros',
  description: 'Verifique la autenticidad de su certificado emitido por IPG Ingenieros ingresando su código único. Certificados verificables con QR para profesionales.',
  alternates: { canonical: 'https://ipgingenierosperu.com/verificar-certificado' },
  openGraph: {
    title: 'Verificar Certificado — IPG Ingenieros',
    description: 'Comprueba la validez de un certificado IPG Ingenieros con solo ingresar su código único.',
    url: 'https://ipgingenierosperu.com/verificar-certificado',
    type: 'website',
  },
}

export default function VerificarCertificadoPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--web-dark, #025E44)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <SearchCertificateSection />
    </div>
  )
}
