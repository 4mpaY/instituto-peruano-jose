export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

import { getAuthSession } from '@/utils/libs/auth-helpers'

import prisma from '@/utils/libs/prisma'
import { parsePeruDate } from '@/utils/functions/dateHelpers'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()

    if (!session || !session.user) {
      return NextResponse.json({ status: false, message: 'No autorizado' }, { status: 401 })
    }

    const { id: cursoId } = params

    // Verify course exists and user has access
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId }
    })

    if (!curso) {
      return NextResponse.json({ status: false, message: 'Curso no encontrado' }, { status: 404 })
    }

    // Admins and the course's professor can access the exam
    const isOwner = curso.profesor_id === (session.user as any).id
    const isAdmin = session.user.rol === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ status: false, message: 'No tienes permiso para ver este examen' }, { status: 403 })
    }

    // Try to find the exam for this course
    const examen = await prisma.examen.findFirst({
      where: { curso_id: cursoId },
      include: {
        preguntas: {
          orderBy: { orden: 'asc' },
          include: {
            opciones: {
              orderBy: { orden: 'asc' }
            }
          }
        }
      }
    })

    return NextResponse.json({
      status: true,
      examen: examen || null
    })
  } catch (error: any) {
    console.error('API Examen GET Error:', error)

    return NextResponse.json({ status: false, message: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()

    if (!session || !session.user) {
      return NextResponse.json({ status: false, message: 'No autorizado' }, { status: 401 })
    }

    const { id: cursoId } = params

    const {
      titulo,
      descripcion,
      limite_tiempo,
      puntaje_aprobacion,
      intentos_maximos,
      esta_publicado,
      mezclar_preguntas,
      fecha_inicio,
      fecha_fin
    } = await req.json()

    // Verify course existence and ownership
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId }
    })

    if (!curso) {
      return NextResponse.json({ status: false, message: 'Curso no encontrado' }, { status: 404 })
    }

    const isOwner = curso.profesor_id === (session.user as any).id
    const isAdmin = session.user.rol === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ status: false, message: 'No tienes permiso para editar este examen' }, { status: 403 })
    }

    // Check if exam already exists
    let examen = await prisma.examen.findFirst({
      where: { curso_id: cursoId }
    })

    if (examen) {
      // Update existing exam
      examen = await prisma.examen.update({
        where: { id: examen.id },
        data: {
          titulo: titulo || examen.titulo,
          descripcion: descripcion !== undefined ? descripcion : examen.descripcion,
          limite_tiempo: limite_tiempo !== undefined ? limite_tiempo : examen.limite_tiempo,
          puntaje_aprobacion: puntaje_aprobacion !== undefined ? Number(puntaje_aprobacion) : examen.puntaje_aprobacion,
          intentos_maximos: intentos_maximos !== undefined ? Number(intentos_maximos) : examen.intentos_maximos,
          esta_publicado: esta_publicado !== undefined ? esta_publicado : examen.esta_publicado,
          mezclar_preguntas: mezclar_preguntas !== undefined ? mezclar_preguntas : examen.mezclar_preguntas,
          fecha_inicio: fecha_inicio !== undefined ? (fecha_inicio ? parsePeruDate(fecha_inicio) : null) : examen.fecha_inicio,
          fecha_fin: fecha_fin !== undefined ? (fecha_fin ? parsePeruDate(fecha_fin) : null) : examen.fecha_fin
        }
      })
    } else {
      // Create new exam
      if (!titulo) {
        return NextResponse.json({ status: false, message: 'El título del examen es requerido' }, { status: 400 })
      }

      examen = await prisma.examen.create({
        data: {
          titulo,
          descripcion,
          limite_tiempo,
          puntaje_aprobacion: Number(puntaje_aprobacion || 60),
          intentos_maximos: Number(intentos_maximos || 1),
          esta_publicado: esta_publicado || false,
          mezclar_preguntas: mezclar_preguntas || false,
          fecha_inicio: fecha_inicio ? parsePeruDate(fecha_inicio) : null,
          fecha_fin: fecha_fin ? parsePeruDate(fecha_fin) : null,
          curso_id: cursoId
        }
      })
    }

    return NextResponse.json({
      status: true,
      message: 'Examen guardado exitosamente',
      examen
    })
  } catch (error: any) {
    console.error('API Examen POST Error:', error)

    return NextResponse.json({ status: false, message: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
