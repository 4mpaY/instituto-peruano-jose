export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAdmin } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/admin/certificados
 * Listar todos los certificados emitidos (solo ADMIN)
 */
export async function GET(request: Request) {
  try {
    // Verificar que sea admin
    const auth = await requireAdmin(request)

    if (!auth.authorized) {
      return auth.error
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const codigo = searchParams.get('codigo') || ''
    const nombre = searchParams.get('nombre') || ''

    const skip = (page - 1) * limit

    // Filtros
    const conditions: any[] = []


    if (codigo) {
      conditions.push({
        codigo_verificacion: { contains: codigo, mode: 'insensitive' }
      })
    }

    if (nombre) {
      conditions.push({
        usuario: {
          OR: [
            { nombre: { contains: nombre, mode: 'insensitive' } },
            { apellido: { contains: nombre, mode: 'insensitive' } }
          ]
        }
      })
    }

    const where: any = conditions.length > 0 ? { AND: conditions } : {}

    console.log('Certificados Filter Where:', JSON.stringify(where, null, 2))


    const [certificados, total] = await Promise.all([

      prisma.certificado.findMany({
        where,
        skip,
        take: limit,
        orderBy: { emitido_en: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              correo: true,
              avatar: true
            }
          },
          curso: {
            select: {
              id: true,
              titulo: true
            }
          }
        }
      }),
      prisma.certificado.count({ where })
    ])

    return ApiResponse.success(request, {
      certificados,
      paginacion: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}

/**
 * POST /api/admin/certificados
 * Crear un certificado de forma manual (solo ADMIN)
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)

    if (!auth.authorized) return auth.error

    const body = await request.json()

    const {
      usuario_id,
      curso_id,
      fecha_emision,
      fecha_inicio_curso,
      fecha_culminacion,
      nota_final,
      duracion_override,
      docente_nombre_override,
      docente_cargo_override,
      reemplazar = false
    } = body

    if (!usuario_id || !curso_id) {
      return ApiResponse.error(request, 'El usuario y el curso son requeridos.', 400)
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuario_id },
      select: { id: true, nombre: true, apellido: true, correo: true, numero_documento: true }
    })

    if (!usuario) {
      return ApiResponse.error(request, 'El usuario seleccionado no existe.', 404)
    }

    // Verificar que el curso existe con datos del profesor
    const curso = await prisma.curso.findUnique({
      where: { id: curso_id },
      include: {
        profesor: { select: { nombre: true, apellido: true, cargo: true, firma: true } },
        modulos: {
          orderBy: { orden: 'asc' },
          select: {
            id: true, titulo: true, orden: true,
            lecciones: {
              orderBy: { orden: 'asc' },
              select: { id: true, titulo: true, orden: true, duracion: true }
            }
          }
        }
      }
    })

    if (!curso) {
      return ApiResponse.error(request, 'El curso seleccionado no existe.', 404)
    }

    // Verificar si ya existe un certificado para esta combinación
    const existente = await prisma.certificado.findUnique({
      where: { usuario_id_curso_id: { usuario_id, curso_id } }
    })

    if (existente && !reemplazar) {
      return ApiResponse.error(
        request,
        `CERTIFICADO_DUPLICADO:${existente.id}:${existente.codigo_verificacion}`,
        409
      )
    }

    // Construir el snapshot de datos
    // Las fechas de solo-día se parsean como mediodía UTC para que en cualquier
    // zona horaria (UTC-11 a UTC+11) se muestre el día correcto sin retroceder.
    const parseDateOnly = (s: string) => new Date(`${s}T12:00:00.000Z`)
    const fechaEmision = fecha_emision ? parseDateOnly(fecha_emision) : new Date()

    const snapshot = {
      usuario: { nombre: usuario.nombre, apellido: usuario.apellido },
      curso: {
        titulo: curso.titulo,
        tipo_emision: curso.tipo_emision,
        duracion: duracion_override || curso.duracion
      },
      fechas: {
        emision: fechaEmision.toISOString(),
        inicio_curso: fecha_inicio_curso ? parseDateOnly(fecha_inicio_curso).toISOString() : null,
        culminacion: fecha_culminacion ? parseDateOnly(fecha_culminacion).toISOString() : null
      },
      nota_final: nota_final !== undefined && nota_final !== '' ? parseFloat(nota_final) : null,
      profesor: {
        nombre: docente_nombre_override || curso.profesor.nombre,
        apellido: docente_cargo_override ? '' : curso.profesor.apellido,
        cargo: docente_cargo_override || curso.profesor.cargo,
        firma: curso.profesor.firma
      },
      emision_manual: true
    }

    let certificado

    if (existente && reemplazar) {
      // Actualizar el existente (conserva el mismo código de verificación)
      certificado = await prisma.certificado.update({
        where: { id: existente.id },
        data: {
          emitido_en: fechaEmision,
          datos: snapshot
        },
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true, correo: true, avatar: true } },
          curso: { select: { id: true, titulo: true } }
        }
      })
    } else {
      // Generar código de verificación: {CODIGO_CURSO}-{YYYYMMDD}-{DNI}-{NN}
      const fechaStr = fechaEmision.toISOString().slice(0, 10).replace(/-/g, '')
      const dni = usuario.numero_documento?.replace(/\D/g, '') || 'SINDNI'
      const codigoCurso = curso.codigo || curso.slug.slice(0, 12).toUpperCase()
      const codigoVerificacion = `${codigoCurso}-${fechaStr}-${dni}-01`

      certificado = await prisma.certificado.create({
        data: {
          usuario_id,
          curso_id,
          codigo_verificacion: codigoVerificacion,
          emitido_en: fechaEmision,
          datos: snapshot
        },
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true, correo: true, avatar: true } },
          curso: { select: { id: true, titulo: true } }
        }
      })
    }

    return ApiResponse.success(request, { certificado }, existente && reemplazar ? 200 : 201)
  } catch (error) {
    return handleApiError(error, request)
  }
}
