import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'
import { profileFixture } from '../test/fixtures'

const mocks = vi.hoisted(() => ({
  getMyProfile: vi.fn(), updateMyProfile: vi.fn(), addMySkill: vi.fn(), removeMySkill: vi.fn(), listSkills: vi.fn(),
}))
vi.mock('../api/profile', () => ({ getMyProfile: mocks.getMyProfile, updateMyProfile: mocks.updateMyProfile, addMySkill: mocks.addMySkill, removeMySkill: mocks.removeMySkill }))
vi.mock('../api/skills', () => ({ listSkills: mocks.listSkills }))

describe('ProfilePage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.getMyProfile.mockResolvedValue(profileFixture)
    mocks.listSkills.mockResolvedValue([
      { id: 'skill-js', name: 'JavaScript', category: 'Programming' },
      { id: 'skill-design', name: 'UI Design', category: 'Design' },
      { id: 'skill-python', name: 'Python', category: 'Programming' },
    ])
  })

  it('renders real profile details and separates offered and wanted skills', async () => {
    render(<ProfilePage />)
    expect(await screen.findByRole('heading', { name: 'Avery Student' })).toBeInTheDocument()
    expect(screen.getByText('SkillSwap University')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Skills I Can Help With' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Skills I Want Help With' })).toBeInTheDocument()
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('UI Design')).toBeInTheDocument()
  })

  it('adds a canonical skill and refreshes the profile', async () => {
    const updated = { ...profileFixture, skills: [...profileFixture.skills, { id: 'new-user-skill', skillId: 'skill-python', name: 'Python', type: 'OFFER' as const, level: 'INTERMEDIATE' as const }] }
    mocks.getMyProfile.mockResolvedValueOnce(profileFixture).mockResolvedValueOnce(updated)
    mocks.addMySkill.mockResolvedValue({ id: 'new-user-skill', skillId: 'skill-python', type: 'OFFER', level: 'INTERMEDIATE' })
    const user = userEvent.setup()
    render(<ProfilePage />)

    await screen.findByRole('heading', { name: 'Add a skill' })
    await user.selectOptions(screen.getByLabelText('Skill'), 'skill-python')
    await user.selectOptions(screen.getByLabelText('Level'), 'INTERMEDIATE')
    await user.click(screen.getByRole('button', { name: 'Add skill' }))

    expect(mocks.addMySkill).toHaveBeenCalledWith({ skillId: 'skill-python', type: 'OFFER', level: 'INTERMEDIATE' })
    expect(await screen.findByText('Skill added to your profile.')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('confirms and removes a profile skill', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const updated = { ...profileFixture, skills: profileFixture.skills.filter((skill) => skill.id !== 'user-skill-offer') }
    mocks.getMyProfile.mockResolvedValueOnce(profileFixture).mockResolvedValueOnce(updated)
    mocks.removeMySkill.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(await screen.findByRole('button', { name: 'Remove JavaScript' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(mocks.removeMySkill).toHaveBeenCalledWith('user-skill-offer')
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Remove JavaScript' }),
      ).not.toBeInTheDocument(),
    )
  })
})
