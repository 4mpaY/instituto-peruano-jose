import { signOut } from 'next-auth/react'

let handled = false

export function handleSessionExpired() {
  if (handled) return
  if (window.location.pathname.startsWith('/login')) return

  handled = true

  signOut({ redirect: false }).finally(() => {
    window.location.replace('/')
  })
}
