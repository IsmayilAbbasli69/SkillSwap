import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequestsPage } from './RequestsPage'
import { requestFixture } from '../test/fixtures'

const mocks = vi.hoisted(() => ({ listSwapRequests: vi.fn(), updateSwapRequest: vi.fn() }))
vi.mock('../api/requests', () => ({ listSwapRequests: mocks.listSwapRequests, updateSwapRequest: mocks.updateSwapRequest }))

describe('RequestsPage', () => {
  beforeEach(() => {
    mocks.listSwapRequests.mockReset()
    mocks.updateSwapRequest.mockReset()
  })

  it.each(['ACCEPTED', 'DECLINED'] as const)('submits an incoming %s decision and refreshes the list', async (status) => {
    const refreshed = { ...requestFixture, status, peer: { ...requestFixture.peer, ...(status === 'ACCEPTED' ? { email: 'peer@example.edu' } : {}) } }
    mocks.listSwapRequests.mockResolvedValueOnce([requestFixture]).mockResolvedValueOnce([refreshed])
    mocks.updateSwapRequest.mockResolvedValue({ id: requestFixture.id, status })
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/requests?type=incoming']}><RequestsPage /></MemoryRouter>)

    const actionName = status === 'ACCEPTED' ? 'Accept' : 'Decline'
    await user.click(await screen.findByRole('button', { name: actionName }))

    expect(mocks.updateSwapRequest).toHaveBeenCalledWith('request-1', { status })
    await waitFor(() => expect(mocks.listSwapRequests).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(status.toLowerCase())).toBeInTheDocument()
    if (status === 'ACCEPTED') expect(screen.getByText('peer@example.edu')).toBeInTheDocument()
  })
})
