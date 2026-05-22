import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'

/**
 * GET /api/admin/cursos/[id]/alumnos
 * Obtiene los alumnos inscritos en un curso, con opción de búsqueda
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized || auth.user.rol !== 'ADMIN') {
      return ApiResponse.error(request, 'No tienes permisos para realizar esta acción', 403)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const cursoId = params.id

    // Validar existencia del curso
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, precio_certificado: true }
    })

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    const where: any = {
      curso_id: cursoId,
    }

    if (search) {
      where.usuario = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { numero_documento: { contains: search } },
          { correo: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    const examenes = await prisma.examen.findMany({
      where: { curso_id: cursoId },
      orderBy: { creado_en: 'asc' },
      select: { 
        id: true, 
        titulo: true, 
        peso: true
      }
    })
    
    const totalExamenes = examenes.length

    const inscripciones = await prisma.inscripcion.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
            numero_documento: true,
            avatar: true,
            intentos_examen: {
              where: { examen: { curso_id: cursoId } },
              select: { examen_id: true, puntaje: true },
              orderBy: { puntaje: 'desc' } // Para tomar el mejor intento
            },
            certificados: {
              where: { curso_id: cursoId },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { inscrito_en: 'desc' }
    })

    const alumnos = inscripciones.map(i => {
      // Agrupar el mejor intento por examen (viene como porcentaje 0-100)
      const mejoresIntentos: Record<string, number> = {}

      i.usuario.intentos_examen.forEach(intento => {
        if (!mejoresIntentos[intento.examen_id] || (intento.puntaje || 0) > mejoresIntentos[intento.examen_id]) {
          mejoresIntentos[intento.examen_id] = intento.puntaje || 0
        }
      })

      const evaluacionesRealizadas = Object.keys(mejoresIntentos).length

      const notas = examenes.map((ex, index) => {
        const puntajePorcentaje = mejoresIntentos[ex.id] || 0
        const notaBase20 = puntajePorcentaje * 0.2

        return `N${index + 1}: ${notaBase20.toFixed(1)}`
      }).join(', ')

      let sumaPonderada = 0
      let pesoTotal = 0

      examenes.forEach(ex => {
        const puntajePorcentaje = mejoresIntentos[ex.id] || 0

        sumaPonderada += puntajePorcentaje * ex.peso
        pesoTotal += ex.peso
      })

      const promedioPorcentajeCalculado = pesoTotal > 0 ? (sumaPonderada / pesoTotal) : 0
      
      // Convertir el porcentaje calculado (0-100) a base vigesimal peruana (0-20)
      const promedioVigesimalCalculado = (promedioPorcentajeCalculado * 0.2).toFixed(1);

      // Si existe nota_final en la inscripción (también es porcentaje 0-100), la convertimos a base 20
      const promedioFinal = i.nota_final !== null ? (i.nota_final * 0.2).toFixed(1) : (
        evaluacionesRealizadas > 0 
          ? promedioVigesimalCalculado
          : '0.0'
      )

      return {
        id: i.usuario.id,
        inscripcion_id: i.id,
        certificado_habilitado: i.certificado_habilitado,
        nombre: i.usuario.nombre,
        apellido: i.usuario.apellido,
        correo: i.usuario.correo,
        numero_documento: i.usuario.numero_documento,
        avatar: i.usuario.avatar,
        estado_inscripcion: i.estado,
        inscrito_en: i.inscrito_en,
        completado_en: i.completado_en,
        evaluaciones_realizadas: evaluacionesRealizadas,
        total_examenes: totalExamenes,
        notas: totalExamenes > 0 ? notas : 'Sin exámenes',
        promedio: promedioFinal,
        tiene_certificado: i.usuario.certificados.length > 0
      }
    })

    const precioCertificado = curso.precio_certificado ? Number(curso.precio_certificado) : null

    return ApiResponse.success(request, { alumnos, total: alumnos.length, totalExamenes, precio_certificado: precioCertificado })
  } catch (error) {
    return handleApiError(error, request)
  }
}
