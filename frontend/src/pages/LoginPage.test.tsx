import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

const login = vi.fn()

vi.mock('../auth/auth-context', () => ({
  useAuth: () => ({ login }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    login.mockReset()
  })

  it('shows required errors without calling the API', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('submits credentials once and disables the button while waiting', async () => {
    let finishLogin: (() => void) | undefined
    login.mockImplementation(() => new Promise<void>((resolve) => { finishLogin = resolve }))
    const user = userEvent.setup()
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    await user.type(screen.getByLabelText(/Email address/), 'student@university.edu')
    await user.type(screen.getByLabelText(/Password/), 'secret')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    fireEvent.submit(submitButton.closest('form')!)

    await waitFor(() => expect(login).toHaveBeenCalledOnce())

    const pendingButton = screen.getByRole('button', { name: 'Signing in…' })
    expect(pendingButton).toBeDisabled()
    expect(login).toHaveBeenCalledWith({ email: 'student@university.edu', password: 'secret' })

    await act(async () => {
      finishLogin?.()
    })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled())
  })
})
