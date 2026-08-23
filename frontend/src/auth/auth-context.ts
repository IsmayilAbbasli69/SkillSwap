import { createContext, useContext } from 'react'
import type { AuthUser, LoginInput, SignupInput, SignupResult, UserRole } from '../api/types'

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  role: UserRole | null
  isRoleLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  signup: (input: SignupInput) => Promise<SignupResult>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
