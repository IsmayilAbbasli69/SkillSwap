import { describe, expect, it } from 'vitest'
import { clearStoredAuth, getAccessToken, getStoredAuth, setStoredAuth } from './auth-storage'

const validAuth = {
  user: { id: 'user-id', email: 'student@university.edu' },
  session: { accessToken: 'test-token', expiresAt: 4_000_000_000 },
}

describe('auth storage', () => {
  it('persists and restores a valid backend auth result', () => {
    setStoredAuth(validAuth)
    expect(getStoredAuth()).toEqual(validAuth)
    expect(getAccessToken()).toBe('test-token')
  })

  it('removes expired authentication', () => {
    setStoredAuth({ ...validAuth, session: { accessToken: 'expired', expiresAt: 1 } })
    expect(getStoredAuth()).toBeNull()
    expect(window.localStorage.length).toBe(0)
  })

  it('clears authentication on logout', () => {
    setStoredAuth(validAuth)
    clearStoredAuth()
    expect(getStoredAuth()).toBeNull()
  })
})
