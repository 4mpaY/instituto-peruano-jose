'use client'

import { useEffect } from 'react'

import { useSearchParams } from 'next/navigation'

import { useAuthModal } from '@/contexts/AuthModalContext'

const LoginRedirectHandler = () => {
  const searchParams = useSearchParams()
  const { openLogin } = useAuthModal()

  useEffect(() => {
    // withAuth redirige al home con ?callbackUrl= cuando no hay sesión
    const callbackUrl = searchParams.get('callbackUrl')

    if (callbackUrl) {
      openLogin(callbackUrl)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default LoginRedirectHandler
