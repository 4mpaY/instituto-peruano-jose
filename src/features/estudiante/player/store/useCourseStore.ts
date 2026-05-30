import { create } from 'zustand'

export interface Lesson {
    id: string
    titulo: string
    contenido?: string
    orden: number
    video_url?: string
    enlace_reunion?: string
    es_en_vivo?: boolean
    fecha_programada?: string | Date | null
    fecha_fin?: string | Date | null
    completada: boolean
    recursos?: any[]
}

export interface Module {
    id: string
    titulo: string
    orden: number
    lecciones: Lesson[]
}

export interface CourseExamen {
    id: string
    titulo: string
    tipo: 'FINAL' | 'INTERMEDIO'
    peso: number
    progreso_minimo: number
    orden: number | null
    modulo_id: string | null
    puntaje_aprobacion: number
    intentos_maximos: number
    esta_publicado: boolean
}

export interface Course {
    id: string
    slug: string
    titulo: string
    modulos: Module[]
    examenes?: CourseExamen[]
}

type ExamStatus = 'locked' | 'available' | 'in_progress' | 'passed' | 'failed'

type PlayerView = 'lesson' | 'exam' | 'completion' | 'certificate'

interface CourseState {
    course: Course | null
    currentLessonId: string | undefined
    progressPercentage: number
    examStatus: ExamStatus
    examenId: string | null        // ID del examen final
    currentExamenId: string | null // ID del examen actualmente activo (final o intermedio)
    certificateId: string | null
    currentView: PlayerView

    // Actions
    setCourse: (course: Course) => void
    setCurrentLessonId: (lessonId: string | undefined) => void
    updateLessonProgress: (lessonId: string, completed: boolean, newPercentage?: number) => void
    goToNextLesson: () => void
    setExamStatus: (status: ExamStatus) => void
    setExamenId: (id: string | null) => void
    setCurrentExamenId: (id: string | null) => void
    setCertificateId: (id: string | null) => void
    setCurrentView: (view: PlayerView) => void
    openExam: (examenId: string) => void
}

export const useCourseStore = create<CourseState>((set) => ({
    course: null,
    currentLessonId: undefined,
    progressPercentage: 0,
    examStatus: 'locked',
    examenId: null,
    currentExamenId: null,
    certificateId: null,
    currentView: 'lesson',

    setCourse: (course) => {
        set((state) => {
            if (state.course?.id === course.id) return state

            const allLessons = course.modulos.flatMap(m => m.lecciones)
            const completed = allLessons.filter(l => l.completada).length
            const percentage = allLessons.length > 0 ? Math.round((completed / allLessons.length) * 100) : 0

            return {
                course,
                progressPercentage: percentage,
                currentLessonId: state.currentLessonId || course.modulos[0]?.lecciones[0]?.id,
                examStatus: percentage >= 100 ? 'available' : 'locked'
            }
        })
    },

    setCurrentLessonId: (lessonId) => set({ currentLessonId: lessonId, currentView: 'lesson' }),

    updateLessonProgress: (lessonId, completed, newPercentage) => set((state) => {
        if (!state.course) return state

        const updatedModulos = state.course.modulos.map(m => ({
            ...m,
            lecciones: m.lecciones.map(l =>
                l.id === lessonId ? { ...l, completada: completed } : l
            )
        }))

        let percentage = newPercentage

        if (percentage === undefined) {
            const allLessons = updatedModulos.flatMap(m => m.lecciones)
            const completedCount = allLessons.filter(l => l.completada).length

            percentage = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0
        }

        return {
            course: { ...state.course, modulos: updatedModulos },
            progressPercentage: percentage,
            examStatus: percentage >= 100 && state.examStatus === 'locked' ? 'available' : state.examStatus
        }
    }),

    goToNextLesson: () => set((state) => {
        if (!state.course || !state.currentLessonId) return state

        const allLessons = state.course.modulos.flatMap(m => m.lecciones)
        const currentIndex = allLessons.findIndex(l => l.id === state.currentLessonId)

        if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
            return { currentLessonId: allLessons[currentIndex + 1].id, currentView: 'lesson' }
        }

        return state
    }),

    setExamStatus: (status) => set({ examStatus: status }),
    setExamenId: (id) => set({ examenId: id }),
    setCurrentExamenId: (id) => set({ currentExamenId: id }),
    setCertificateId: (id) => set({ certificateId: id }),
    setCurrentView: (view) => set({ currentView: view }),

    openExam: (examenId) => set({ currentExamenId: examenId, currentView: 'exam' })
}))
