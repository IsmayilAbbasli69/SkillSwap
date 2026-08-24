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

  it('uses a safe fallback when reviewer data is missing', async () => {
    mocks.getPeerProfile.mockResolvedValue({ ...peerProfileFixture, recentReviews: [{ rating: 5, comment: 'Great', createdAt: '2026-08-24T12:00:00.000Z' }] })
    renderPage()
    expect(await screen.findByText('SkillSwap member')).toBeInTheDocument()
  })
})
