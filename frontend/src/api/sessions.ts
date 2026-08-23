import { apiClient } from './client'
import type {
  ApiResponse,
  ListSessionsParams,
  Session,
  SubmittedReview,
  SubmitReviewInput,
  UpdatedSession,
  UpdateSessionInput,
} from './types'

export async function listSessions(params?: ListSessionsParams): Promise<Session[]> {
  const response = await apiClient.get<ApiResponse<Session[]>>('/sessions', { params })
  return response.data.data
}

export async function updateSession(
  sessionId: string,
  input: UpdateSessionInput,
): Promise<UpdatedSession> {
  const response = await apiClient.patch<ApiResponse<UpdatedSession>>(
    `/sessions/${sessionId}`,
    input,
  )
  return response.data.data
}

export async function submitReview(
  sessionId: string,
  input: SubmitReviewInput,
): Promise<SubmittedReview> {
  const response = await apiClient.post<ApiResponse<SubmittedReview>>(
    `/sessions/${sessionId}/review`,
    input,
  )
  return response.data.data
}
