import { z } from 'zod'

import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'

const bodySchema = z.object({
  notas: z.array(z.object({
    examenId: z.string().uuid(),
    nota: z.number().min(0).max(20)
  }))
})

/**
 * PATCH /api/admin/cursos/[id]/alumnos/[inscripcionId]/notas
 * Edita manualmente las notas de un alumno en un curso.
 * Recibe notas en escala vigesimal (0-20), actualiza IntentoExamen
 * y recalcula nota_final en Inscripcion.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; inscripcionId: string } }
) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized || auth.user.rol !== 'ADMIN') {
      return ApiResponse.error(request, 'No tienes permisos para realizar esta acción', 403)
    }

    const body = await request.json()
    const { notas } = bodySchema.parse(body)

    const { id: cursoId, inscripcionId } = params

    // Verificar que la inscripción pertenece al curso
    const inscripcion = await prisma.inscripcion.findFirst({
      where: { id: inscripcionId, curso_id: cursoId },
      select: { id: true, usuario_id: true }
    })

    if (!inscripcion) {
      return ApiResponse.error(request, 'Inscripción no encontrada', 404)
    }

    const userId = inscripcion.usuario_id

    // Obtener todos los exámenes del curso con sus pesos
    const examenesCurso = await prisma.examen.findMany({
      where: { curso_id: cursoId },
      select: { id: true, peso: true, puntaje_aprobacion: true }
    })

    // Actualizar o crear IntentoExamen por cada nota editada
    for (const { examenId, nota } of notas) {
      const puntaje = nota * 5 // vigesimal → porcentaje (0-100)

      const examen = examenesCurso.find(e => e.id === examenId)
      const estaAprobado = examen ? puntaje >= examen.puntaje_aprobacion : puntaje >= 60

      const mejorIntento = await prisma.intentoExamen.findFirst({
        where: { usuario_id: userId, examen_id: examenId },
        orderBy: { puntaje: 'desc' },
        select: { id: true }
      })

      if (mejorIntento) {
        await prisma.intentoExamen.update({
          where: { id: mejorIntento.id },
          data: { puntaje, esta_aprobado: estaAprobado, enviado_en: new Date() }
        })
      } else {
        await prisma.intentoExamen.create({
          data: {
            usuario_id: userId,
            examen_id: examenId,
            puntaje,
            esta_aprobado: estaAprobado,
            enviado_en: new Date()
          }
        })
      }
    }

    // Recalcular nota_final ponderada con todos los exámenes del curso
    const mejoresIntentos = await Promise.all(
      examenesCurso.map(async (ex) => {
        const mejor = await prisma.intentoExamen.findFirst({
          where: { usuario_id: userId, examen_id: ex.id },
          orderBy: { puntaje: 'desc' },
          select: { puntaje: true }
        })

        return { peso: ex.peso, puntaje: mejor?.puntaje ?? 0, puntajeAprobacion: ex.puntaje_aprobacion }
      })
    )

    const pesoTotal = examenesCurso.reduce((sum, ex) => sum + ex.peso, 0)
    const sumaPonderada = mejoresIntentos.reduce((sum, item) => sum + item.puntaje * item.peso, 0)
    const notaFinal = pesoTotal > 0 ? sumaPonderada / pesoTotal : 0

    const puntajeAprobacionMin = Math.min(...mejoresIntentos.map(i => i.puntajeAprobacion))
    const estadoNota = notaFinal >= puntajeAprobacionMin ? 'APROBADO' : 'DESAPROBADO'

    await prisma.inscripcion.update({
      where: { id: inscripcionId },
      data: { nota_final: notaFinal, estado_nota: estadoNota }
    })

    return ApiResponse.success(request, {
      nota_final: notaFinal,
      nota_final_vigesimal: (notaFinal * 0.2).toFixed(1),
      estado_nota: estadoNota
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
