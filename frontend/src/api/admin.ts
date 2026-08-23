import { apiClient } from './client'
import type {
  AdminSkill,
  AdminStats,
  AdminStudent,
  ApiResponse,
  CreateAdminSkillInput,
  DisabledAdminSkill,
  ListAdminStudentsParams,
  PaginatedResponse,
  UpdatedStudentStatus,
  UpdateAdminSkillInput,
  UpdateStudentStatusInput,
} from './types'

export async function listAdminStudents(
  params?: ListAdminStudentsParams,
): Promise<PaginatedResponse<AdminStudent>> {
  const response = await apiClient.get<PaginatedResponse<AdminStudent>>('/admin/students', {
    params,
  })
  return response.data
}

export async function updateStudentStatus(
  studentId: string,
  input: UpdateStudentStatusInput,
): Promise<UpdatedStudentStatus> {
  const response = await apiClient.patch<ApiResponse<UpdatedStudentStatus>>(
    `/admin/students/${studentId}/status`,
    input,
  )
  return response.data.data
}

export async function createAdminSkill(input: CreateAdminSkillInput): Promise<AdminSkill> {
  const response = await apiClient.post<ApiResponse<AdminSkill>>('/admin/skills', input)
  return response.data.data
}

export async function updateAdminSkill(
  skillId: string,
  input: UpdateAdminSkillInput,
): Promise<AdminSkill> {
  const response = await apiClient.patch<ApiResponse<AdminSkill>>(
    `/admin/skills/${skillId}`,
    input,
  )
  return response.data.data
}

export async function disableAdminSkill(skillId: string): Promise<DisabledAdminSkill> {
  const response = await apiClient.delete<ApiResponse<DisabledAdminSkill>>(
    `/admin/skills/${skillId}`,
  )
  return response.data.data
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats')
  return response.data.data
}
