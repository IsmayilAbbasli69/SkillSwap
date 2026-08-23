import { http, HttpResponse } from 'msw'
import type {
  AddUserSkillInput,
  CreateAdminSkillInput,
  CreateSwapRequestInput,
  ScheduleSessionInput,
  SubmitReviewInput,
  UpdateAdminSkillInput,
  UpdateProfileInput,
  UpdateSessionInput,
  UpdateStudentStatusInput,
  UpdateSwapRequestInput,
} from '../api/types'
import { mockAdminStats, skillCatalog } from './data'
import {
  credentials,
  mockId,
  persistMockState,
  profiles,
  requests,
  reviews,
  sessions,
  skillStatuses,
  tokenToUserId,
  type MockProfile,
  type MockRequest,
} from './state'

const api = '*/api'

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status })
}

function currentProfile(request: Request): MockProfile | null {
  const header = request.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : ''
  const userId = tokenToUserId.get(token)
  return profiles.find((profile) => profile.id === userId) ?? null
}

function requireUser(request: Request) {
  return currentProfile(request) ?? error(401, 'UNAUTHORIZED', 'Authentication is required')
}

function requireAdmin(request: Request) {
  const profile = currentProfile(request)
  if (!profile) return error(401, 'UNAUTHORIZED', 'Authentication is required')
  if (profile.role !== 'ADMIN') return error(403, 'FORBIDDEN', 'Administrator access is required')
  return profile
}

function publicProfile(profile: MockProfile) {
  const { email: _email, ...safeProfile } = profile
  void _email
  return safeProfile
}

function requestResponse(item: MockRequest, viewer: MockProfile) {
  const sender = profiles.find((profile) => profile.id === item.senderId)!
  const receiver = profiles.find((profile) => profile.id === item.receiverId)!
  const peer = viewer.id === sender.id ? receiver : sender
  const requestedSkill = skillCatalog.find((skill) => skill.id === item.requestedSkillId)!
  const offeredSkill = item.offeredSkillId
    ? skillCatalog.find((skill) => skill.id === item.offeredSkillId) ?? null
    : null

  return {
    id: item.id,
    status: item.status,
    message: item.message,
    createdAt: item.createdAt,
    peer: {
      id: peer.id,
      name: `${peer.firstName} ${peer.lastName}`,
      ...(item.status === 'ACCEPTED' ? { email: peer.email } : {}),
    },
    sender: { id: sender.id, name: `${sender.firstName} ${sender.lastName}` },
    receiver: { id: receiver.id, name: `${receiver.firstName} ${receiver.lastName}` },
    requestedSkill: { id: requestedSkill.id, name: requestedSkill.name },
    offeredSkill: offeredSkill ? { id: offeredSkill.id, name: offeredSkill.name } : null,
  }
}

export const handlers = [
  http.post(`${api}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    const email = body.email?.trim().toLowerCase() ?? ''
    const account = credentials.get(email)
    if (!account || account.password !== body.password) {
      return error(401, 'UNAUTHORIZED', 'Invalid credentials')
    }
    const profile = profiles.find((item) => item.email === email)!
    return HttpResponse.json({
      data: {
        user: { id: profile.id, email: profile.email },
        session: {
          accessToken: account.token,
          expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
        },
      },
    })
  }),

  http.post(`${api}/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!email || !body.password || !body.firstName || !body.lastName) {
      return error(400, 'VALIDATION_ERROR', 'Email, password, first name, and last name are required')
    }
    if (profiles.some((profile) => profile.email === email)) {
      return error(409, 'CONFLICT', 'An account with this email already exists')
    }
    const id = mockId('9')
    const token = `mock-signup-token-${id}`
    const profile: MockProfile = {
      id,
      email,
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      bio: String(body.bio ?? ''),
      department: String(body.department ?? ''),
      academicYear: typeof body.academicYear === 'number' ? body.academicYear : 1,
      role: 'STUDENT',
      status: 'ACTIVE',
      institution: profiles[0].institution,
      unit: profiles[0].unit,
      averageRating: 0,
      totalReviews: 0,
      skills: [],
    }
    profiles.push(profile)
    tokenToUserId.set(token, id)
    credentials.set(email, { password: String(body.password), token })
    persistMockState()
    return HttpResponse.json({
      data: {
        user: { id, email },
        session: { accessToken: token, expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 8 },
        requiresEmailConfirmation: false,
      },
    }, { status: 201 })
  }),

  http.get(`${api}/profile/me`, ({ request }) => {
    const profile = requireUser(request)
    if (profile instanceof Response) return profile
    return HttpResponse.json({ data: publicProfile(profile) })
  }),

  http.patch(`${api}/profile/me`, async ({ request }) => {
    const profile = requireUser(request)
    if (profile instanceof Response) return profile
    const input = (await request.json()) as UpdateProfileInput
    Object.assign(profile, input)
    persistMockState()
    return HttpResponse.json({ data: publicProfile(profile) })
  }),

  http.post(`${api}/profile/me/skills`, async ({ request }) => {
    const profile = requireUser(request)
    if (profile instanceof Response) return profile
    const input = (await request.json()) as AddUserSkillInput
    const catalogSkill = skillCatalog.find((skill) => skill.id === input.skillId)
    if (!catalogSkill) return error(404, 'RESOURCE_NOT_FOUND', 'Skill not found')
    if (profile.skills.some((item) => item.skillId === input.skillId && item.type === input.type)) {
      return error(409, 'CONFLICT', 'This skill is already on your profile')
    }
    const added = { id: mockId('2'), ...input, name: catalogSkill.name }
    profile.skills.push(added)
    persistMockState()
    return HttpResponse.json({
      data: { id: added.id, skillId: added.skillId, type: added.type, level: added.level },
    }, { status: 201 })
  }),

  http.delete(`${api}/profile/me/skills/:userSkillId`, ({ request, params }) => {
    const profile = requireUser(request)
    if (profile instanceof Response) return profile
    const index = profile.skills.findIndex((item) => item.id === params.userSkillId)
    if (index < 0) return error(404, 'RESOURCE_NOT_FOUND', 'Profile skill not found')
    profile.skills.splice(index, 1)
    persistMockState()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${api}/skills`, ({ request }) => {
    const profile = requireUser(request)
    if (profile instanceof Response) return profile
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()
    const category = url.searchParams.get('category')?.toLowerCase()
    const data = skillCatalog.filter((skill) =>
      skillStatuses.get(skill.id) === 'ACTIVE' &&
      (!search || skill.name.toLowerCase().includes(search)) &&
      (!category || skill.category.toLowerCase() === category),
    )
    return HttpResponse.json({ data })
  }),

  http.get(`${api}/search`, ({ request }) => {
    const viewer = requireUser(request)
    if (viewer instanceof Response) return viewer
    const url = new URL(request.url)
    const skillId = url.searchParams.get('skillId')
    const level = url.searchParams.get('level')
    const unitId = url.searchParams.get('unitId')
    const page = Math.max(Number(url.searchParams.get('page')) || 1, 1)
    const limit = Math.max(Number(url.searchParams.get('limit')) || 10, 1)

    const matches = profiles
      .filter((profile) => profile.role === 'STUDENT' && profile.status === 'ACTIVE')
      .filter((profile) => profile.id !== viewer.id && profile.institution.id === viewer.institution.id)
      .filter((profile) => !unitId || profile.unit.id === unitId)
      .map((profile) => {
        const offered = skillId
          ? profile.skills.find((item) => item.type === 'OFFER' && item.skillId === skillId && (!level || item.level === level))
          : undefined
        if (skillId && !offered) return null
        const reciprocal = viewer.skills.some((mine) =>
          mine.type === 'OFFER' && profile.skills.some((theirs) => theirs.type === 'WANT' && theirs.skillId === mine.skillId),
        )
        return {
          profile: {
            id: profile.id,
            name: `${profile.firstName} ${profile.lastName}`,
            bio: profile.bio,
            department: profile.department,
            averageRating: profile.averageRating ?? 0,
            unit: profile.unit,
          },
          offeredSkill: offered ? { id: offered.skillId, name: offered.name, level: offered.level } : null,
          match: {
            score: offered && reciprocal ? 95 : offered ? 82 : 70,
            reasons: [
              ...(reciprocal ? ['Reciprocal skill match found'] : []),
              'Same institution',
              ...(offered ? ['Compatible skill levels'] : []),
            ],
          },
        }
      })
      .filter((result) => result !== null)
      .sort((a, b) => b.match.score - a.match.score)
    const start = (page - 1) * limit
    return HttpResponse.json({
      data: matches.slice(start, start + limit),
      meta: { page, limit, total: matches.length, totalPages: Math.ceil(matches.length / limit) },
    })
  }),

  http.get(`${api}/users/:userId`, ({ request, params }) => {
    const viewer = requireUser(request)
    if (viewer instanceof Response) return viewer
    const profile = profiles.find((item) => item.id === params.userId && item.role === 'STUDENT')
    if (!profile) return error(404, 'RESOURCE_NOT_FOUND', 'Student profile not found')
    const recentReviews = profile.id === profiles[1].id
      ? [
          { rating: 5, comment: 'Maya explained everything clearly and patiently.', createdAt: '2026-07-18T14:00:00.000Z' },
          { rating: 5, comment: 'A practical and welcoming learning session.', createdAt: '2026-06-12T10:30:00.000Z' },
        ]
      : reviews.filter((review) => review.revieweeId === profile.id).map(({ rating, comment, createdAt }) => ({ rating, comment, createdAt }))
    const safe = publicProfile(profile)
    return HttpResponse.json({ data: { ...safe, recentReviews } })
  }),

  http.post(`${api}/requests`, async ({ request }) => {
    const sender = requireUser(request)
    if (sender instanceof Response) return sender
    const input = (await request.json()) as CreateSwapRequestInput
    const receiver = profiles.find((profile) => profile.id === input.receiverId && profile.role === 'STUDENT')
    if (!receiver || receiver.id === sender.id) return error(400, 'VALIDATION_ERROR', 'Choose a valid receiver')
    if (!receiver.skills.some((item) => item.type === 'OFFER' && item.skillId === input.requestedSkillId)) {
      return error(400, 'VALIDATION_ERROR', 'The requested skill is not offered by this student')
    }
    const duplicate = requests.some((item) => item.senderId === sender.id && item.receiverId === receiver.id && item.requestedSkillId === input.requestedSkillId && item.status === 'PENDING')
    if (duplicate) return error(409, 'CONFLICT', 'A pending request already exists for this skill')
    const created: MockRequest = {
      id: mockId('3'),
      senderId: sender.id,
      receiverId: receiver.id,
      requestedSkillId: input.requestedSkillId,
      offeredSkillId: input.offeredSkillId,
      message: input.message ?? '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }
    requests.unshift(created)
    persistMockState()
    return HttpResponse.json({ data: created }, { status: 201 })
  }),

  http.get(`${api}/requests`, ({ request }) => {
    const viewer = requireUser(request)
    if (viewer instanceof Response) return viewer
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const data = requests
      .filter((item) => type === 'incoming' ? item.receiverId === viewer.id : type === 'outgoing' ? item.senderId === viewer.id : item.senderId === viewer.id || item.receiverId === viewer.id)
      .filter((item) => !status || item.status === status)
      .map((item) => requestResponse(item, viewer))
    return HttpResponse.json({ data })
  }),

  http.patch(`${api}/requests/:requestId`, async ({ request, params }) => {
    const viewer = requireUser(request)
    if (viewer instanceof Response) return viewer
    const item = requests.find((candidate) => candidate.id === params.requestId)
    if (!item) return error(404, 'RESOURCE_NOT_FOUND', 'Request not found')
    if (item.receiverId !== viewer.id) return error(403, 'FORBIDDEN', 'Only the receiver can respond to this request')
    const input = (await request.json()) as UpdateSwapRequestInput
    if (item.status !== 'PENDING') return error(409, 'CONFLICT', 'This request has already been answered')
    item.status = input.status
    persistMockState()
    return HttpResponse.json({ data: { id: item.id, status: item.status } })
  }),

  http.post(`${api}/requests/:requestId/session`, async ({ request, params }) => {
    const viewer = requireUser(request)
    if (viewer instanceof Response) return viewer
    const swapRequest = requests.find((item) => item.id === params.requestId)
    if (!swapRequest) return error(404, 'RESOURCE_NOT_FOUND', 'Request not found')
    if (swapRequest.status !== 'ACCEPTED') return error(409, 'CONFLICT', 'Only accepted requests can be scheduled')
    if (![swapRequest.senderId, swapRequest.receiverId].includes(viewer.id)) return error(403, 'FORBIDDEN', 'You cannot schedule this request')
    if (sessions.some((item) => item.requestId === swapRequest.id)) return error(409, 'CONFLICT', 'A session already exists for this request')
    const input = (await request.json()) as ScheduleSessionInput
    if (!input.scheduledAt || input.duration < 15 || input.duration > 180) return error(400, 'VALIDATION_ERROR', 'Enter a valid date and duration')
    const session = {
      id: mockId('4'), requestId: swapRequest.id, scheduledAt: input.scheduledAt,
      duration: input.duration, meetingType: input.meetingType,
      meetingUrl: input.meetingUrl ?? null, locationNote: input.locationNote ?? null,
      status: 'SCHEDULED' as const,
    }
    sessions.unshift(session)
    persistMockState()
    return HttpResponse.json({ data: session }, { status: 201 })
  }),

  http.get(`${api}/sessions`, ({ request }) => {
    const viewer = requireUser(request)
    if (viewer instanceof Response) return viewer
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const visibleRequestIds = new Set(requests.filter((item) => item.senderId === viewer.id || item.receiverId === viewer.id).map((item) => item.id))
    const data = sessions.filter((item) => visibleRequestIds.has(item.requestId) && (!status || item.status === status))
    return HttpResponse.json({ data })
  }),

  http.patch(`${api}/sessions/:sessionId`, async ({ request, params }) => {
    const viewer = requireUser(request)
    if (viewer instanceof Response) return viewer
    const session = sessions.find((item) => item.id === params.sessionId)
    const swapRequest = session && requests.find((item) => item.id === session.requestId)
    if (!session || !swapRequest) return error(404, 'RESOURCE_NOT_FOUND', 'Session not found')
    if (![swapRequest.senderId, swapRequest.receiverId].includes(viewer.id)) return error(403, 'FORBIDDEN', 'You cannot update this session')
    if (session.status !== 'SCHEDULED') return error(409, 'CONFLICT', 'This session is no longer scheduled')
    const input = (await request.json()) as UpdateSessionInput
    session.status = input.status
    persistMockState()
    return HttpResponse.json({ data: { id: session.id, status: session.status } })
  }),

  http.post(`${api}/sessions/:sessionId/review`, async ({ request, params }) => {
    const reviewer = requireUser(request)
    if (reviewer instanceof Response) return reviewer
    const session = sessions.find((item) => item.id === params.sessionId)
    const swapRequest = session && requests.find((item) => item.id === session.requestId)
    if (!session || !swapRequest) return error(404, 'RESOURCE_NOT_FOUND', 'Session not found')
    if (session.status !== 'COMPLETED') return error(409, 'CONFLICT', 'Only completed sessions can be reviewed')
    if (![swapRequest.senderId, swapRequest.receiverId].includes(reviewer.id)) return error(403, 'FORBIDDEN', 'You cannot review this session')
    if (reviews.some((item) => item.sessionId === session.id && item.reviewerId === reviewer.id)) return error(409, 'CONFLICT', 'You have already reviewed this session')
    const input = (await request.json()) as SubmitReviewInput
    if (input.rating < 1 || input.rating > 5) return error(400, 'VALIDATION_ERROR', 'Rating must be between 1 and 5')
    const review = { id: mockId('5'), sessionId: session.id, reviewerId: reviewer.id, revieweeId: input.revieweeId, rating: input.rating, comment: input.comment ?? '', createdAt: new Date().toISOString() }
    reviews.unshift(review)
    persistMockState()
    return HttpResponse.json({ data: { id: review.id, rating: review.rating, comment: review.comment } }, { status: 201 })
  }),

  http.get(`${api}/admin/stats`, ({ request }) => {
    const admin = requireAdmin(request)
    if (admin instanceof Response) return admin
    return HttpResponse.json({ data: mockAdminStats })
  }),

  http.get(`${api}/admin/students`, ({ request }) => {
    const admin = requireAdmin(request)
    if (admin instanceof Response) return admin
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()
    const status = url.searchParams.get('status')
    const page = Math.max(Number(url.searchParams.get('page')) || 1, 1)
    const limit = Math.max(Number(url.searchParams.get('limit')) || 20, 1)
    const students = profiles.filter((profile) => profile.role === 'STUDENT')
      .filter((profile) => !search || `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(search))
      .filter((profile) => !status || profile.status === status)
      .map((profile) => ({ id: profile.id, name: `${profile.firstName} ${profile.lastName}`, unit: profile.unit.id, status: profile.status }))
    const start = (page - 1) * limit
    return HttpResponse.json({ data: students.slice(start, start + limit), meta: { page, limit, total: students.length, totalPages: Math.ceil(students.length / limit) } })
  }),

  http.patch(`${api}/admin/students/:studentId/status`, async ({ request, params }) => {
    const admin = requireAdmin(request)
    if (admin instanceof Response) return admin
    const student = profiles.find((profile) => profile.id === params.studentId && profile.role === 'STUDENT')
    if (!student) return error(404, 'RESOURCE_NOT_FOUND', 'Student not found')
    const input = (await request.json()) as UpdateStudentStatusInput
    student.status = input.status
    persistMockState()
    return HttpResponse.json({ data: { id: student.id, status: student.status } })
  }),

  http.post(`${api}/admin/skills`, async ({ request }) => {
    const admin = requireAdmin(request)
    if (admin instanceof Response) return admin
    const input = (await request.json()) as CreateAdminSkillInput
    if (!input.name.trim() || !input.category.trim()) return error(400, 'VALIDATION_ERROR', 'Skill name and category are required')
    if (skillCatalog.some((skill) => skill.name.toLowerCase() === input.name.toLowerCase())) return error(409, 'CONFLICT', 'A skill with this name already exists')
    const skill = { id: mockId('1'), name: input.name.trim(), category: input.category.trim() }
    skillCatalog.push(skill)
    skillStatuses.set(skill.id, 'ACTIVE')
    persistMockState()
    return HttpResponse.json({ data: { ...skill, status: 'ACTIVE' } }, { status: 201 })
  }),

  http.patch(`${api}/admin/skills/:skillId`, async ({ request, params }) => {
    const admin = requireAdmin(request)
    if (admin instanceof Response) return admin
    const skill = skillCatalog.find((item) => item.id === params.skillId)
    if (!skill) return error(404, 'RESOURCE_NOT_FOUND', 'Skill not found')
    const input = (await request.json()) as UpdateAdminSkillInput
    skill.name = input.name.trim()
    skill.category = input.category.trim()
    persistMockState()
    return HttpResponse.json({ data: { ...skill, status: skillStatuses.get(skill.id) ?? 'ACTIVE' } })
  }),

  http.delete(`${api}/admin/skills/:skillId`, ({ request, params }) => {
    const admin = requireAdmin(request)
    if (admin instanceof Response) return admin
    const skill = skillCatalog.find((item) => item.id === params.skillId)
    if (!skill) return error(404, 'RESOURCE_NOT_FOUND', 'Skill not found')
    skillStatuses.set(skill.id, 'INACTIVE')
    persistMockState()
    return HttpResponse.json({ data: { id: skill.id, status: 'INACTIVE' } })
  }),
]
