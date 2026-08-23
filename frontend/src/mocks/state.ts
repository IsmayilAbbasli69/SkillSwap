import type {
  MeetingType,
  RequestStatus,
  SessionStatus,
  SkillLevel,
  SkillStatus,
  SkillType,
  UserRole,
  UserStatus,
} from '../api/types'
import { INSTITUTION, skillCatalog, UNIT } from './data'

export interface MockUserSkill {
  id: string
  skillId: string
  name: string
  type: SkillType
  level: SkillLevel
}

export interface MockProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  bio: string
  department: string
  academicYear: number | null
  role: UserRole
  status: UserStatus
  institution: typeof INSTITUTION
  unit: typeof UNIT
  averageRating: number | null
  totalReviews: number
  skills: MockUserSkill[]
}

export interface MockRequest {
  id: string
  senderId: string
  receiverId: string
  requestedSkillId: string
  offeredSkillId?: string
  message: string
  status: RequestStatus
  createdAt: string
}

export interface MockSession {
  id: string
  requestId: string
  scheduledAt: string
  duration: number
  meetingType: MeetingType
  meetingUrl: string | null
  locationNote: string | null
  status: SessionStatus
}

export interface MockReview {
  id: string
  sessionId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment: string
  createdAt: string
}

const skill = (name: string) => skillCatalog.find((item) => item.name === name)!
const userSkill = (
  id: string,
  name: string,
  type: SkillType,
  level: SkillLevel,
): MockUserSkill => ({ id, skillId: skill(name).id, name, type, level })

export const profiles: MockProfile[] = [
  {
    id: '90000000-0000-4000-8000-000000000001',
    email: 'student@skillswap.test',
    firstName: 'John',
    lastName: 'Smith',
    bio: 'Computer science student',
    department: 'Engineering',
    academicYear: 2,
    role: 'STUDENT',
    status: 'ACTIVE',
    institution: INSTITUTION,
    unit: UNIT,
    averageRating: 4.8,
    totalReviews: 12,
    skills: [
      userSkill('20000000-0000-4000-8000-000000000001', 'JavaScript', 'OFFER', 'ADVANCED'),
      userSkill('20000000-0000-4000-8000-000000000002', 'Mathematics', 'OFFER', 'INTERMEDIATE'),
      userSkill('20000000-0000-4000-8000-000000000003', 'English', 'WANT', 'INTERMEDIATE'),
      userSkill('20000000-0000-4000-8000-000000000004', 'UI/UX Design', 'WANT', 'BEGINNER'),
    ],
  },
  {
    id: '90000000-0000-4000-8000-000000000002',
    email: 'maya@skillswap.test',
    firstName: 'Maya',
    lastName: 'Johnson',
    bio: 'Language mentor and product design student who enjoys collaborative learning.',
    department: 'Design and Languages',
    academicYear: 3,
    role: 'STUDENT',
    status: 'ACTIVE',
    institution: INSTITUTION,
    unit: UNIT,
    averageRating: 4.9,
    totalReviews: 18,
    skills: [
      userSkill('20000000-0000-4000-8000-000000000005', 'English', 'OFFER', 'ADVANCED'),
      userSkill('20000000-0000-4000-8000-000000000006', 'UI/UX Design', 'OFFER', 'INTERMEDIATE'),
      userSkill('20000000-0000-4000-8000-000000000007', 'Mathematics', 'WANT', 'INTERMEDIATE'),
    ],
  },
  {
    id: '90000000-0000-4000-8000-000000000004',
    email: 'admin@skillswap.test',
    firstName: 'Ada',
    lastName: 'Admin',
    bio: 'Institution administrator',
    department: 'Administration',
    academicYear: null,
    role: 'ADMIN',
    status: 'ACTIVE',
    institution: INSTITUTION,
    unit: UNIT,
    averageRating: null,
    totalReviews: 0,
    skills: [],
  },
]

export const tokenToUserId = new Map([
  ['mock-student-token', profiles[0].id],
  ['mock-maya-token', profiles[1].id],
  ['mock-admin-token', profiles[2].id],
])

export const credentials = new Map([
  ['student@skillswap.test', { password: 'Password123!', token: 'mock-student-token' }],
  ['maya@skillswap.test', { password: 'Password123!', token: 'mock-maya-token' }],
  ['admin@skillswap.test', { password: 'Password123!', token: 'mock-admin-token' }],
])

export const requests: MockRequest[] = []
export const sessions: MockSession[] = []
export const reviews: MockReview[] = []
export const skillStatuses = new Map<string, SkillStatus>(
  skillCatalog.map((item) => [item.id, 'ACTIVE']),
)

let sequence = 100
export function mockId(prefix: string) {
  sequence += 1
  return `${prefix}0000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`
}

const MOCK_STATE_STORAGE_KEY = 'skillswap_mock_state'

interface MockStateSnapshot {
  profiles: MockProfile[]
  requests: MockRequest[]
  sessions: MockSession[]
  reviews: MockReview[]
  skills: typeof skillCatalog
  skillStatuses: Array<[string, SkillStatus]>
  credentials: Array<[string, { password: string; token: string }]>
  tokenToUserId: Array<[string, string]>
  sequence: number
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function snapshot(): MockStateSnapshot {
  return clone({
    profiles,
    requests,
    sessions,
    reviews,
    skills: skillCatalog,
    skillStatuses: [...skillStatuses],
    credentials: [...credentials],
    tokenToUserId: [...tokenToUserId],
    sequence,
  })
}

const seededState = snapshot()

function replaceState(next: MockStateSnapshot) {
  profiles.splice(0, profiles.length, ...clone(next.profiles))
  requests.splice(0, requests.length, ...clone(next.requests))
  sessions.splice(0, sessions.length, ...clone(next.sessions))
  reviews.splice(0, reviews.length, ...clone(next.reviews))
  skillCatalog.splice(0, skillCatalog.length, ...clone(next.skills))
  skillStatuses.clear()
  for (const [id, status] of next.skillStatuses) skillStatuses.set(id, status)
  credentials.clear()
  for (const [email, account] of next.credentials) credentials.set(email, clone(account))
  tokenToUserId.clear()
  for (const [token, userId] of next.tokenToUserId) tokenToUserId.set(token, userId)
  sequence = next.sequence
}

function isSnapshot(value: unknown): value is MockStateSnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<MockStateSnapshot>
  return Array.isArray(candidate.profiles) && Array.isArray(candidate.requests) &&
    Array.isArray(candidate.sessions) && Array.isArray(candidate.reviews) &&
    Array.isArray(candidate.skills) && Array.isArray(candidate.skillStatuses) &&
    Array.isArray(candidate.credentials) && Array.isArray(candidate.tokenToUserId) &&
    typeof candidate.sequence === 'number'
}

function loadPersistedState() {
  if (typeof window === 'undefined') return
  try {
    const stored = window.localStorage.getItem(MOCK_STATE_STORAGE_KEY)
    if (!stored) return
    const parsed: unknown = JSON.parse(stored)
    if (isSnapshot(parsed)) replaceState(parsed)
  } catch {
    // Invalid or unavailable development storage falls back to the seed state.
  }
}

export function persistMockState() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MOCK_STATE_STORAGE_KEY, JSON.stringify(snapshot()))
  } catch {
    // The mock remains usable in memory when browser storage is unavailable.
  }
}

export function resetMockState() {
  replaceState(seededState)
  persistMockState()
}

loadPersistedState()
