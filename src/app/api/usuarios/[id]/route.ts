export const dynamic = 'force-dynamic'

import bcrypt from 'bcryptjs'
import { Rol } from '@prisma/client'

import prisma from '@/utils/libs/prisma'
import { actualizarUsuarioSchema } from '@/schemas/usuario.schema'
import { validateRequest, handleApiError } from '@/utils/libs/validation'
import { requireAdmin, requireAuth } from '@/utils/libs/auth-helpers'
import { ApiResponse } from '@/utils/libs/apiResponse'

/**
 * GET /api/usuarios/[id]
 * Obtener un usuario por ID (ADMIN o el mismo usuario)
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {

    // Verificar autenticación
    const auth = await requireAuth(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { id } = params

    // Verificar permisos: debe ser admin o el mismo usuario
    if (auth.user.rol !== Rol.ADMIN && auth.user.id !== id) {
      return ApiResponse.error(request, 'No tienes permisos para ver este usuario', 403)
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        numero_documento: true,
        celular: true,
        avatar: true,
        biografia: true,
        cargo: true,
        firma: true,
        rol: true,
        esta_activo: true,
        creado_en: true,
        actualizado_en: true,
        inscripciones: {
          select: {
            id: true,
            inscrito_en: true,
            estado: true,
            certificado_habilitado: true,
            curso: {
              select: {
                id: true,
                titulo: true,
                slug: true,
                precio_certificado: true,
                moneda: true
              }
            }
          }
        },
        cursos_dictados: {
          select: {
            id: true,
            titulo: true,
            slug: true,
            estado: true,
            creado_en: true
          }
        }
      }
    })

    if (!usuario) {
      return ApiResponse.error(request, 'Usuario no encontrado', 404)
    }

    return ApiResponse.success(request, usuario)
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * PATCH /api/usuarios/[id]
 * Actualizar un usuario (ADMIN)
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar que sea admin
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { id } = params
    const body = await request.json()

    // Validar datos
    const validation = validateRequest(actualizarUsuarioSchema, body, request)

    if (!validation.success) {
      return validation.error
    }

    const data = validation.data

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id }
    })

    if (!usuario) {
      return ApiResponse.error(request, 'Usuario no encontrado', 404)
    }

    // Si se actualiza el correo, verificar que no exista
    if (data.correo && data.correo !== usuario.correo) {
      const correoExistente = await prisma.usuario.findUnique({
        where: { correo: data.correo }
      })

      if (correoExistente) {
        return ApiResponse.error(request, 'El correo ya está registrado', 409)
      }
    }

    // Si se actualiza el número de documento, verificar que no exista
    if (data.numero_documento && data.numero_documento !== usuario.numero_documento) {
      const documentoExistente = await prisma.usuario.findUnique({
        where: { numero_documento: data.numero_documento }
      })

      if (documentoExistente) {
        return ApiResponse.error(request, 'El número de documento ya está registrado', 409)
      }
    }

    // Hash de la contraseña si existe
    if (data.contrasena) {
      data.contrasena = await bcrypt.hash(data.contrasena, 10)
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        numero_documento: true,
        celular: true,
        avatar: true,
        biografia: true,
        cargo: true,
        firma: true,
        rol: true,
        esta_activo: true,
        actualizado_en: true
      }
    })

    return ApiResponse.success(request, { usuario: usuarioActualizado })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * DELETE /api/usuarios/[id]
 * Eliminar un usuario (ADMIN)
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar que sea admin
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { id } = params

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id }
    })

    if (!usuario) {
      return ApiResponse.error(request, 'Usuario no encontrado', 404)
    }

    // No permitir eliminar al propio admin
    if (auth.user.id === id) {
      return ApiResponse.error(request, 'No puedes eliminar tu propia cuenta', 400)
    }

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id }
    })

    return ApiResponse.success(request, { message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    return handleApiError(error, request)
  }
}
