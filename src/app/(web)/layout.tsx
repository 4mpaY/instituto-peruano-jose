import React from 'react'

import { unstable_cache } from 'next/cache'

import { AuthModalProvider } from '@/contexts/AuthModalContext'
import { getConfigs } from '@/utils/libs/config'
import prisma from '@/utils/libs/prisma'
import WebFooter from '@/utils/components/layout/web/WebFooter'
import WebHeader from '@/utils/components/layout/web/WebHeader'
import LeftSidebar from '@/utils/components/layout/web/LeftSidebar'
import MobileBottomNav from '@/utils/components/layout/web/MobileBottomNav'

const getCategorias = unstable_cache(
  () =>
    prisma.categoria.findMany({
      where: { esta_activo: true },
      select: { id: true, nombre: true, slug: true },
      orderBy: { orden: 'asc' }
    }),
  ['web-categorias'],
  { revalidate: 300 }
)

const WebLayout = async ({ children }: { children: React.ReactNode }) => {
  const [categories, configs] = await Promise.all([getCategorias(), getConfigs()])

  const platformName = configs.TEMPLATE_NAME || 'Aula Virtual'
  const platformSlogan = configs.TEMPLATE_SLOGAN || 'Aprende sin límites'
  const rutasHabilitado = configs.WEB_RUTAS_HABILITADO !== 'false'
  const empresasHabilitado = configs.WEB_EMPRESAS_HABILITADO !== 'false'

  return (
    <AuthModalProvider>
      <div className="web-layout min-h-screen bg-background flex flex-col">
        <WebHeader initialCategories={categories} platformName={platformName} platformSlogan={platformSlogan} />
        <div className="flex flex-1" style={{ paddingTop: 'var(--navbar-height)' }}>
          {/* Sidebar: visible solo en sm+ */}
          <div className="hidden sm:block">
            <LeftSidebar rutasHabilitado={rutasHabilitado} empresasHabilitado={empresasHabilitado} />
          </div>
          <main
            className="flex-1 flex flex-col min-w-0"
            style={{ paddingLeft: 'var(--sidebar-width)' }}
          >
            {/* padding-left del sidebar solo en sm+ */}
            <style>{`@media (max-width: 639px) { main { padding-left: 0 !important; padding-bottom: 64px; } }`}</style>
            <div className="flex-1">
              {children}
            </div>
            <WebFooter platformName={platformName} rutasHabilitado={rutasHabilitado} />
          </main>
        </div>
        {/* Bottom nav: visible solo en mobile */}
        <MobileBottomNav rutasHabilitado={rutasHabilitado} />
      </div>
    </AuthModalProvider>
  )
}

export default WebLayout
