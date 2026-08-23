import { apiClient } from './client'
import type { ApiResponse, ListSkillsParams, Skill } from './types'

export async function listSkills(params?: ListSkillsParams): Promise<Skill[]> {
  const response = await apiClient.get<ApiResponse<Skill[]>>('/skills', { params })
  return response.data.data
}
