import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { handlers } from './handlers'
import { resetMockState } from './state'

const server = setupServer(...handlers)
const apiUrl = 'http://localhost:4000/api'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
beforeEach(() => resetMockState())

describe('development mock authentication and authorization', () => {
  it('returns a student token for valid credentials', async () => {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@skillswap.test',
        password: 'Password123!',
      }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.session.accessToken).toBe('mock-student-token')
  })

  it('uses the documented error envelope for invalid credentials', async () => {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@skillswap.test', password: 'wrong' }),
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
    })
  })

  it('resolves a bearer token to its profile and rejects student admin access', async () => {
    const headers = { Authorization: 'Bearer mock-student-token' }
    const [profileResponse, adminResponse] = await Promise.all([
      fetch(`${apiUrl}/profile/me`, { headers }),
      fetch(`${apiUrl}/admin/stats`, { headers }),
    ])
    const profile = await profileResponse.json()
    const adminError = await adminResponse.json()

    expect(profile.data).toMatchObject({ firstName: 'John', role: 'STUDENT' })
    expect(adminResponse.status).toBe(403)
    expect(adminError.error.code).toBe('FORBIDDEN')
  })

  it('shares one request between the sender outgoing and receiver incoming views', async () => {
    const johnHeaders = {
      Authorization: 'Bearer mock-student-token',
      'Content-Type': 'application/json',
    }
    const mayaHeaders = {
      Authorization: 'Bearer mock-maya-token',
      'Content-Type': 'application/json',
    }
    const createResponse = await fetch(`${apiUrl}/requests`, {
      method: 'POST',
      headers: johnHeaders,
      body: JSON.stringify({
        receiverId: '90000000-0000-4000-8000-000000000002',
        requestedSkillId: '10000000-0000-4000-8000-000000000005',
        offeredSkillId: '10000000-0000-4000-8000-000000000006',
        message: 'Could we exchange Mathematics for English practice?',
      }),
    })
    const created = (await createResponse.json()).data

    const johnOutgoing = await fetch(`${apiUrl}/requests?type=outgoing`, {
      headers: johnHeaders,
    }).then((response) => response.json())
    const mayaIncoming = await fetch(`${apiUrl}/requests?type=incoming`, {
      headers: mayaHeaders,
    }).then((response) => response.json())

    expect(johnOutgoing.data).toHaveLength(1)
    expect(mayaIncoming.data).toHaveLength(1)
    expect(johnOutgoing.data[0]).toMatchObject({
      id: created.id,
      status: 'PENDING',
      peer: { name: 'Maya Johnson' },
      sender: { name: 'John Smith' },
      receiver: { name: 'Maya Johnson' },
      requestedSkill: { name: 'English' },
      offeredSkill: { name: 'Mathematics' },
    })
    expect(mayaIncoming.data[0]).toMatchObject({
      id: created.id,
      status: 'PENDING',
      peer: { name: 'John Smith' },
      sender: { name: 'John Smith' },
      receiver: { name: 'Maya Johnson' },
    })
    expect(johnOutgoing.data[0].peer).not.toHaveProperty('email')
    expect(mayaIncoming.data[0].peer).not.toHaveProperty('email')

    await fetch(`${apiUrl}/requests/${created.id}`, {
      method: 'PATCH',
      headers: mayaHeaders,
      body: JSON.stringify({ status: 'ACCEPTED' }),
    })
    const johnAccepted = await fetch(`${apiUrl}/requests?type=outgoing`, {
      headers: johnHeaders,
    }).then((response) => response.json())

    expect(johnAccepted.data[0]).toMatchObject({
      id: created.id,
      status: 'ACCEPTED',
      peer: { name: 'Maya Johnson', email: 'maya@skillswap.test' },
    })
    expect(JSON.parse(localStorage.getItem('skillswap_mock_state') ?? '{}').requests)
      .toContainEqual(expect.objectContaining({ id: created.id, status: 'ACCEPTED' }))
  })
})
