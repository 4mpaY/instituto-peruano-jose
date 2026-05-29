import { ApiResponse } from '@/utils/libs/apiResponse'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { requireAuth } from '@/utils/libs/auth-helpers'

/**
 * POST /api/estudiante/examen/[examenId]/enviar
 * Envía las respuestas del examen y califica automáticamente
 * Body: { respuestas: [{ preguntaId: string, opcionId: string }] }
 */
export async function POST(request: Request, { params }: { params: { examenId: string } }) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const { examenId } = params
    const { respuestas } = await request.json()

    if (!respuestas || !Array.isArray(respuestas)) {
      return ApiResponse.error(request, 'Las respuestas son requeridas', 400)
    }

    // 1. Obtener el examen con preguntas y opciones correctas
    const examen = await prisma.examen.findUnique({
      where: { id: examenId },
      include: {
        curso: { select: { id: true } },
        preguntas: {
          include: {
            opciones: true
          }
        }
      }
    })

    if (!examen) {
      return ApiResponse.error(request, 'Examen no encontrado', 404)
    }

    const ahora = new Date()

    if ((examen as any).fecha_inicio && ahora < (examen as any).fecha_inicio) {
      return ApiResponse.error(request, 'Este examen aún no está disponible', 403)
    }

    if ((examen as any).fecha_fin && ahora > (examen as any).fecha_fin) {
      return ApiResponse.error(request, 'El período de evaluación ha finalizado', 403)
    }

    // 2. Verificar inscripción y progreso
    const inscripcion = await prisma.inscripcion.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: auth.user.id,
          curso_id: examen.curso.id
        }
      }
    })

    if (!inscripcion || inscripcion.estado !== 'ACTIVO') {
      return ApiResponse.error(
        request,
        !inscripcion || inscripcion.estado !== 'ACTIVO'
          ? 'No estás inscrito en este curso'
          : 'Tu acceso a este curso ha caducado',
        403
      )
    }

    const progresoCurso = await prisma.progresoCurso.findUnique({
      where: {
        usuario_id_curso_id: {
          usuario_id: auth.user.id,
          curso_id: examen.curso.id
        }
      }
    })

    if (!progresoCurso || progresoCurso.porcentaje_progreso < examen.progreso_minimo) {
      return ApiResponse.error(request, `Debes alcanzar ${examen.progreso_minimo}% de progreso primero`, 403)
    }

    // 3. Verificar intentos restantes
    const intentosRealizados = await prisma.intentoExamen.count({
      where: {
        usuario_id: auth.user.id,
        examen_id: examenId,
        enviado_en: { not: null }
      }
    })

    if (intentosRealizados >= examen.intentos_maximos) {
      return ApiResponse.error(request, 'Has agotado todos tus intentos', 403)
    }

    // 4. Verificar si ya aprobó
    const yaAprobado = await prisma.intentoExamen.findFirst({
      where: {
        usuario_id: auth.user.id,
        examen_id: examenId,
        esta_aprobado: true
      }
    })

    if (yaAprobado) {
      return ApiResponse.error(request, 'Ya has aprobado este examen', 400)
    }

    // 5. Calificar respuestas
    let puntajeTotal = 0
    let puntajeObtenido = 0

    const respuestasCalificadas = respuestas
      .map((resp: { preguntaId: string; opcionId: string }) => {
        const pregunta = examen.preguntas.find(p => p.id === resp.preguntaId)

        if (!pregunta) return null

        puntajeTotal += pregunta.puntos

        const opcionCorrecta = pregunta.opciones.find(o => o.es_correcta)
        const esCorrecta = opcionCorrecta?.id === resp.opcionId
        const puntos = esCorrecta ? pregunta.puntos : 0

        puntajeObtenido += puntos

        return {
          pregunta_id: resp.preguntaId,
          opcion_seleccionada_id: resp.opcionId,
          opcion_correcta_id: opcionCorrecta?.id,
          es_correcta: esCorrecta,
          puntos_obtenidos: puntos
        }
      })
      .filter(Boolean)

    // Calcular porcentaje
    const porcentaje = puntajeTotal > 0 ? Math.round((puntajeObtenido / puntajeTotal) * 100) : 0
    const aprobado = porcentaje >= examen.puntaje_aprobacion

    // 6. Guardar intento y respuestas, y calcular nota ponderada
    const intento = await prisma.$transaction(async tx => {
      const nuevoIntento = await tx.intentoExamen.create({
        data: {
          usuario_id: auth.user.id,
          examen_id: examenId,
          puntaje: porcentaje,
          esta_aprobado: aprobado,
          enviado_en: new Date(),
          respuestas: {
            create: respuestasCalificadas.map((r: any) => ({
              pregunta_id: r.pregunta_id,
              opcion_seleccionada_id: r.opcion_seleccionada_id,
              es_correcta: r.es_correcta,
              puntos_obtenidos: r.puntos_obtenidos
            }))
          }
        }
      })

      // Calcular nota ponderada después de guardar el intento
      const examenesCurso = await tx.examen.findMany({
        where: {
          curso_id: examen.curso.id,
          esta_publicado: true
        }
      })

      if (examenesCurso.length > 0) {
        // Obtener mejor intento para cada examen
        const intentosPorExamen = await Promise.all(
          examenesCurso.map(async ex => {
            const mejorIntento = await tx.intentoExamen.findFirst({
              where: {
                usuario_id: auth.user.id,
                examen_id: ex.id
              },
              orderBy: { puntaje: 'desc' }
            })

            return {
              examenId: ex.id,
              peso: ex.peso,
              puntaje: mejorIntento?.puntaje ?? null
            }
          })
        )

        // Calcular nota ponderada: Σ(puntaje[i] × peso[i]) / Σ(peso[i])
        const intentosConPuntaje = intentosPorExamen.filter(i => i.puntaje !== null)
        const sumaPesos = intentosPorExamen.reduce((sum, i) => sum + i.peso, 0)

        if (intentosConPuntaje.length > 0 && sumaPesos > 0) {
          const notaPonderada = intentosConPuntaje.reduce((sum, i) => sum + (i.puntaje ?? 0) * i.peso, 0) / sumaPesos

          // Determinar estado (aprobado/desaprobado)
          const estadoNota = notaPonderada >= examen.puntaje_aprobacion ? 'APROBADO' : 'DESAPROBADO'

          // Actualizar inscripción con nota final y estado
          await tx.inscripcion.update({
            where: {
              usuario_id_curso_id: {
                usuario_id: auth.user.id,
                curso_id: examen.curso.id
              }
            },
            data: {
              nota_final: notaPonderada,
              estado_nota: estadoNota
            }
          })
        }
      }

      return nuevoIntento
    })

    return ApiResponse.success(request, {
      intentoId: intento.id,
      puntaje: porcentaje,
      aprobado,
      puntajeAprobacion: examen.puntaje_aprobacion,
      respuestasCorrectas: respuestasCalificadas.filter((r: any) => r.es_correcta).length,
      totalPreguntas: examen.preguntas.length,
      intentosRestantes: examen.intentos_maximos - intentosRealizados - 1,
      detallesRespuestas: respuestasCalificadas.map((r: any) => ({
        preguntaId: r.pregunta_id,
        opcionSeleccionadaId: r.opcion_seleccionada_id,
        opcionCorrectaId: r.opcion_correcta_id,
        esCorrecta: r.es_correcta
      }))
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
