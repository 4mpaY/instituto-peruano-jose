// Next Imports
import React from 'react'

import { notFound } from 'next/navigation'

import { Box } from '@mui/material'

import { getAuthSession } from '@/utils/libs/auth-helpers'
import { AxiosWebCursos } from '@/features/web/cursos/http/axiosWebCursos'

// Component Imports
import CourseDetail from '@/features/web/courses/components/CourseDetail'

// Server Action / Data Fetching
async function getCourseData(slug: string, token: string | null) {
    try {
        const axiosWebCursos = new AxiosWebCursos({
            getAuthToken: () => token
        })

        const data = await axiosWebCursos.getCourseBySlug(slug)

        return data
    } catch (error) {
        console.error('Error fetching course data via API:', error)

        return null
    }
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
    const session = await getAuthSession()
    const token = session?.user?.accessToken ?? null

    const course = await getCourseData(params.slug, token)

    if (!course) {
        notFound()
    }

    const courseJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.titulo,
        description: course.descripcion || `Curso online: ${course.titulo}`,
        url: `https://ipgingenierosperu.com/cursos/${params.slug}`,
        image: course.miniatura || 'https://ipgingenierosperu.com/images/og-default.jpg',
        provider: {
            '@type': 'Organization',
            name: 'IPG Ingenieros',
            sameAs: 'https://ipgingenierosperu.com',
        },
        offers: {
            '@type': 'Offer',
            price: course.es_gratis ? '0' : String(course.precio ?? 0),
            priceCurrency: course.moneda || 'PEN',
            availability: 'https://schema.org/InStock',
            url: `https://ipgingenierosperu.com/cursos/${params.slug}`,
        },
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
            <CourseDetail course={course} />
        </Box>
    )
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const course = await getCourseData(params.slug, null)

    if (!course) return { title: 'Curso no encontrado' }

    const description = course.descripcion || `Aprende ${course.titulo} con IPG Ingenieros. Curso online con certificado verificable.`
    const canonicalUrl = `https://ipgingenierosperu.com/cursos/${params.slug}`
    const ogImage = course.miniatura || '/images/og-default.jpg'

    return {
        title: `${course.titulo} | IPG Ingenieros`,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: course.titulo,
            description,
            url: canonicalUrl,
            type: 'article',
            images: [{ url: ogImage, width: 1200, height: 630, alt: course.titulo }],
        },
        twitter: {
            card: 'summary_large_image',
            title: course.titulo,
            description,
            images: [ogImage],
        },
    }
}
