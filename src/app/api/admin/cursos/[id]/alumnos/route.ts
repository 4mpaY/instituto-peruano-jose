import { ApiResponse } from '@/utils/libs/apiResponse'
import { requireAuth } from '@/utils/libs/auth-helpers'
import { handleApiError } from '@/utils/libs/validation'
import prisma from '@/utils/libs/prisma'
import { getCertificadoHabilitacionPorCurso } from '@/app/api/_shared/certificados/getInscripcionCertificadoHabilitacion'

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
      select: { id: true, precio_certificado: true, moneda: true }
    })

    if (!curso) {
      return ApiResponse.error(request, 'Curso no encontrado', 404)
    }

    const [preciosRow] = await prisma.$queryRaw<
      Array<{ precio_certificado_ipg: unknown; precio_certificado_cip: unknown }>
    >`
      SELECT precio_certificado_ipg, precio_certificado_cip FROM cursos WHERE id = ${cursoId}
    `

    const { resolvePrecioCertificadoIpg, resolvePrecioCertificadoCip } = await import(
      '@/utils/functions/certificadoPrecios'
    )

    const precioIpg = resolvePrecioCertificadoIpg({
      precio_certificado: curso.precio_certificado ? Number(curso.precio_certificado) : null,
      precio_certificado_ipg: preciosRow?.precio_certificado_ipg,
    })

    const precioCip = resolvePrecioCertificadoCip({
      precio_certificado: curso.precio_certificado ? Number(curso.precio_certificado) : null,
      precio_certificado_cip: preciosRow?.precio_certificado_cip,
    })

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
        peso: true,
        puntaje_aprobacion: true
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
            celular: true,
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

    const habilitacionMap = await getCertificadoHabilitacionPorCurso(cursoId)

    const pedidosCert = await prisma.$queryRaw<
      Array<{
        usuario_id: string
        certificado_tipo: string | null
        estado: string
        id: string
        numero_pedido: number
        pagado_en: Date | null
      }>
    >`
      SELECT
        p.usuario_id,
        d.certificado_tipo::text AS certificado_tipo,
        p.estado::text AS estado,
        p.id,
        p.numero_pedido,
        p.pagado_en
      FROM pedidos p
      JOIN detalles_pedido d ON d.pedido_id = p.id
      WHERE p.tipo = 'CERTIFICADO'::"TipoPedido"
        AND d.curso_id = ${cursoId}
        AND p.estado IN ('PENDIENTE'::"EstadoPedido", 'COMPLETADO'::"EstadoPedido")
      ORDER BY p.creado_en DESC
    `

    const pedidoPorUsuarioTipo = new Map<
      string,
      { estado: string; id: string; numero_pedido: number; pagado_en: Date | null }
    >()

    for (const p of pedidosCert) {
      const tipo = String(p.certificado_tipo || 'IPG').toUpperCase() === 'CIP' ? 'CIP' : 'IPG'
      const key = `${p.usuario_id}:${tipo}`

      if (!pedidoPorUsuarioTipo.has(key)) {
        pedidoPorUsuarioTipo.set(key, {
          estado: p.estado,
          id: p.id,
          numero_pedido: p.numero_pedido,
          pagado_en: p.pagado_en,
        })
      }
    }

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

        return `N${index + 1}: ${Math.round(notaBase20)}`
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
      const promedioVigesimalCalculado = Math.round(promedioPorcentajeCalculado * 0.2).toString();

      // Si existe nota_final en la inscripción (también es porcentaje 0-100), la convertimos a base 20
      const promedioFinal = i.nota_final !== null ? Math.round(i.nota_final * 0.2).toString() : (
        evaluacionesRealizadas > 0 
          ? promedioVigesimalCalculado
          : '0'
      )

      const notasDetalle = examenes.map(ex => ({
        examenId: ex.id,
        titulo: ex.titulo,
        nota: Math.round((mejoresIntentos[ex.id] || 0) * 0.2)
      }))

      const hab = habilitacionMap.get(i.id)
      const pedidoIpg = pedidoPorUsuarioTipo.get(`${i.usuario.id}:IPG`) ?? null
      const pedidoCip = pedidoPorUsuarioTipo.get(`${i.usuario.id}:CIP`) ?? null

      return {
        id: i.usuario.id,
        inscripcion_id: i.id,
        certificado_habilitado: hab?.certificado_habilitado ?? i.certificado_habilitado,
        certificado_ipg_habilitado: hab?.certificado_ipg_habilitado ?? i.certificado_habilitado,
        certificado_cip_habilitado: hab?.certificado_cip_habilitado ?? false,
        nombre: i.usuario.nombre,
        apellido: i.usuario.apellido,
        correo: i.usuario.correo,
        numero_documento: i.usuario.numero_documento,
        celular: i.usuario.celular,
        avatar: i.usuario.avatar,
        estado_inscripcion: i.estado,
        inscrito_en: i.inscrito_en,
        completado_en: i.completado_en,
        evaluaciones_realizadas: evaluacionesRealizadas,
        total_examenes: totalExamenes,
        notas: totalExamenes > 0 ? notas : 'Sin exámenes',
        notas_detalle: notasDetalle,
        promedio: promedioFinal,
        tiene_certificado: i.usuario.certificados.length > 0,
        pedido_cert_ipg: pedidoIpg,
        pedido_cert_cip: pedidoCip,
      }
    })

    const precioCertificado = curso.precio_certificado ? Number(curso.precio_certificado) : null

    return ApiResponse.success(request, {
      alumnos,
      total: alumnos.length,
      totalExamenes,
      examenes,
      precio_certificado: precioCertificado,
      precios_certificado: {
        ipg: precioIpg,
        cip: precioCip,
        moneda: curso.moneda || 'PEN',
      },
    })
  } catch (error) {
    return handleApiError(error, request)
  }
}
