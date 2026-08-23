import { apiClient } from './client'
import type { PaginatedResponse, SearchStudentsParams, StudentSearchResult } from './types'

export async function searchStudents(
  params?: SearchStudentsParams,
): Promise<PaginatedResponse<StudentSearchResult>> {
  const response = await apiClient.get<PaginatedResponse<StudentSearchResult>>('/search', {
    params,
  })
  return response.data
}
