import { notFound, redirect } from 'next/navigation'

import { AxiosPlayer } from '@/features/estudiante/player/http/axiosPlayer'
import CoursePlayerView from '@/features/estudiante/player/components/CoursePlayerView'
import { getAuthSession } from '@/utils/libs/auth-helpers'
import { prisma } from '@/lib/prisma'

export default async function LearningPage({
  params,
  searchParams
}: {
  params: { slug: string }
  searchParams: { leccion?: string; examen?: string }
}) {
  const session = await getAuthSession()

  if (!session) {
    redirect(`/cursos/${params.slug}?login=1`)
  }

  // Consultamos los datos del asesor y del grupo de whatsapp correspondientes al curso
  const cursoData = await prisma.curso.findUnique({
    where: { slug: params.slug },
    select: {
      numero_asesor: true,
      grupo_whatsapp: true,
      profesor: {
        select: {
          celular: true
        }
      }
    }
  })

  // Establecemos el número telefónico del asesor, priorizando 'numero_asesor' y usando 'profesor.celular' como fallback
  let phoneNumberProfesor = '51959436827'

  if (cursoData?.numero_asesor) {
    phoneNumberProfesor = cursoData.numero_asesor
  } else if (cursoData?.profesor?.celular) {
    phoneNumberProfesor = cursoData.profesor.celular
  }

  const grupoWhatsapp = cursoData?.grupo_whatsapp ?? null

  const token = session.user?.accessToken ?? null

  const axiosPlayer = new AxiosPlayer({
    getAuthToken: () => token
  })

  try {
    const data = await axiosPlayer.getPlayerData(params.slug)

    console.log(data)

    return (
      <CoursePlayerView
        course={data.course}
        initialLessonId={searchParams.leccion}
        initialExamenId={searchParams.examen}
        phoneNumberProfesor={phoneNumberProfesor}
        grupoWhatsapp={grupoWhatsapp}
      />
    )
  } catch (err: any) {
    const code = err?.code || err?.error

    if (code === 'UNCISCRIBED') {
      redirect(`/cursos/${params.slug}?sin-acceso=1`)
    }

    notFound()
  }
}
