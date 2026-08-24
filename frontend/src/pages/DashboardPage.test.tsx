import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { profileFixture } from '../test/fixtures'
import type { StudentSearchResult } from '../api/types'
import { DashboardPage } from './DashboardPage'

const mocks = vi.hoisted(() => ({
  getMyProfile: vi.fn(),
  searchStudents: vi.fn(),
  listSwapRequests: vi.fn(),
  listSessions: vi.fn(),
}))

vi.mock('../api/profile', () => ({ getMyProfile: mocks.getMyProfile }))
vi.mock('../api/search', () => ({ searchStudents: mocks.searchStudents }))
vi.mock('../api/requests', () => ({ listSwapRequests: mocks.listSwapRequests }))
vi.mock('../api/sessions', () => ({ listSessions: mocks.listSessions }))

const meta = { page: 1, limit: 4, total: 1, totalPages: 1 }
const match: StudentSearchResult = {
  profile: { id: 'peer', name: 'Maya Peer', bio: '', department: 'Business', averageRating: 0, unit: null },
  offeredSkill: null,
  match: { score: 0, reasons: [] },
}

function renderDashboard() {
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getMyProfile.mockResolvedValue(profileFixture)
  mocks.listSwapRequests.mockResolvedValue([])
  mocks.listSessions.mockResolvedValue([])
})

describe('DashboardPage match resilience', () => {
  it('renders a match with empty reasons and no offered skill without crashing', async () => {
    mocks.searchStudents.mockResolvedValue({ data: [match], meta })
    renderDashboard()
    expect(await screen.findByText('Maya Peer')).toBeInTheDocument()
    expect(screen.getByText('Browse their profile to learn more.')).toBeInTheDocument()
  })

  it('renders the dashboard normally with zero matches', async () => {
    mocks.searchStudents.mockResolvedValue({ data: [], meta: { ...meta, total: 0, totalPages: 0 } })
    renderDashboard()
    expect(await screen.findByText('No matching peers were found for your current wanted skills.')).toBeInTheDocument()
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
  })
})
