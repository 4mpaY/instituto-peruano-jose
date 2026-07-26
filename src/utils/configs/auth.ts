import type { NextAuthOptions, User } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

import prisma from '@/utils/libs/prisma'
import { loginSchema } from '@/schemas/auth.schema'
import { getConfigs } from '@/utils/libs/config'

export const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret'

export const getAuthOptions = async (): Promise<NextAuthOptions> => {
  const configs = await getConfigs()

  const providers: NextAuthOptions['providers'] = [
    Credentials({
      name: 'Credentials',
      credentials: {
        correo: { label: 'Correo', type: 'email' },
        contrasena: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        try {
          // Validar credenciales
          const validacion = loginSchema.safeParse(credentials)

          if (!validacion.success) {
            return null
          }

          const { correo, contrasena } = validacion.data

          // Buscar usuario
          const usuario = await prisma.usuario.findUnique({
            where: { correo }
          })

          if (!usuario) {
            return null
          }

          // Verificar si está activo
          if (!usuario.esta_activo) {
            throw new Error('Tu cuenta ha sido desactivada')
          }

          // Verificar contraseña
          if (!usuario.contrasena) {
            return null
          }

          const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena as string)

          if (!contrasenaValida) {
            return null
          }

          // Retornar usuario
          return {
            id: usuario.id,
            email: usuario.correo,
            name: `${usuario.nombre} ${usuario.apellido}`,
            rol: usuario.rol,
            avatar: usuario.avatar,
            tipo_documento: usuario.tipo_documento,
            numero_documento: usuario.numero_documento,
            celular: usuario.celular,
            esta_activo: usuario.esta_activo
          } as User
        } catch (error) {
          console.error('Error en authorize:', error)

          return null
        }
      }
    })
  ]

  const googleClientId = configs.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const googleClientSecret = configs.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

  if (googleClientId && googleClientSecret) {
    providers.push(
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret
      })
    )
  }

  return {
    providers,

    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60 // 30 días
    },

    pages: {
      signIn: '/login',
      error: '/login'
    },

    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === 'google') {
          const correo = user.email
          const googleProfile = profile as any
          const picture = googleProfile.picture || user.image

          if (!correo) return false

          try {
            // Buscar usuario por correo
            const usuarioExistente = await prisma.usuario.findUnique({
              where: { correo }
            })

            if (usuarioExistente) {
              // Sincronizar google_id y avatar (asegurar que tenga la foto más reciente de Google)
              const usuarioActualizado = await prisma.usuario.update({
                where: { id: usuarioExistente.id },
                data: {
                  google_id: usuarioExistente.google_id || user.id,
                  avatar: picture || usuarioExistente.avatar
                }
              })

              user.id = usuarioActualizado.id
              user.rol = usuarioActualizado.rol
              user.tipo_documento = usuarioActualizado.tipo_documento || 'DNI'
              user.numero_documento = usuarioActualizado.numero_documento || ''
              user.celular = usuarioActualizado.celular || ''
              user.esta_activo = usuarioActualizado.esta_activo
              user.avatar = usuarioActualizado.avatar
              user.image = usuarioActualizado.avatar

              return true
            }

            // Si no existe, crearlo
            const nombre = googleProfile.given_name || user.name?.split(' ')[0] || 'Usuario'
            const apellido = googleProfile.family_name || user.name?.split(' ').slice(1).join(' ') || 'Google'

            const nuevoUsuario = await prisma.usuario.create({
              data: {
                correo,
                nombre,
                apellido,
                google_id: user.id,
                avatar: picture,
                rol: 'ESTUDIANTE',
                esta_activo: true
              }
            })

            user.id = nuevoUsuario.id
            user.rol = nuevoUsuario.rol
            user.tipo_documento = nuevoUsuario.tipo_documento || 'DNI'
            user.numero_documento = ''
            user.celular = ''
            user.esta_activo = true
            user.avatar = nuevoUsuario.avatar
            user.image = nuevoUsuario.avatar

            return true
          } catch (error) {
            console.error('Error en signIn callback:', error)

            return false
          }
        }

        return true
      },
      async jwt({ token, user, trigger }) {
        if (user) {
          token.id = user.id
          token.rol = user.rol
          token.avatar = user.avatar || (user as any).image || (user as any).picture
          token.image = token.avatar
          token.picture = token.avatar
          token.tipo_documento = user.tipo_documento
          token.numero_documento = user.numero_documento
          token.celular = user.celular
          token.esta_activo = user.esta_activo

          // Generar un JWT real firmado (mismo payload que /api/auth/login)
          token.accessToken = sign(
            {
              id: user.id,
              email: user.email,
              name: user.name,
              rol: user.rol,
              avatar: token.avatar,
              image: token.avatar,
              tipo_documento: user.tipo_documento,
              numero_documento: user.numero_documento,
              celular: user.celular,
              esta_activo: user.esta_activo
            },
            JWT_SECRET,
            { expiresIn: '30d' }
          )
        }

        // Cuando el cliente llama update(), refrescar datos desde la BD
        if (trigger === 'update' && token.id) {
          try {
            const usuarioActualizado = await prisma.usuario.findUnique({
              where: { id: token.id as string },
              select: { nombre: true, apellido: true, avatar: true, rol: true, tipo_documento: true, numero_documento: true, celular: true, esta_activo: true }
            })

            if (usuarioActualizado) {
              const nuevoAvatar = usuarioActualizado.avatar
              const nuevoNombre = `${usuarioActualizado.nombre} ${usuarioActualizado.apellido}`

              token.avatar = nuevoAvatar
              token.image = nuevoAvatar
              token.picture = nuevoAvatar
              token.name = nuevoNombre
              token.rol = usuarioActualizado.rol
              token.tipo_documento = usuarioActualizado.tipo_documento || 'DNI'
              token.numero_documento = usuarioActualizado.numero_documento || ''
              token.celular = usuarioActualizado.celular || ''
              token.esta_activo = usuarioActualizado.esta_activo

              // Regenerar el accessToken con los datos frescos
              token.accessToken = sign(
                {
                  id: token.id,
                  email: token.email,
                  name: nuevoNombre,
                  rol: usuarioActualizado.rol,
                  avatar: nuevoAvatar,
                  image: nuevoAvatar,
                  tipo_documento: usuarioActualizado.tipo_documento,
                  numero_documento: usuarioActualizado.numero_documento,
                  celular: usuarioActualizado.celular,
                  esta_activo: usuarioActualizado.esta_activo
                },
                JWT_SECRET,
                { expiresIn: '30d' }
              )
            }
          } catch (e) {
            console.error('Error actualizando token desde BD:', e)
          }
        }

        return token
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string
          session.user.rol = token.rol as string
          session.user.avatar = token.avatar as string | null
          session.user.image = token.avatar as string | null
          session.user.tipo_documento = token.tipo_documento as string
          session.user.numero_documento = token.numero_documento as string
          session.user.celular = token.celular as string
          session.user.esta_activo = token.esta_activo as boolean
          session.user.accessToken = token.accessToken as string
        }

        return session
      }
    },

    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,

    debug: process.env.NODE_ENV === 'development'
  }
}

// Para compatibilidad con getServerSession en lugares que no admiten await (aunque Next.js 13+ suele admitirlos)
// Exportamos una versión estática mínima si es necesario, pero lo ideal es usar getAuthOptions()
export const authOptions: NextAuthOptions = {
  providers: []

  // ... rest of static config if needed, but risky
}

// Tipos extendidos para NextAuth
declare module 'next-auth' {
  interface User {
    id: string
    rol?: string
    avatar?: string | null
    tipo_documento?: string | null
    numero_documento?: string
    celular?: string | null
    esta_activo?: boolean
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      rol: string
      avatar?: string | null
      tipo_documento: string
      numero_documento: string
      celular: string
      esta_activo: boolean
      accessToken?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    rol?: string
    avatar?: string | null
    tipo_documento?: string | null
    numero_documento?: string
    celular?: string | null
    esta_activo?: boolean
    accessToken?: string
  }
}
