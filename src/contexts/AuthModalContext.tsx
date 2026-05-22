'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

import AuthModal from '@/features/shared/components/AuthModal'

type Mode = 'login' | 'register' | 'forgot-password' | 'reset-password'

type AuthModalContextType = {
  openLogin: (callbackUrl?: string) => void
  openRegister: (callbackUrl?: string) => void
  close: () => void
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [callbackUrl, setCallbackUrl] = useState<string | undefined>()

  const openLogin = (url?: string) => {
    setMode('login')
    setCallbackUrl(url)
    setOpen(true)
  }

  const openRegister = (url?: string) => {
    setMode('register')
    setCallbackUrl(url)
    setOpen(true)
  }

  const close = () => setOpen(false)

  return (
    <AuthModalContext.Provider value={{ openLogin, openRegister, close }}>
      {children}
      <AuthModal
        open={open}
        mode={mode}
        callbackUrl={callbackUrl}
        onClose={close}
        onSwitchMode={setMode}
      />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)

  if (!ctx) throw new Error('useAuthModal debe usarse dentro de AuthModalProvider')

  return ctx
}
