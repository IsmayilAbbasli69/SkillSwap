import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'

const mocks = vi.hoisted(() => ({ isAuthenticated: false }))
vi.mock('./auth-context', () => ({ useAuth: () => ({ isAuthenticated: mocks.isAuthenticated }) }))

function renderRoute() {
  render(<MemoryRouter initialEntries={['/profile']}><Routes><Route element={<ProtectedRoute />}><Route path="/profile" element={<h1>Private profile</h1>} /></Route><Route path="/login" element={<h1>Login screen</h1>} /></Routes></MemoryRouter>)
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    mocks.isAuthenticated = false
    renderRoute()
    expect(screen.getByRole('heading', { name: 'Login screen' })).toBeInTheDocument()
  })

  it('renders protected content for authenticated users', () => {
    mocks.isAuthenticated = true
    renderRoute()
    expect(screen.getByRole('heading', { name: 'Private profile' })).toBeInTheDocument()
  })
})
