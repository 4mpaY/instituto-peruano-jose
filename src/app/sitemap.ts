import type { MetadataRoute } from 'next'

import prisma from '@/utils/libs/prisma'

export const dynamic = 'force-dynamic'

const BASE = 'https://ipgingenierosperu.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cursos, rutas, docentes] = await Promise.all([
    prisma.curso.findMany({
      where: { estado: 'PUBLICADO' },
      select: { slug: true, actualizado_en: true },
    }),
    prisma.rutaAprendizaje.findMany({
      where: { esta_activo: true },
      select: { slug: true, actualizado_en: true },
    }),
    prisma.usuario.findMany({
      where: { rol: 'PROFESOR', slug: { not: null } },
      select: { slug: true },
    }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/cursos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/rutas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/empresas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/verificar-certificado`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/libro-de-reclamaciones`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terminos-y-condiciones`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/politica-de-cambios-y-devoluciones`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const cursoRoutes: MetadataRoute.Sitemap = cursos.map(c => ({
    url: `${BASE}/cursos/${c.slug}`,
    lastModified: c.actualizado_en ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const rutaRoutes: MetadataRoute.Sitemap = rutas.map(r => ({
    url: `${BASE}/rutas/${r.slug}`,
    lastModified: r.actualizado_en ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const docenteRoutes: MetadataRoute.Sitemap = docentes
    .filter(d => d.slug)
    .map(d => ({
      url: `${BASE}/docentes/${d.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))

  return [...staticRoutes, ...cursoRoutes, ...rutaRoutes, ...docenteRoutes]
}
