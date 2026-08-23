import { AxiosHeaders, type AxiosAdapter } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setStoredAuth } from './auth-storage'
import { apiClient } from './client'

const originalAdapter = apiClient.defaults.adapter

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
})

describe('apiClient authentication', () => {
  it('attaches the persisted bearer token to authenticated requests', async () => {
    setStoredAuth({
      user: { id: 'user-1', email: 'student@example.edu' },
      session: { accessToken: 'real-access-token', expiresAt: 4_000_000_000 },
    })
    const adapter = vi.fn<AxiosAdapter>(async (config) => ({
      data: { data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))
    apiClient.defaults.adapter = adapter

    await apiClient.get('/skills')

    const config = adapter.mock.calls[0][0]
    expect(AxiosHeaders.from(config.headers).get('Authorization')).toBe('Bearer real-access-token')
  })

  it('does not attach an authorization header without stored auth', async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config }))
    apiClient.defaults.adapter = adapter
    await apiClient.get('/skills')
    expect(AxiosHeaders.from(adapter.mock.calls[0][0].headers).has('Authorization')).toBe(false)
  })
})
