'use client'

import { useMemo, useState } from 'react'

import { Box, Grid, InputAdornment, Typography } from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'
import MyCourseCard from './MyCourseCard'

interface Course {
    id: string
    titulo: string
    slug: string
    miniatura?: string
    profesor: {
        nombre: string
        apellido: string
        avatar?: string
    }
    progreso: number
    categoria?: string
    tieneAcceso: boolean
}

interface MyCoursesListProps {
    courses: Course[]
}

const MyCoursesList = ({ courses }: MyCoursesListProps) => {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredCourses = useMemo(() => {
        if (!searchQuery.trim()) {
            return courses
        }

        const lowerQuery = searchQuery.toLowerCase()

        return courses.filter(course =>
            course.titulo.toLowerCase().includes(lowerQuery)
        )
    }, [courses, searchQuery])

    if (courses.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Aún no estas inscrito en ningún curso.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    Explora nuestro catálogo y comienza a aprender hoy mismo.
                </Typography>
            </Box>
        )
    }

    return (
        <Box>
            <Box sx={{ mb: 6, maxWidth: { xs: '100%', sm: 400 } }}>
                <CustomTextField
                    fullWidth
                    placeholder="Buscar curso por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <i className="tabler-search text-[22px]" />
                            </InputAdornment>
                        ),
                        endAdornment: searchQuery ? (
                            <InputAdornment position="end">
                                <i
                                    className="tabler-x text-[22px] cursor-pointer"
                                    onClick={() => setSearchQuery('')}
                                />
                            </InputAdornment>
                        ) : null
                    }}
                />
            </Box>

            {filteredCourses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700 }}>
                        No se encontraron cursos con &quot;{searchQuery}&quot;
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Prueba con otros términos de búsqueda.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={{ xs: 3, sm: 4, md: 6, lg: 8 }}>
                    {filteredCourses.map((course) => (
                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <MyCourseCard
                                titulo={course.titulo}
                                slug={course.slug}
                                miniatura={course.miniatura}
                                profesor={course.profesor}
                                progreso={course.progreso}
                                categoria={course.categoria}
                                tieneAcceso={course.tieneAcceso}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    )
}

export default MyCoursesList
