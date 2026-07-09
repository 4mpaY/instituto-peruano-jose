/** @type {import('next').NextConfig} */

// 🔐 SEGURIDAD: Headers HTTP de seguridad para todas las rutas
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY' // Previene Clickjacking
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff' // Previene MIME type sniffing
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload' // Fuerza HTTPS por 2 años
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.izipay.pe https://*.paypal.com https://*.paypalobjects.com https://*.culqi.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: *", // 🖼️ FLEXIBLE: Permite imágenes de cualquier sitio seguro
      "connect-src 'self' https://*.izipay.pe https://*.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://*.culqi.com",
      "frame-src 'self' blob: https: *", // blob: necesario para vista previa de PDFs en modal
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ')
  }
]

const nextConfig = {
  reactStrictMode: true, // 🔐 SEGURIDAD: Habilitado para detectar problemas en desarrollo
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      },
      {
        // Permite embeber el PDF en iframe del mismo origen (vista previa en modal)
        source: '/api/estudiante/certificado/:certificadoId/pdf',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }]
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: ''
      },

      // 🔐 SEGURIDAD: Reemplazar wildcards excesivos por patrones más restrictivos.
      // IMPORTANTE: Cambiar 'tu-bucket' por el nombre real de tu bucket S3 para máxima seguridad.
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        port: ''
      }
    ]
  }
}

module.exports = nextConfig
