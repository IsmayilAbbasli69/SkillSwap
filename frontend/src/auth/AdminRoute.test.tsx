import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminRoute } from './AdminRoute'

let authState: { role: 'STUDENT' | 'ADMIN' | null; isRoleLoading: boolean }

vi.mock('./auth-context', () => ({
  useAuth: () => authState,
}))

function renderRoute() {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<h1>Admin content</h1>} />
        </Route>
        <Route path="/dashboard" element={<h1>Student dashboard</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminRoute', () => {
  beforeEach(() => {
    authState = { role: null, isRoleLoading: false }
  })

  it('allows the documented ADMIN role', () => {
    authState = { role: 'ADMIN', isRoleLoading: false }
    renderRoute()
    expect(screen.getByRole('heading', { name: 'Admin content' })).toBeInTheDocument()
  })

  it('redirects a STUDENT away from admin routes', () => {
    authState = { role: 'STUDENT', isRoleLoading: false }
    renderRoute()
    expect(screen.getByRole('heading', { name: 'Student dashboard' })).toBeInTheDocument()
  })

  it('waits for the real role before deciding access', () => {
    authState = { role: null, isRoleLoading: true }
    renderRoute()
    expect(screen.getByRole('status', { name: 'Checking administrator access' })).toBeInTheDocument()
  })
})
