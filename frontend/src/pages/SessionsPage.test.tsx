import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionsPage } from './SessionsPage'
import { completedSessionFixture } from '../test/fixtures'

const sessionApiMocks = vi.hoisted(() => ({
  listSessions: vi.fn(),
  submitReview: vi.fn(),
  updateSession: vi.fn(),
}))

vi.mock('../api/sessions', () => sessionApiMocks)

describe('SessionsPage review flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionApiMocks.listSessions.mockResolvedValue([completedSessionFixture])
  })

  it('does not submit a review without a rating', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/sessions?status=COMPLETED']}>
        <SessionsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('with Maya Johnson')).toBeInTheDocument()
    expect(screen.getByText(/English/)).toHaveTextContent('English ↔ Mathematics')
    await user.click(screen.getByRole('button', { name: 'Add Review' }))
    expect(screen.getByRole('heading', { name: 'Review Maya Johnson' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Submit review' }))

    expect(screen.getByText('Choose a rating from 1 to 5 stars.')).toBeInTheDocument()
    expect(sessionApiMocks.submitReview).not.toHaveBeenCalled()
  })

  it('submits a valid review through the API module', async () => {
    const user = userEvent.setup()
    sessionApiMocks.submitReview.mockResolvedValue({
      id: 'review-1',
      rating: 5,
      comment: 'A very useful session.',
    })
    render(
      <MemoryRouter initialEntries={['/sessions?status=COMPLETED']}>
        <SessionsPage />
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: 'Add Review' }))
    await user.click(screen.getByRole('radio', { name: '5 stars' }))
    await user.type(screen.getByLabelText(/Comment/), 'A very useful session.')
    await user.click(screen.getByRole('button', { name: 'Submit review' }))

    expect(sessionApiMocks.submitReview).toHaveBeenCalledWith(
      completedSessionFixture.id,
      {
        revieweeId: completedSessionFixture.peer!.id,
        rating: 5,
        comment: 'A very useful session.',
      },
    )
    expect(await screen.findByText('Thank you')).toBeInTheDocument()
  })
})
