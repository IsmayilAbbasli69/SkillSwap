import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  login as loginRequest,
  logout as clearAuthRequest,
  signup as signupRequest,
} from '../api/auth'
import { getStoredAuth, type StoredAuth } from '../api/auth-storage'
import { AUTH_UNAUTHORIZED_EVENT } from '../api/client'
import { getMyProfile } from '../api/profile'
import type { LoginInput, SignupInput, UserRole } from '../api/types'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const [auth, setAuth] = useState<StoredAuth | null>(() => getStoredAuth())
  const [role, setRole] = useState<UserRole | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(() => auth !== null)

  const login = useCallback(async (input: LoginInput) => {
    setIsRoleLoading(true)
    try {
      const result = await loginRequest(input)
      setAuth(result)
    } catch (error) {
      setIsRoleLoading(false)
      throw error
    }
  }, [])

  const signup = useCallback(async (input: SignupInput) => {
    setIsRoleLoading(true)
    try {
      const result = await signupRequest(input)
      setAuth(result)
      return result
    } catch (error) {
      setIsRoleLoading(false)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    clearAuthRequest()
    setAuth(null)
    setRole(null)
    setIsRoleLoading(false)
  }, [])

  useEffect(() => {
    if (!auth) return

    let cancelled = false

    void getMyProfile()
      .then((profile) => {
        if (!cancelled) {
          setRole(profile.role)
          setIsRoleLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRole(null)
          setIsRoleLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [auth])

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      event.preventDefault()
      setAuth(null)
      setRole(null)
      setIsRoleLoading(false)
      navigate('/login', { replace: true })
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [navigate])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth?.user ?? null,
      token: auth?.session.accessToken ?? null,
      role,
      isRoleLoading,
      isAuthenticated: auth !== null,
      login,
      signup,
      logout,
    }),
    [auth, isRoleLoading, login, logout, role, signup],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
