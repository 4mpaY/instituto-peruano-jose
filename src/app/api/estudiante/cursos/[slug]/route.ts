export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

import { verify } from 'jsonwebtoken'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { getAuthSession } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    let user: any = null

    // 1. Intentar obtener sesión por cookies (NextAuth estándar)
    const session = await getAuthSession()

    if (session) {
      user = session.user
    } else {
      // 2. Si no hay sesión, intentar obtener token del header Authorization (Bearer)
      // Esto es necesario para llamadas servidor-servidor desde Server Components
      const authHeader = request.headers.get('Authorization')

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]

        try {
          const decoded = verify(token, JWT_SECRET) as any

          if (decoded) {
            user = decoded
          }
        } catch (err) {
          console.error('Error al verificar token Bearer:', err)
        }
      }
    }

    if (!user) {
      return ApiResponse.error(request, 'No autorizado', 401)
    }

    const { slug } = params

    const course = await prisma.curso.findUnique({
      where: { slug },
      include: {
        modulos: {
          include: {
            lecciones: {
              include: {
                progreso: {
                  where: { usuario_id: user.id }
                }
              },
              orderBy: { orden: 'asc' }
            }
          },
          orderBy: { orden: 'asc' }
        },
        examenes: {
          where: { esta_publicado: true },
          select: {
            id: true,
            titulo: true,
            tipo: true,
            peso: true,
            progreso_minimo: true,
            orden: true,
            modulo_id: true,
            puntaje_aprobacion: true,
            intentos_maximos: true,
            esta_publicado: true,
            fecha_inicio: true,
            fecha_fin: true
          }
        }
      }
    })

    if (!course) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    const isAdmin = user.rol === 'ADMIN'
    const isCourseProfessor = user.rol === 'PROFESOR' && course.profesor_id === user.id

    let inscription = null

    if (!isAdmin && !isCourseProfessor) {
      inscription = await prisma.inscripcion.findUnique({
        where: {
          usuario_id_curso_id: {
            usuario_id: user.id,
            curso_id: course.id
          }
        }
      })

      const vigenciaMeses = course.vigencia_meses ?? 0
      let accesoVigente = true

      if (vigenciaMeses > 0 && inscription) {
        const accesHasta = new Date(inscription.inscrito_en)

        accesHasta.setMonth(accesHasta.getMonth() + vigenciaMeses)
        accesoVigente = accesHasta > new Date()
      }

      if (!inscription || inscription.estado !== 'ACTIVO' || !accesoVigente) {
        return NextResponse.json(
          {
            status: false,
            code: 'UNCISCRIBED',
            message:
              !inscription || inscription.estado !== 'ACTIVO'
                ? 'Usuario no matriculado'
                : 'Tu acceso a este curso ha caducado',
            statusCode: 403,
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        )
      }
    }

    // Obtener intentos del usuario para todos los exámenes del curso (una sola query)
    const intentosUsuario = await prisma.intentoExamen.findMany({
      where: {
        usuario_id: user.id,
        examen: { curso_id: course.id },
        enviado_en: { not: null }
      },
      select: { examen_id: true, esta_aprobado: true, puntaje: true }
    })

    const intentosPorExamen: Record<
      string,
      { intentos_realizados: number; ya_aprobado: boolean; mejor_puntaje: number | null }
    > = {}

    intentosUsuario.forEach(intento => {
      if (!intentosPorExamen[intento.examen_id]) {
        intentosPorExamen[intento.examen_id] = { intentos_realizados: 0, ya_aprobado: false, mejor_puntaje: null }
      }

      intentosPorExamen[intento.examen_id].intentos_realizados += 1

      if (intento.esta_aprobado) {
        intentosPorExamen[intento.examen_id].ya_aprobado = true
      }

      if (intento.puntaje != null) {
        const actual = intentosPorExamen[intento.examen_id].mejor_puntaje ?? -Infinity

        if (intento.puntaje > actual) {
          intentosPorExamen[intento.examen_id].mejor_puntaje = intento.puntaje
        }
      }
    })

    const formattedCourse = {
      id: course.id,
      slug: course.slug,
      titulo: course.titulo,
      descripcion: (course as any).descripcion || null,
      que_aprenderas: (course as any).que_aprenderas || null,
      a_quien_va_dirigido: (course as any).a_quien_va_dirigido || null,
      miniatura: (course as any).miniatura || null,
      modulos: course.modulos.map(m => ({
        id: m.id,
        titulo: m.titulo,
        orden: m.orden,
        lecciones: m.lecciones
          .filter(l => l.estado === 'PUBLICADO')
          .map(l => ({
            id: l.id,
            titulo: l.titulo,
            contenido: l.contenido,
            orden: l.orden,
            video_url: l.video_url,
            es_en_vivo: (l as any).es_en_vivo,
            fecha_programada: (l as any).fecha_programada,
            fecha_fin: (l as any).fecha_fin,
            enlace_reunion: (l as any).enlace_reunion,
            completada: l.progreso[0]?.esta_completado || false,
            recursos: Array.isArray(l.recursos) ? l.recursos : []
          }))
      })),
      examenes: course.examenes.map(ex => ({
        ...ex,
        intentos_realizados: intentosPorExamen[ex.id]?.intentos_realizados ?? 0,
        ya_aprobado: intentosPorExamen[ex.id]?.ya_aprobado ?? false,
        mejor_puntaje: intentosPorExamen[ex.id]?.mejor_puntaje ?? null
      })),
      completar_automatico: course.completar_automatico,
      inscripcion: inscription
        ? {
            estado_nota: inscription.estado_nota,
            nota_final: inscription.nota_final
          }
        : null
    }

    return ApiResponse.success(request, { course: formattedCourse })
  } catch (error) {
    return handleApiError(error, request)
  }
}
