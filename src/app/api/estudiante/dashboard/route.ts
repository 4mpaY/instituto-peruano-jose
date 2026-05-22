export const dynamic = 'force-dynamic'

import prisma from '@/utils/libs/prisma'
import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'

/**
 * GET /api/estudiante/dashboard
 * Retorna los datos resumidos para el dashboard del estudiante:
 * - KPIs: total inscritos, en progreso, completados, certificados
 * - Últimos 4 cursos activos con progreso
 * - Últimos 3 certificados
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)

    if (!auth.authorized) return auth.error

    const usuarioId = auth.user.id

    const [inscripciones, totalCertificados, certificados] = await Promise.all([
      prisma.inscripcion.findMany({
        where: { usuario_id: usuarioId, estado: 'ACTIVO' },
        include: {
          curso: {
            include: {
              profesor: { select: { nombre: true, apellido: true } },
              categoria: { select: { nombre: true } },
              progreso: { where: { usuario_id: usuarioId } }
            }
          }
        },
        orderBy: { inscrito_en: 'desc' }
      }),
      prisma.certificado.count({ where: { usuario_id: usuarioId } }),
      prisma.certificado.findMany({
        where: { usuario_id: usuarioId },
        include: {
          curso: {
            select: {
              id: true,
              titulo: true,
              slug: true,
              miniatura: true,
              nivel: true,
              profesor: { select: { nombre: true, apellido: true } }
            }
          }
        },
        orderBy: { emitido_en: 'desc' },
        take: 3
      })
    ])

    const cursosConProgreso = inscripciones.map(ins => ({
      id: ins.curso.id,
      titulo: ins.curso.titulo,
      slug: ins.curso.slug,
      miniatura: ins.curso.miniatura ?? undefined,
      profesor: ins.curso.profesor,
      categoria: ins.curso.categoria?.nombre,
      progreso: ins.curso.progreso[0]?.porcentaje_progreso ?? 0
    }))

    const totalInscritos = cursosConProgreso.length
    const cursosCompletados = cursosConProgreso.filter(c => c.progreso >= 100).length
    const cursosEnProgreso = cursosConProgreso.filter(c => c.progreso > 0 && c.progreso < 100).length

    // Cursos con menos del 100% de progreso, ordenados por progreso desc (los más avanzados primero)
    const cursosRecientes = [...cursosConProgreso]
      .filter(c => c.progreso < 100)
      .sort((a, b) => b.progreso - a.progreso)
      .slice(0, 4)

    return ApiResponse.success(request, {
      kpis: {
        totalInscritos,
        cursosEnProgreso,
        cursosCompletados,
        totalCertificados
      },
      cursosRecientes,
      certificadosRecientes: certificados.map(c => ({
        id: c.id,
        codigo_verificacion: c.codigo_verificacion,
        emitido_en: c.emitido_en,
        curso: c.curso
      }))
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
