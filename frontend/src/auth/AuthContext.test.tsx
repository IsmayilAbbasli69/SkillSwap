import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from './auth-context'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  getMyProfile: vi.fn(),
}))

vi.mock('../api/auth', () => ({ login: mocks.login, logout: mocks.logout, signup: mocks.signup }))
vi.mock('../api/profile', () => ({ getMyProfile: mocks.getMyProfile }))

function AuthProbe() {
  const auth = useAuth()
  return <div><p>{auth.isAuthenticated ? auth.user?.email : 'signed out'}</p><p>{auth.token ?? 'no token'}</p><button onClick={() => void auth.login({ email: 'student@example.edu', password: 'secret' })}>Log in</button><button onClick={auth.logout}>Log out</button></div>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    mocks.login.mockReset()
    mocks.logout.mockReset()
    mocks.signup.mockReset()
    mocks.getMyProfile.mockReset()
    mocks.getMyProfile.mockResolvedValue({ role: 'STUDENT' })
  })

  it('updates auth state after login and clears it on logout', async () => {
    mocks.login.mockResolvedValue({ user: { id: 'user-1', email: 'student@example.edu' }, session: { accessToken: 'token-1', expiresAt: 4_000_000_000 } })
    const user = userEvent.setup()
    render(<MemoryRouter><AuthProvider><AuthProbe /></AuthProvider></MemoryRouter>)

    expect(screen.getByText('signed out')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('student@example.edu')).toBeInTheDocument()
    expect(screen.getByText('token-1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(mocks.logout).toHaveBeenCalledOnce()
  })
})
