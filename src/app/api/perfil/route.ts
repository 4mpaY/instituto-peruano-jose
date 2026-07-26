export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

import { verify } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import { getAuthSession } from '@/utils/libs/auth-helpers'

import prisma from '@/utils/libs/prisma'
import { JWT_SECRET } from '@/utils/configs/auth'
import { generateUniqueSlug } from '@/utils/libs/slug'

export async function GET(req: Request) {
  try {
    let userEmail: string | undefined | null

    // 1. Intentar por session (Cookies - Navegador)
    const session = await getAuthSession()

    if (session?.user?.email) {
      userEmail = session.user.email
    }

    // 2. Intentar por Bearer Token (Authorization Header - Servidor)
    if (!userEmail) {
      const authHeader = req.headers.get('Authorization')

      if (authHeader?.startsWith('Bearer ')) {
        const tokenString = authHeader.substring(7)

        try {
          const decoded = verify(tokenString, JWT_SECRET) as any

          userEmail = decoded.email
        } catch (err: any) {
          console.error('DEBUG: JWT Verification Error:', err.message)
        }
      }
    }

    if (!userEmail) {
      return NextResponse.json({ status: false, message: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.usuario.findUnique({
      where: { correo: userEmail },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        numero_documento: true,
        celular: true,
        biografia: true,
        avatar: true,
        rol: true,
        cargo: true,
        firma: true
      }
    })

    if (!user) {
      return NextResponse.json({ status: false, message: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ status: true, result: user })
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message || 'Error interno' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    let userEmail: string | undefined | null

    // 1. Intentar por session (Cookies)
    const session = await getAuthSession()

    if (session?.user?.email) {
      userEmail = session.user.email
    }

    // 2. Intentar por Bearer Token (Authorization Header)
    if (!userEmail) {
      const authHeader = req.headers.get('Authorization')

      if (authHeader?.startsWith('Bearer ')) {
        const tokenString = authHeader.substring(7)

        try {
          const decoded = verify(tokenString, JWT_SECRET) as any

          userEmail = decoded.email
        } catch (err) {
          console.error('JWT Verification Error in API Perfil PUT:', err)
        }
      }
    }

    if (!userEmail) {
      return NextResponse.json({ status: false, message: 'No autorizado' }, { status: 401 })
    }

    const { nombre, apellido, celular, tipo_documento, numero_documento, biografia, contrasena, avatar, cargo, firma } =
      await req.json()

    if (!nombre || !apellido) {
      return NextResponse.json({ status: false, message: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const currentUser = await prisma.usuario.findUnique({
      where: { correo: userEmail }
    })

    if (!currentUser) {
      return NextResponse.json({ status: false, message: 'Usuario no encontrado' }, { status: 404 })
    }

    const updateData: any = {
      nombre,
      apellido,
      celular: celular || null,
      tipo_documento: tipo_documento || 'DNI',
      numero_documento: numero_documento || null,
      biografia,
      avatar,
      cargo,
      firma
    }

    // Verify document uniqueness if changed
    if (numero_documento && numero_documento !== currentUser.numero_documento) {
      const existingDoc = await prisma.usuario.findUnique({ where: { numero_documento } })

      if (existingDoc) {
        return NextResponse.json(
          { status: false, message: 'El número de documento ya está en uso por otro usuario.' },
          { status: 400 }
        )
      }
    }

    // Regenerar slug si cambia el nombre o apellido
    if (nombre !== currentUser.nombre || apellido !== currentUser.apellido || !currentUser.slug) {
      const nombreBase = `${nombre} ${apellido}`.trim()

      updateData.slug = await generateUniqueSlug(nombreBase, prisma.usuario, currentUser.id)
    }

    // Change password logic if provided
    if (contrasena && contrasena.trim() !== '') {
      const hashedPassword = await bcrypt.hash(contrasena, 10)

      updateData.contrasena = hashedPassword
    }

    const updatedUser = await prisma.usuario.update({
      where: { correo: userEmail },
      data: updateData,

      // 🔐 SEGURIDAD: select explícito — nunca devolver contrasena_hash al cliente
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        tipo_documento: true,
        numero_documento: true,
        celular: true,
        biografia: true,
        avatar: true,
        rol: true,
        cargo: true,
        slug: true,
        firma: true,
        esta_activo: true,
        actualizado_en: true
      }
    })

    return NextResponse.json({ status: true, message: 'Perfil actualizado exitosamente', result: updatedUser })
  } catch (error: any) {
    console.error('API Perfil Error:', error)

    return NextResponse.json({ status: false, message: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
