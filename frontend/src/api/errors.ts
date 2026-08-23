import axios from 'axios'
import type { ApiErrorCode, ApiErrorResponse } from './types'

export interface NormalizedApiError {
  code: ApiErrorCode | 'NETWORK_ERROR' | 'UNKNOWN_ERROR'
  message: string
  status?: number
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== 'object') return false
  const response = value as Partial<ApiErrorResponse>
  return (
    typeof response.error?.code === 'string' &&
    typeof response.error.message === 'string'
  )
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!axios.isAxiosError(error)) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    }
  }

  if (!error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the server. Please check your connection and try again.',
    }
  }

  if (isApiErrorResponse(error.response.data)) {
    return {
      code: error.response.data.error.code,
      message: error.response.data.error.message,
      status: error.response.status,
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'The server returned an unexpected response.',
    status: error.response.status,
  }
}
