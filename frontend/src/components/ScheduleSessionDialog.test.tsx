import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScheduleSessionDialog } from './ScheduleSessionDialog'
import { requestFixture } from '../test/fixtures'

const requestApiMocks = vi.hoisted(() => ({ scheduleSession: vi.fn() }))

vi.mock('../api/requests', () => requestApiMocks)

describe('ScheduleSessionDialog', () => {
  beforeEach(() => requestApiMocks.scheduleSession.mockReset())

  it('requires a valid local date and time before scheduling', async () => {
    const user = userEvent.setup()
    render(
      <ScheduleSessionDialog
        request={{ ...requestFixture, status: 'ACCEPTED' }}
        onClose={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Schedule Session' }))

    expect(screen.getByText('Choose a valid local date and time.')).toBeInTheDocument()
    expect(requestApiMocks.scheduleSession).not.toHaveBeenCalled()
  })

  it('validates duration before calling the API', async () => {
    const user = userEvent.setup()
    render(
      <ScheduleSessionDialog
        request={{ ...requestFixture, status: 'ACCEPTED' }}
        onClose={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText(/Date and local time/), {
      target: { value: '2026-08-25T14:00' },
    })
    fireEvent.change(screen.getByLabelText(/Duration/), {
      target: { value: '10' },
    })
    await user.click(screen.getByRole('button', { name: 'Schedule Session' }))

    expect(
      screen.getByText('Duration must be a whole number between 15 and 180 minutes.'),
    ).toBeInTheDocument()
    expect(requestApiMocks.scheduleSession).not.toHaveBeenCalled()
  })
})
