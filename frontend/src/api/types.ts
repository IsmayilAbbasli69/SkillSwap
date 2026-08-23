export type UserRole = 'STUDENT' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'DISABLED'
export type SkillType = 'OFFER' | 'WANT'
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'
export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
export type MeetingType = 'ONLINE' | 'IN_PERSON'
export type SkillStatus = 'ACTIVE' | 'INACTIVE'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export interface ApiResponse<T> {
  data: T
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode
    message: string
  }
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthSession {
  accessToken: string
  expiresAt: number
}

export interface AuthResult {
  user: AuthUser
  session: AuthSession
}

export interface SignupResult extends AuthResult {
  requiresEmailConfirmation: boolean
}

export interface SignupInput {
  email: string
  password: string
  firstName: string
  lastName: string
  bio?: string
  department?: string
  academicYear?: number
  institutionId?: string
  unitId?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface InstitutionSummary {
  id: string
  name: string
}

export interface UnitSummary {
  id: string
  name: string | null
}

export interface UserSkill {
  id: string
  skillId: string
  name: string
  type: SkillType
  level: SkillLevel
}

export interface MyProfile {
  id: string
  firstName: string
  lastName: string
  bio: string
  department: string
  academicYear: number
  role: UserRole
  status: UserStatus
  averageRating: number
  totalReviews: number
  institution: InstitutionSummary
  unit: UnitSummary
  skills: UserSkill[]
}

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  bio?: string
  department?: string
  academicYear?: number
}

export interface AddUserSkillInput {
  skillId: string
  type: SkillType
  level: SkillLevel
}

export interface AddedUserSkill {
  id: string
  skillId: string
  type: SkillType
  level: SkillLevel
}

export interface PeerReview {
  rating: number
  comment: string
  createdAt: string
}

export interface PeerProfile {
  id: string
  firstName: string
  lastName: string
  bio: string
  department: string
  academicYear: number
  averageRating: number
  totalReviews: number
  skills: UserSkill[]
  recentReviews: PeerReview[]
}

export interface Skill {
  id: string
  name: string
  category: string
}

export interface ListSkillsParams {
  search?: string
  category?: string
}

export interface SearchStudentsParams {
  skillId?: string
  unitId?: string
  level?: SkillLevel
  page?: number
  limit?: number
}

export interface SearchProfile {
  id: string
  name: string
  bio: string
  department: string
  averageRating: number
  unit: UnitSummary
}

export interface SearchOfferedSkill {
  id: string
  name: string
  level: SkillLevel
}

export interface StudentSearchResult {
  profile: SearchProfile
  offeredSkill: SearchOfferedSkill | null
  match: {
    score: number
    reasons: string[]
  }
}

export interface CreateSwapRequestInput {
  receiverId: string
  requestedSkillId: string
  offeredSkillId?: string
  message?: string
}

export interface CreatedSwapRequest {
  id: string
  senderId: string
  receiverId: string
  requestedSkillId: string
  offeredSkillId?: string
  message?: string
  status: 'PENDING'
  createdAt: string
}

export interface ListSwapRequestsParams {
  type?: 'incoming' | 'outgoing'
  status?: RequestStatus
}

export interface RequestPerson {
  id: string
  name: string
}

export interface RequestPeer extends RequestPerson {
  email?: string
}

export interface RequestSkill {
  id: string
  name: string
}

export interface SwapRequest {
  id: string
  status: RequestStatus
  message: string
  createdAt: string
  peer: RequestPeer
  sender: RequestPerson
  receiver: RequestPerson
  requestedSkill: RequestSkill
  offeredSkill: RequestSkill | null
}

export interface UpdateSwapRequestInput {
  status: 'ACCEPTED' | 'DECLINED'
}

export interface UpdatedSwapRequest {
  id: string
  status: 'ACCEPTED' | 'DECLINED'
}

export interface ScheduleSessionInput {
  scheduledAt: string
  duration: number
  meetingType: MeetingType
  meetingUrl?: string
  locationNote?: string
}

export interface Session {
  id: string
  requestId: string
  scheduledAt: string
  duration: number
  meetingType: MeetingType
  meetingUrl: string | null
  locationNote: string | null
  status: SessionStatus
}

export interface ListSessionsParams {
  status?: SessionStatus
}

export interface UpdateSessionInput {
  status: 'COMPLETED' | 'CANCELLED'
}

export interface UpdatedSession {
  id: string
  status: 'COMPLETED' | 'CANCELLED'
}

export interface SubmitReviewInput {
  revieweeId: string
  rating: number
  comment?: string
}

export interface SubmittedReview {
  id: string
  rating: number
  comment: string
}

export interface ListAdminStudentsParams {
  status?: UserStatus
  search?: string
  page?: number
  limit?: number
}

export interface AdminStudent {
  id: string
  name: string
  unit: string
  status: UserStatus
}

export interface UpdateStudentStatusInput {
  status: UserStatus
}

export interface UpdatedStudentStatus {
  id: string
  status: UserStatus
}

export interface CreateAdminSkillInput {
  name: string
  category: string
}

export interface UpdateAdminSkillInput {
  name: string
  category: string
}

export interface AdminSkill extends Skill {
  status: SkillStatus
}

export interface DisabledAdminSkill {
  id: string
  status: 'INACTIVE'
}

export interface AdminStats {
  students: { total: number; active: number }
  requests: {
    total: number
    accepted: number
    pending: number
    declined: number
  }
  sessions: { scheduled: number; completed: number }
  topWantedSkills: Array<{ skill: string; count: number }>
  topOfferedSkills: Array<{ skill: string; count: number }>
}
