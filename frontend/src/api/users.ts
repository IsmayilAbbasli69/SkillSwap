import { apiClient } from './client'
import type { ApiResponse, PeerProfile } from './types'

export async function getPeerProfile(userId: string): Promise<PeerProfile> {
  const response = await apiClient.get<ApiResponse<PeerProfile>>(`/users/${userId}`)
  return response.data.data
}
