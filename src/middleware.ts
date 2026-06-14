import { NextResponse } from 'next/server'

import { withAuth } from 'next-auth/middleware'
import { Rol } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Si no hay token y está intentando acceder a rutas protegidas
    // if (!token && !path.startsWith('/login') && !path.startsWith('/register')) {
    //   console.log(path)

    //     return NextResponse.redirect(new URL('/login', req.url))
    // }

    // Si tiene token y está intentando acceder a login/register
    if (token && (path.startsWith('/login') || path.startsWith('/register'))) {
      // Redirigir según rol
      const rol = token.rol as Rol

      if (rol === Rol.ADMIN) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url), { status: 302 })
      }

      if (rol === Rol.PROFESOR) {
        return NextResponse.redirect(new URL('/profesor/dashboard', req.url), { status: 302 })
      }

      return NextResponse.redirect(new URL('/estudiante/dashboard', req.url), { status: 302 })
    }

    // Redirigir /dashboard genérico según rol
    if (path === '/dashboard') {
      const rol = token?.rol as Rol

      if (rol === Rol.ADMIN) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url), { status: 302 })
      }

      if (rol === Rol.PROFESOR) {
        return NextResponse.redirect(new URL('/profesor/dashboard', req.url), { status: 302 })
      }

      return NextResponse.redirect(new URL('/estudiante/dashboard', req.url), { status: 302 })
    }

    // Verificar acceso a rutas según rol
    const rol = token?.rol as Rol

    // Rutas de admin - solo ADMIN
    if (path.startsWith('/admin') && rol !== Rol.ADMIN) {
      return NextResponse.redirect(new URL('/unauthorized', req.url), { status: 302 })
    }

    // Rutas de profesor - solo PROFESOR o ADMIN
    if (path.startsWith('/profesor') && rol !== Rol.ADMIN && rol !== Rol.PROFESOR) {
      return NextResponse.redirect(new URL('/unauthorized', req.url), { status: 302 })
    }

    // Rutas de estudiante - solo ESTUDIANTE o ADMIN (y PROFESOR para ver el reproductor)
    // /estudiante/aprender/ es manejado por la page.tsx (redirige al curso si no hay sesión)
    if (path.startsWith('/estudiante') && !path.startsWith('/estudiante/aprender/') && rol !== Rol.ADMIN && rol !== Rol.ESTUDIANTE) {
      if (rol === Rol.PROFESOR && path.startsWith('/estudiante/aprender')) {
        // Permitido
      } else {
        return NextResponse.redirect(new URL('/unauthorized', req.url), { status: 302 })
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Rutas públicas
        if (
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/cursos') ||
          path.startsWith('/rutas') ||
          path.startsWith('/proyectos') ||
          path.startsWith('/mantenimiento') ||
          path.startsWith('/consultoria') ||
          path.startsWith('/capacitacion') ||
          path.startsWith('/contacto') ||
          path.startsWith('/nosotros') ||
          path.startsWith('/docentes') ||
          path.startsWith('/libro-de-reclamaciones') ||
          path.startsWith('/terminos-y-condiciones') ||
          path.startsWith('/politica-de-cambios-y-devoluciones') ||
          path.startsWith('/forgot-password') ||
          path.startsWith('/reset-password') ||
          path.startsWith('/verificar-certificado') ||
          path.startsWith('/unauthorized') ||
          path.startsWith('/assets') ||
          path.startsWith('/empresas') ||
          path.startsWith('/politica-de-devoluciones') ||
          path.startsWith('/estudiante/aprender/') ||
          path === '/'
        ) {
          return true
        }

        // Rutas protegidas requieren token
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.mp4|.*\\.webm|.*\\.gif).*)'
  ]
}
