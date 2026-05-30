export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

import { getAuthSession } from '@/utils/libs/auth-helpers'
import { getConfig } from '@/utils/libs/config'
import prisma from '@/utils/libs/prisma'

// GET: Obtener comentarios APROBADOS de una lección (público)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const leccionId = params.id

    const comentarios = await prisma.comentario.findMany({
      where: {
        leccion_id: leccionId,
        respuesta_a_id: null,
        estado: 'APROBADO'
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, avatar: true, rol: true }
        },
        respuestas: {
          where: { estado: 'APROBADO' },
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true, avatar: true, rol: true }
            }
          },
          orderBy: { creado_en: 'asc' }
        }
      },
      orderBy: { creado_en: 'desc' }
    })

    return NextResponse.json(comentarios)
  } catch (error) {
    console.error('Error fetching comentarios:', error)

    return NextResponse.json({ error: 'Error al obtener los comentarios' }, { status: 500 })
  }
}

// POST: Crear un nuevo comentario o responder
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const leccionId = params.id
    const body = await request.json()
    const { contenido, respuesta_a_id } = body

    if (!contenido || contenido.trim() === '') {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
    }

    const leccion = await prisma.leccion.findUnique({ where: { id: leccionId } })

    if (!leccion) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
    }

    if (respuesta_a_id) {
      const parentComment = await prisma.comentario.findUnique({ where: { id: respuesta_a_id } })

      if (!parentComment || parentComment.leccion_id !== leccionId) {
        return NextResponse.json(
          { error: 'El comentario original no existe o no pertenece a esta lección' },
          { status: 400 }
        )
      }
    }

    // Determinar estado: ADMIN/PROFESOR siempre APROBADO; ESTUDIANTE según config
    const rol = (session.user as any).rol as string
    const requiereAprobacion = await getConfig('COMENTARIOS_REQUIERE_APROBACION', 'false')

    const estado =
      rol === 'ADMIN' || rol === 'PROFESOR'
        ? 'APROBADO'
        : requiereAprobacion === 'true'
          ? 'PENDIENTE'
          : 'APROBADO'

    const nuevoComentario = await prisma.comentario.create({
      data: {
        contenido: contenido.trim(),
        usuario_id: session.user.id,
        leccion_id: leccionId,
        respuesta_a_id: respuesta_a_id || null,
        estado: estado as any
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, avatar: true, rol: true }
        },
        leccion: {
          include: {
            modulo: {
              include: {
                curso: { include: { profesor: true } }
              }
            }
          }
        }
      }
    })

    // --- Notificaciones (solo si el comentario queda APROBADO) ---
    if (estado === 'APROBADO') {
      try {
        const curso = nuevoComentario.leccion.modulo.curso
        const profesorId = curso.profesor_id

        if (!respuesta_a_id) {
          if (session.user.id !== profesorId) {
            await prisma.notificacion.create({
              data: {
                titulo: 'Nuevo comentario en tu curso',
                mensaje: `${session.user.name} comentó en "${nuevoComentario.leccion.titulo}" de tu curso "${curso.titulo}"`,
                tipo: 'COMENTARIO_NUEVO',
                usuario_id: profesorId,
                enlace: `/profesor/cursos/${curso.id}`
              }
            })
          }
        } else {
          const comentarioOriginal = await prisma.comentario.findUnique({
            where: { id: respuesta_a_id },
            include: { usuario: true }
          })

          if (comentarioOriginal && comentarioOriginal.usuario_id !== session.user.id) {
            if (comentarioOriginal.usuario.rol === 'ESTUDIANTE') {
              await prisma.notificacion.create({
                data: {
                  titulo: 'Respuesta en el curso',
                  mensaje: `Han respondido a tu comentario en "${nuevoComentario.leccion.titulo}"`,
                  tipo: 'RESPUESTA_COMENTARIO',
                  usuario_id: comentarioOriginal.usuario_id,
                  enlace: `/estudiante/aprender/${curso.slug}?lessonId=${leccionId}`
                }
              })
            }
          }
        }
      } catch (notifError) {
        console.error('Error al crear notificación:', notifError)
      }
    }

    return NextResponse.json({ ...nuevoComentario, estado }, { status: 201 })
  } catch (error) {
    console.error('Error creating comentario:', error)

    return NextResponse.json({ error: 'Error al crear el comentario' }, { status: 500 })
  }
}
