import axios, { AxiosHeaders } from 'axios'
import { clearStoredAuth, getAccessToken } from './auth-storage'

export const AUTH_UNAUTHORIZED_EVENT = 'skillswap:unauthorized'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not configured')
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  const headers = AxiosHeaders.from(config.headers)

  if (config.data !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  config.headers = headers
  return config
})

let isHandlingUnauthorized = false

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const hadBearerToken = AxiosHeaders.from(error.config?.headers).has('Authorization')

    if (!hadBearerToken || typeof window === 'undefined' || isHandlingUnauthorized) {
      return Promise.reject(error)
    }

    isHandlingUnauthorized = true
    clearStoredAuth()
    const unauthorizedEvent = new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
      cancelable: true,
    })
    const authSystemHandledRedirect = !window.dispatchEvent(unauthorizedEvent)

    const isAuthRoute = ['/login', '/register'].includes(window.location.pathname)
    if (!isAuthRoute && !authSystemHandledRedirect) {
      window.location.assign('/login')
    }

    window.setTimeout(() => {
      isHandlingUnauthorized = false
    }, 0)

    return Promise.reject(error)
  },
)
