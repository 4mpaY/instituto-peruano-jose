import type { Metadata } from 'next'

import { getServerSession } from 'next-auth'

import { Providers } from '@/components/Providers'
import { getConfigs } from '@/utils/libs/config'
import { getAuthOptions } from '@/utils/configs/auth'
import { plus_jakarta_sans } from '@core/theme'

import './globals.css'
import '@assets/iconify-icons/generated-icons.css'

export async function generateMetadata(): Promise<Metadata> {
  const configs = await getConfigs()
  const title = configs.TEMPLATE_NAME || 'IPG Ingenieros'
  const slogan = configs.TEMPLATE_SLOGAN || 'Formación especializada en Gestión Ambiental, Seguridad y Calidad'
  const logo = configs.TEMPLATE_LOGO || '/favicon.ico'
  const siteTitle = slogan ? `${title} — ${slogan}` : title

  return {
    metadataBase: new URL('https://ipgingenierosperu.com'),
    title: {
      default: siteTitle,
      template: `%s | IPG Ingenieros`,
    },
    description: slogan || 'Plataforma de formación online especializada en Gestión Ambiental, Seguridad Industrial y Calidad para profesionales peruanos.',
    icons: { icon: logo },
    openGraph: {
      siteName: title,
      locale: 'es_PE',
      type: 'website',
      images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: `${title} — Aula Virtual` }],
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) || 0
  const g = parseInt(clean.slice(2, 4), 16) || 0
  const b = parseInt(clean.slice(4, 6), 16) || 0
  
  return `${r}, ${g}, ${b}`
}

function darkenHex(hex: string, factor: number): string {
  const clean = hex.replace('#', '')
  const r = Math.round((parseInt(clean.slice(0, 2), 16) || 0) * factor)
  const g = Math.round((parseInt(clean.slice(2, 4), 16) || 0) * factor)
  const b = Math.round((parseInt(clean.slice(4, 6), 16) || 0) * factor)
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const configs = await getConfigs()
  const authOptions = await getAuthOptions()
  const session = await getServerSession(authOptions)

  // Colores MUI admin
  const primaryMain = configs.PRIMARY_COLOR_MAIN || '#131FF2'
  const primaryLight = configs.PRIMARY_COLOR_LIGHT || '#242CBF'
  const primaryDark = configs.PRIMARY_COLOR_DARK || '#9196F2'

  // Colores web (con fallback al design system teal)
  const webPrimary  = configs.PRIMARY_COLOR_MAIN  || '#25927F'
  const webLight    = configs.PRIMARY_COLOR_LIGHT || '#BDD962'
  const webDark     = configs.PRIMARY_COLOR_DARK  || '#025E44'
  const webDarkDeep = darkenHex(webDark, 0.45)  // muy oscuro → reemplaza #012d22
  const webDarkMid  = darkenHex(webDark, 0.72)  // oscuro medio → reemplaza #0f4438

  return (
    <html lang='es' suppressHydrationWarning className={`${plus_jakarta_sans.variable} ${plus_jakarta_sans.className}`}>
      <body className='flex is-full min-bs-full flex-col' id="__next">
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --primary-main: ${primaryMain};
              --primary-light: ${primaryLight};
              --primary-dark: ${primaryDark};
              --web-primary:     ${webPrimary};
              --web-primary-rgb: ${hexToRgb(webPrimary)};
              --web-light:       ${webLight};
              --web-light-rgb:   ${hexToRgb(webLight)};
              --web-dark:        ${webDark};
              --web-dark-rgb:    ${hexToRgb(webDark)};
              --web-dark-deep:   ${webDarkDeep};
              --web-dark-mid:    ${webDarkMid};
            }
          `
        }} />
        <Providers session={session} configs={configs}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
