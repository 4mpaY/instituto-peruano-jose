'use client'

import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'

import { handleSessionExpired } from '@/features/shared/http/sessionExpired'

export default function SessionExpiredWatcher() {
    const { status } = useSession()
    const hadSession = useRef(status === 'authenticated')

    useEffect(() => {
        if (status === 'authenticated') {
            hadSession.current = true
        }

        if (status === 'unauthenticated' && hadSession.current) {
            handleSessionExpired()
        }
    }, [status])

    useEffect(() => {
        const interceptorId = axios.interceptors.response.use(
            response => response,
            error => {
                const requestUrl = error?.config?.url || ''

                if (error?.response?.status === 401 && !requestUrl.startsWith('/api/auth/')) {
                    handleSessionExpired()
                }

                return Promise.reject(error)
            }
        )

        return () => axios.interceptors.response.eject(interceptorId)
    }, [])

    return null
}
