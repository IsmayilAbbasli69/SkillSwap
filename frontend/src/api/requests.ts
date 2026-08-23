import { apiClient } from './client'
import type {
  ApiResponse,
  CreatedSwapRequest,
  CreateSwapRequestInput,
  ListSwapRequestsParams,
  ScheduleSessionInput,
  Session,
  SwapRequest,
  UpdatedSwapRequest,
  UpdateSwapRequestInput,
} from './types'

export async function createSwapRequest(
  input: CreateSwapRequestInput,
): Promise<CreatedSwapRequest> {
  const response = await apiClient.post<ApiResponse<CreatedSwapRequest>>('/requests', input)
  return response.data.data
}

export async function listSwapRequests(
  params?: ListSwapRequestsParams,
): Promise<SwapRequest[]> {
  const response = await apiClient.get<ApiResponse<SwapRequest[]>>('/requests', { params })
  return response.data.data
}

export async function updateSwapRequest(
  requestId: string,
  input: UpdateSwapRequestInput,
): Promise<UpdatedSwapRequest> {
  const response = await apiClient.patch<ApiResponse<UpdatedSwapRequest>>(
    `/requests/${requestId}`,
    input,
  )
  return response.data.data
}

export async function scheduleSession(
  requestId: string,
  input: ScheduleSessionInput,
): Promise<Session> {
  const response = await apiClient.post<ApiResponse<Session>>(
    `/requests/${requestId}/session`,
    input,
  )
  return response.data.data
}
