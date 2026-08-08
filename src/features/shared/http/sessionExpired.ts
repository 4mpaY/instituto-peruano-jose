import { signOut } from 'next-auth/react'

let handled = false

export function handleSessionExpired() {
  if (handled) return
  if (window.location.pathname.startsWith('/login')) return

  handled = true

  const callbackUrl = window.location.pathname + window.location.search

  signOut({ redirect: false }).finally(() => {
    window.location.href = `/login?sessionExpired=1&callbackUrl=${encodeURIComponent(callbackUrl)}`
  })
}
