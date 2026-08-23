import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiscoverPage } from './DiscoverPage'

const mocks = vi.hoisted(() => ({ listSkills: vi.fn(), searchStudents: vi.fn() }))
vi.mock('../api/skills', () => ({ listSkills: mocks.listSkills }))
vi.mock('../api/search', () => ({ searchStudents: mocks.searchStudents }))

const meta = { page: 1, limit: 9, total: 1, totalPages: 1 }

describe('DiscoverPage', () => {
  beforeEach(() => {
    mocks.listSkills.mockReset()
    mocks.searchStudents.mockReset()
    mocks.listSkills.mockResolvedValue([{ id: 'skill-design', name: 'UI Design', category: 'Design' }])
  })

  it('shows loading and then renders backend-ranked results', async () => {
    let resolveSearch: (value: unknown) => void = () => undefined
    mocks.searchStudents.mockReturnValue(new Promise((resolve) => { resolveSearch = resolve }))
    render(<MemoryRouter><DiscoverPage /></MemoryRouter>)
    expect(screen.getByRole('status', { name: 'Loading search results' })).toBeInTheDocument()

    resolveSearch({ data: [{ profile: { id: 'peer-1', name: 'Morgan Peer', bio: 'Design mentor', department: 'Design', averageRating: 4.8, unit: { id: 'unit-1', name: 'Arts' } }, offeredSkill: null, match: { score: 82, reasons: ['Reciprocal skill match found'] } }], meta })

    expect(await screen.findByRole('heading', { name: 'Morgan Peer' })).toBeInTheDocument()
    expect(screen.getByText('Excellent Match')).toBeInTheDocument()
    expect(screen.getByText(/Browse result/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Profile' })).toHaveAttribute('href', '/users/peer-1')
  })

  it('renders a useful empty state', async () => {
    mocks.searchStudents.mockResolvedValue({ data: [], meta: { ...meta, total: 0, totalPages: 0 } })
    render(<MemoryRouter><DiscoverPage /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'No peers found' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Browse all peers' })).toBeInTheDocument()
  })
})
