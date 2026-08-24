import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { peerProfileFixture, profileFixture } from '../test/fixtures'
import { PeerProfilePage } from './PeerProfilePage'

const mocks = vi.hoisted(() => ({ getPeerProfile: vi.fn(), getMyProfile: vi.fn() }))
vi.mock('../api/users', () => ({ getPeerProfile: mocks.getPeerProfile }))
vi.mock('../api/profile', () => ({ getMyProfile: mocks.getMyProfile }))

function renderPage() {
  return render(<MemoryRouter initialEntries={['/users/peer-user']}><Routes><Route path="/users/:userId" element={<PeerProfilePage />} /></Routes></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getMyProfile.mockResolvedValue(profileFixture)
})

describe('PeerProfilePage reviews', () => {
  it('displays the reviewer public name', async () => {
    mocks.getPeerProfile.mockResolvedValue({ ...peerProfileFixture, recentReviews: [{ rating: 5, comment: 'Great', createdAt: '2026-08-24T12:00:00.000Z', reviewer: { id: 'john', name: 'John Smith' } }] })
    renderPage()
    expect(await screen.findByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Great')).toBeInTheDocument()
  })

  it('renders the requested peer identity with a fixed cover avatar', async () => {
    mocks.getPeerProfile.mockResolvedValue({ ...peerProfileFixture, firstName: 'Maya-With-An-Exceptionally-Long-Name', avatarUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E' })
    renderPage()
    const avatar = await screen.findByRole('img', { name: /Maya-With-An-Exceptionally-Long-Name Peer profile/ })
    expect(avatar).toHaveClass('size-full', 'object-cover')
    expect(screen.getByText('Maya-With-An-Exceptionally-Long-Name Peer')).toBeInTheDocument()
    expect(mocks.getPeerProfile).toHaveBeenCalledWith('peer-user')
  })

  it('uses peer initials when no avatar image exists', async () => {
    mocks.getPeerProfile.mockResolvedValue({ ...peerProfileFixture, avatarUrl: null })
    renderPage()
    expect(await screen.findByLabelText('Morgan Peer initials')).toHaveTextContent('MP')
    expect(screen.queryByRole('img', { name: /Morgan Peer profile/ })).not.toBeInTheDocument()
  })

  it('uses a safe fallback when reviewer data is missing', async () => {
    mocks.getPeerProfile.mockResolvedValue({ ...peerProfileFixture, recentReviews: [{ rating: 5, comment: 'Great', createdAt: '2026-08-24T12:00:00.000Z' }] })
    renderPage()
    expect(await screen.findByText('SkillSwap member')).toBeInTheDocument()
  })
})
