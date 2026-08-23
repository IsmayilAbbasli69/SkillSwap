import type { AdminStats, Skill } from '../api/types'

export const MOCK_PASSWORD = 'Password123!'
export const INSTITUTION = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Horizon University',
}
export const UNIT = {
  id: 'aaaa1111-1111-4111-8111-111111111111',
  name: 'Engineering Campus',
}

export const skillCatalog: Skill[] = [
  ['10000000-0000-4000-8000-000000000001', 'JavaScript', 'Programming'],
  ['10000000-0000-4000-8000-000000000002', 'Python', 'Programming'],
  ['10000000-0000-4000-8000-000000000003', 'Java', 'Programming'],
  ['10000000-0000-4000-8000-000000000004', 'React', 'Web Development'],
  ['10000000-0000-4000-8000-000000000005', 'English', 'Languages'],
  ['10000000-0000-4000-8000-000000000006', 'Mathematics', 'Sciences'],
  ['10000000-0000-4000-8000-000000000007', 'UI/UX Design', 'Design'],
  ['10000000-0000-4000-8000-000000000008', 'Graphic Design', 'Design'],
  ['10000000-0000-4000-8000-000000000009', 'SQL', 'Data'],
  ['10000000-0000-4000-8000-000000000010', 'Physics', 'Sciences'],
  ['10000000-0000-4000-8000-000000000011', 'Chemistry', 'Sciences'],
].map(([id, name, category]) => ({ id, name, category }))

export const mockAdminStats: AdminStats = {
  students: { total: 45, active: 42 },
  requests: { total: 120, accepted: 75, pending: 30, declined: 15 },
  sessions: { scheduled: 25, completed: 50 },
  topWantedSkills: [
    { skill: 'Python', count: 18 },
    { skill: 'React', count: 14 },
    { skill: 'English', count: 12 },
  ],
  topOfferedSkills: [
    { skill: 'JavaScript', count: 22 },
    { skill: 'Mathematics', count: 17 },
    { skill: 'Graphic Design', count: 11 },
  ],
}
