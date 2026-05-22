'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
    Box,
    Button,
    Card,
    Chip,
    Typography,
    CircularProgress,
    Tab
} from '@mui/material'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { useSession } from 'next-auth/react'

// Componentes extraídos
import { TabInformacion } from '../components/CourseBuilder/TabInformacion'
import { TabContenido } from '../components/CourseBuilder/TabContenido'
import { TabConfiguracion } from '../components/CourseBuilder/TabConfiguracion'
import { TabDetallesPremium } from '../components/CourseBuilder/TabDetallesPremium'
import { TabComentarios } from '../components/CourseBuilder/TabComentarios'
import { TabEvaluacion } from '../components/CourseBuilder/TabEvaluacion'
import { TabValoraciones } from '../components/CourseBuilder/TabValoraciones'

import { useCurso } from '../hooks/useCursos'

interface CourseBuilderPageProps {
    cursoId: string
    profesores: { id: string; nombre: string; apellido: string }[]
}

export function CourseBuilderPage({ cursoId, profesores }: CourseBuilderPageProps) {
    const { data: curso, isLoading, refetch } = useCurso(cursoId)
    const [activeTab, setActiveTab] = useState('1')
    const router = useRouter()
    const { data: session } = useSession()

    if (isLoading || !curso) {
        return (
            <Box display='flex' justifyContent='center' p={8}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant='h4' fontWeight={600}>
                        {curso.titulo}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                            size='small'
                            variant='tonal'
                            label={curso.estado === 'BORRADOR' ? 'Borrador' : curso.estado === 'PUBLICADO' ? 'Publicado' : 'Archivado'}
                            color={curso.estado === 'BORRADOR' ? 'warning' : curso.estado === 'PUBLICADO' ? 'success' : 'secondary'}
                        />
                        <Typography variant='body2' color='text.secondary'>
                            · {curso.modulos?.length ?? 0} módulos
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant='outlined'
                    onClick={() => router.push(session?.user?.rol === 'ADMIN' ? '/admin/cursos' : '/profesor/mis-cursos')}
                    startIcon={<i className='tabler-arrow-left' />}
                >
                    Volver a Cursos
                </Button>
            </Box>

            {/* Tabs */}
            <TabContext value={activeTab}>
                <Card>
                    <TabList onChange={(_, val) => setActiveTab(val)} variant='scrollable'>
                        <Tab icon={<i className='tabler-info-circle' />} iconPosition='start' label='Información' value='1' />
                        <Tab icon={<i className='tabler-list-tree' />} iconPosition='start' label='Contenido' value='2' />
                        <Tab icon={<i className='tabler-star' />} iconPosition='start' label='Detalles Premium' value='4' />
                        {/* <Tab icon={<i className='tabler-clipboard-check' />} iconPosition='start' label='Evaluación' value='6' /> */}
                        <Tab icon={<i className='tabler-settings' />} iconPosition='start' label='Configuración' value='3' />
                        <Tab icon={<i className='tabler-message' />} iconPosition='start' label='Comentarios' value='5' />
                        <Tab icon={<i className='tabler-star-filled' />} iconPosition='start' label='Valoraciones' value='7' />
                    </TabList>

                    <TabPanel value='1' sx={{ p: 5 }}>
                        <TabInformacion curso={curso} profesores={profesores} onSuccess={refetch} />
                    </TabPanel>

                    <TabPanel value='2' sx={{ p: 5 }}>
                        <TabContenido curso={curso} onSuccess={refetch} />
                    </TabPanel>

                    <TabPanel value='3' sx={{ p: 5 }}>
                        <TabConfiguracion curso={curso} onSuccess={refetch} />
                    </TabPanel>

                    <TabPanel value='4' sx={{ p: 5 }}>
                        <TabDetallesPremium curso={curso} onSuccess={refetch} />
                    </TabPanel>

                    <TabPanel value='5' sx={{ p: 5 }}>
                        <TabComentarios cursoId={curso.id} />
                    </TabPanel>

                    <TabPanel value='6' sx={{ p: 5 }}>
                        <TabEvaluacion cursoId={curso.id} />
                    </TabPanel>

                    <TabPanel value='7' sx={{ p: 5 }}>
                        <TabValoraciones cursoId={curso.id} />
                    </TabPanel>
                </Card>
            </TabContext>
        </Box>
    )
}
