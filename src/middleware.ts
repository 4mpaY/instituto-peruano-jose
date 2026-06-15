import { NextResponse } from 'next/server'

import { withAuth } from 'next-auth/middleware'
import { Rol } from '@prisma/client'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/cursos',
  '/rutas',
  '/proyectos',
  '/mantenimiento',
  '/consultoria',
  '/capacitacion',
  '/contacto',
  '/nosotros',
  '/docentes',
  '/libro-de-reclamaciones',
  '/terminos-y-condiciones',
  '/politica-de-cambios-y-devoluciones',
  '/politica-de-devoluciones',
  '/forgot-password',
  '/reset-password',
  '/verificar-certificado',
  '/unauthorized',
  '/assets',
  '/empresas',
  '/estudiante/aprender/',
]

const isPublic = (path: string) =>
  path === '/' || PUBLIC_PATHS.some(p => path.startsWith(p))

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Si tiene token y está intentando acceder a login/register
    if (token && (path.startsWith('/login') || path.startsWith('/register'))) {
      const rol = token.rol as Rol

      if (rol === Rol.ADMIN) return NextResponse.redirect(new URL('/admin/dashboard', req.url), { status: 302 })
      if (rol === Rol.PROFESOR) return NextResponse.redirect(new URL('/profesor/dashboard', req.url), { status: 302 })

      return NextResponse.redirect(new URL('/estudiante/dashboard', req.url), { status: 302 })
    }

    // Redirigir /dashboard genérico según rol
    if (path === '/dashboard') {
      const rol = token?.rol as Rol

      if (rol === Rol.ADMIN) return NextResponse.redirect(new URL('/admin/dashboard', req.url), { status: 302 })
      if (rol === Rol.PROFESOR) return NextResponse.redirect(new URL('/profesor/dashboard', req.url), { status: 302 })

      return NextResponse.redirect(new URL('/estudiante/dashboard', req.url), { status: 302 })
    }

    // Verificar acceso a rutas según rol (solo si hay token)
    if (token) {
      const rol = token.rol as Rol

      if (path.startsWith('/admin') && rol !== Rol.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', req.url), { status: 302 })
      }

      if (path.startsWith('/profesor') && rol !== Rol.ADMIN && rol !== Rol.PROFESOR) {
        return NextResponse.redirect(new URL('/unauthorized', req.url), { status: 302 })
      }

      if (path.startsWith('/estudiante') && !path.startsWith('/estudiante/aprender/') && rol !== Rol.ADMIN && rol !== Rol.ESTUDIANTE) {
        if (!(rol === Rol.PROFESOR && path.startsWith('/estudiante/aprender'))) {
          return NextResponse.redirect(new URL('/unauthorized', req.url), { status: 302 })
        }
      }
    }

    return NextResponse.next()
  },
  {
    // Cuando authorized devuelve false, withAuth redirige aquí con ?callbackUrl= automático
    pages: { signIn: '/' },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        if (isPublic(path)) return true

        // Rutas protegidas requieren token
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.mp4|.*\\.webm|.*\\.gif).*)'
  ]
}
