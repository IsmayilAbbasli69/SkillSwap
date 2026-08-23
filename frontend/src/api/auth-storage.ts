import type { AuthResult } from './types'

const AUTH_STORAGE_KEY = 'skillswap.auth'

export type StoredAuth = AuthResult

function isStoredAuth(value: unknown): value is StoredAuth {
  if (!value || typeof value !== 'object') return false

  const auth = value as Partial<StoredAuth>
  return (
    typeof auth.user?.id === 'string' &&
    typeof auth.user.email === 'string' &&
    typeof auth.session?.accessToken === 'string' &&
    typeof auth.session.expiresAt === 'number'
  )
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null

  const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedValue) return null

  try {
    const auth: unknown = JSON.parse(storedValue)
    if (!isStoredAuth(auth)) {
      clearStoredAuth()
      return null
    }

    if (auth.session.expiresAt * 1000 <= Date.now()) {
      clearStoredAuth()
      return null
    }

    return auth
  } catch {
    clearStoredAuth()
    return null
  }
}

export function setStoredAuth(auth: StoredAuth): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function getAccessToken(): string | null {
  return getStoredAuth()?.session.accessToken ?? null
}
