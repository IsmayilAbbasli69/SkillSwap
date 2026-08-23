import { apiClient } from './client'
import type {
  AddedUserSkill,
  AddUserSkillInput,
  ApiResponse,
  MyProfile,
  UpdateProfileInput,
} from './types'

export async function getMyProfile(): Promise<MyProfile> {
  if (!myProfileRequest) {
    myProfileRequest = apiClient
      .get<ApiResponse<MyProfile>>('/profile/me')
      .then((response) => response.data.data)
      .finally(() => {
        myProfileRequest = null
      })
  }
  return myProfileRequest
}

let myProfileRequest: Promise<MyProfile> | null = null

export async function updateMyProfile(input: UpdateProfileInput): Promise<MyProfile> {
  const response = await apiClient.patch<ApiResponse<MyProfile>>('/profile/me', input)
  return response.data.data
}

export async function addMySkill(input: AddUserSkillInput): Promise<AddedUserSkill> {
  const response = await apiClient.post<ApiResponse<AddedUserSkill>>('/profile/me/skills', input)
  return response.data.data
}

export async function removeMySkill(userSkillId: string): Promise<void> {
  await apiClient.delete(`/profile/me/skills/${userSkillId}`)
}
