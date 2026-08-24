import type { MyProfile, PeerProfile, Session, SwapRequest } from '../api/types'

export const profileFixture: MyProfile = {
  id: 'current-user',
  firstName: 'Avery',
  lastName: 'Student',
  bio: 'I enjoy learning with other students.',
  department: 'Computer Science',
  academicYear: 3,
  avatarUrl: null,
  role: 'STUDENT',
  status: 'ACTIVE',
  averageRating: 4.5,
  totalReviews: 4,
  institution: { id: 'institution-1', name: 'SkillSwap University' },
  unit: { id: 'unit-1', name: 'Engineering' },
  skills: [
    { id: 'user-skill-offer', skillId: 'skill-js', name: 'JavaScript', type: 'OFFER', level: 'ADVANCED' },
    { id: 'user-skill-want', skillId: 'skill-design', name: 'UI Design', type: 'WANT', level: 'BEGINNER' },
  ],
}

export const peerProfileFixture: PeerProfile = {
  id: 'peer-user',
  firstName: 'Morgan',
  lastName: 'Peer',
  bio: 'Design student and patient teacher.',
  department: 'Design',
  academicYear: 2,
  avatarUrl: null,
  averageRating: 4.8,
  totalReviews: 7,
  skills: [
    { id: 'peer-offer', skillId: 'skill-design', name: 'UI Design', type: 'OFFER', level: 'ADVANCED' },
  ],
  recentReviews: [{ rating: 5, comment: 'Very helpful.', createdAt: '2026-08-20T10:00:00.000Z' }],
}

export const requestFixture: SwapRequest = {
  id: 'request-1',
  status: 'PENDING',
  message: 'Could you help me with UI Design?',
  createdAt: '2026-08-22T12:00:00.000Z',
  peer: { id: 'peer-user', name: 'Morgan Peer' },
  sender: { id: 'peer-user', name: 'Morgan Peer' },
  receiver: { id: 'current-user', name: 'Avery Student' },
  requestedSkill: { id: 'skill-js', name: 'JavaScript' },
  offeredSkill: { id: 'skill-design', name: 'UI Design' },
}

export const completedSessionFixture: Session = {
  id: 'session-1',
  requestId: 'request-1',
  scheduledAt: '2026-08-25T14:00:00.000Z',
  duration: 60,
  meetingType: 'ONLINE',
  meetingUrl: 'https://meet.example.com/session',
  locationNote: null,
  status: 'COMPLETED',
  peer: { id: 'peer-user', name: 'Maya Johnson' },
  requestedSkill: { id: 'skill-english', name: 'English' },
  offeredSkill: { id: 'skill-math', name: 'Mathematics' },
  reviewSubmitted: false,
}
