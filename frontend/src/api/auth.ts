import { clearStoredAuth, setStoredAuth } from './auth-storage'
import { apiClient } from './client'
import type {
  ApiResponse,
  AuthResult,
  LoginInput,
  SignupInput,
  SignupResult,
} from './types'

export async function signup(input: SignupInput): Promise<SignupResult> {
  const response = await apiClient.post<ApiResponse<SignupResult>>('/auth/signup', input)
  setStoredAuth(response.data.data)
  return response.data.data
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', input)
  setStoredAuth(response.data.data)
  return response.data.data
}

export function logout(): void {
  clearStoredAuth()
}
