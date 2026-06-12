import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/profesor/',
          '/estudiante/',
          '/api/',
          '/checkout/',
        ],
      },
    ],
    sitemap: 'https://ipgingenierosperu.com/sitemap.xml',
  }
}
