import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { normalizeApiError } from '../api/errors'
import { getMyProfile } from '../api/profile'
import { listSwapRequests } from '../api/requests'
import { searchStudents } from '../api/search'
import { listSessions } from '../api/sessions'
import type { MyProfile, Session, StudentSearchResult, SwapRequest } from '../api/types'
import {
  DashboardCard,
  DashboardCardLoading,
  DashboardSectionError,
} from '../components/DashboardCard'
import { NavIcon, type NavIconName } from '../components/NavIcon'
import { formatDateTime } from '../utils/date-time'

type Loadable<T> =
  | { status: 'loading' }
  | { status: 'loaded'; data: T }
  | { status: 'error'; message: string }

const initialState = { status: 'loading' } as const

export function DashboardPage() {
  const [profileState, setProfileState] = useState<Loadable<MyProfile>>(initialState)
  const [matchesState, setMatchesState] = useState<Loadable<StudentSearchResult[]>>(initialState)
  const [requestsState, setRequestsState] = useState<Loadable<SwapRequest[]>>(initialState)
  const [sessionsState, setSessionsState] = useState<Loadable<Session[]>>(initialState)

  function loadProfileAndMatches() {
    setProfileState(initialState)
    setMatchesState(initialState)

    void getMyProfile()
      .then(async (profile) => {
        setProfileState({ status: 'loaded', data: profile })
        const wantedSkills = profile.skills.filter((skill) => skill.type === 'WANT').slice(0, 3)

        if (wantedSkills.length === 0) {
          setMatchesState({ status: 'loaded', data: [] })
          return
        }

        const results = await Promise.allSettled(
          wantedSkills.map((skill) => searchStudents({ skillId: skill.skillId, page: 1, limit: 4 })),
        )
        const successfulSearches = results
          .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof searchStudents>>> => result.status === 'fulfilled')
          .flatMap((result) => result.value.data)

        if (successfulSearches.length === 0 && results.every((result) => result.status === 'rejected')) {
          const firstFailure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
          setMatchesState({ status: 'error', message: normalizeApiError(firstFailure?.reason).message })
          return
        }

        const strongestByPeer = new Map<string, StudentSearchResult>()
        for (const match of successfulSearches) {
          const existing = strongestByPeer.get(match.profile.id)
          if (!existing || match.match.score > existing.match.score) strongestByPeer.set(match.profile.id, match)
        }

        setMatchesState({
          status: 'loaded',
          data: [...strongestByPeer.values()].sort((a, b) => b.match.score - a.match.score).slice(0, 3),
        })
      })
      .catch((error) => {
        const message = normalizeApiError(error).message
        setProfileState({ status: 'error', message })
        setMatchesState({ status: 'error', message: 'Recommendations need your skill profile before they can be loaded.' })
      })
  }

  function loadRequests() {
    setRequestsState(initialState)
    void listSwapRequests()
      .then((requests) => setRequestsState({ status: 'loaded', data: requests }))
      .catch((error) => setRequestsState({ status: 'error', message: normalizeApiError(error).message }))
  }

  function loadSessions() {
    setSessionsState(initialState)
    void listSessions({ status: 'SCHEDULED' })
      .then((sessions) => setSessionsState({
        status: 'loaded',
        data: [...sessions].sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt)),
      }))
      .catch((error) => setSessionsState({ status: 'error', message: normalizeApiError(error).message }))
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      loadProfileAndMatches()
      loadRequests()
      loadSessions()
    })
  }, [])

  const profile = profileState.status === 'loaded' ? profileState.data : null

  return (
    <section aria-labelledby="dashboard-title" className="space-y-7">
      <WelcomePanel state={profileState} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <MatchesCard state={matchesState} hasWantedSkills={Boolean(profile?.skills.some((skill) => skill.type === 'WANT'))} onRetry={loadProfileAndMatches} />
          <SessionsCard state={sessionsState} onRetry={loadSessions} />
        </div>

        <div className="space-y-6 lg:col-span-4">
          <SkillProfileCard state={profileState} onRetry={loadProfileAndMatches} />
          <RequestsCard state={requestsState} profileId={profile?.id ?? null} onRetry={loadRequests} />
        </div>
      </div>

      <QuickActions />
    </section>
  )
}

function WelcomePanel({ state }: { state: Loadable<MyProfile> }) {
  if (state.status === 'loading') {
    return <div role="status" aria-label="Loading welcome information" className="h-56 animate-pulse rounded-[2rem] bg-teal-100" />
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-[2rem] bg-gradient-to-br from-teal-700 to-teal-500 p-7 text-white sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-100">Dashboard</p>
        <h1 id="dashboard-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome to SkillSwap</h1>
        <p className="mt-3 max-w-xl text-teal-50">Your personal details could not be loaded, but the rest of your dashboard may still be available.</p>
      </div>
    )
  }

  const { data: profile } = state
  const location = profile.unit.name ?? profile.department
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 p-7 text-white shadow-xl shadow-teal-900/15 sm:p-9">
      <div aria-hidden="true" className="absolute -right-12 -top-20 size-56 rounded-full border-[28px] border-white/8" />
      <div aria-hidden="true" className="absolute -bottom-24 right-28 size-48 rounded-full bg-coral-400/20 blur-xl" />
      <div className="relative max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-100">Student dashboard</p>
        <h1 id="dashboard-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome back, {profile.firstName}</h1>
        <p className="mt-4 leading-7 text-teal-50">{profile.institution.name}{location ? ` · ${location}` : ''}</p>
        <Link to="/discover" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 font-bold text-teal-700 shadow-md outline-none transition hover:bg-teal-50 focus-visible:ring-4 focus-visible:ring-white/40">Find a skill partner</Link>
      </div>
    </div>
  )
}

function SkillProfileCard({ state, onRetry }: { state: Loadable<MyProfile>; onRetry: () => void }) {
  if (state.status === 'loading') return <DashboardCardLoading label="Loading skill profile" />
  if (state.status === 'error') return <DashboardCard title="My Skill Profile"><DashboardSectionError message={state.message} onRetry={onRetry} /></DashboardCard>

  const offers = state.data.skills.filter((skill) => skill.type === 'OFFER').length
  const wants = state.data.skills.filter((skill) => skill.type === 'WANT').length
  const needsAttention = !state.data.bio || !state.data.department || offers === 0 || wants === 0

  return (
    <DashboardCard title="My Skill Profile" description="Your current exchange setup">
      <div className="grid grid-cols-2 gap-3">
        <Metric value={offers} label="Skills offered" tone="teal" />
        <Metric value={wants} label="Skills wanted" tone="coral" />
      </div>
      {needsAttention && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Add the missing profile details or skills to make your profile more useful to peers.
        </div>
      )}
      <Link to="/profile" className="mt-4 inline-flex font-bold text-teal-700 underline decoration-teal-200 decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">{needsAttention ? 'Complete profile' : 'View profile'}</Link>
    </DashboardCard>
  )
}

function MatchesCard({ state, hasWantedSkills, onRetry }: { state: Loadable<StudentSearchResult[]>; hasWantedSkills: boolean; onRetry: () => void }) {
  if (state.status === 'loading') return <DashboardCardLoading label="Loading recommended matches" />
  return (
    <DashboardCard title="Recommended Matches" description="Strong matches based on skills you want to learn" action={<CardLink to="/discover">View all</CardLink>}>
      {state.status === 'error' ? (
        <DashboardSectionError message={state.message} onRetry={onRetry} />
      ) : state.data.length === 0 ? (
        <EmptyMessage>{hasWantedSkills ? 'No matching peers were found for your current wanted skills.' : 'Add a skill you want help with to receive recommendations.'}</EmptyMessage>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {state.data.map((match) => (
            <li key={match.profile.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-teal-100 font-extrabold text-teal-700" aria-hidden="true">{match.profile.name.charAt(0).toUpperCase()}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-teal-700">{match.match.score}% match</span>
              </div>
              <h3 className="mt-4 truncate font-extrabold">{match.profile.name}</h3>
              <p className="mt-1 truncate text-sm text-slate-500">{match.profile.department}</p>
              {match.offeredSkill && <p className="mt-3 text-sm font-semibold text-ink">Offers {match.offeredSkill.name} · <span className="capitalize text-slate-500">{match.offeredSkill.level.toLowerCase()}</span></p>}
              {match.match.reasons[0] && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{match.match.reasons[0]}</p>}
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}

function RequestsCard({ state, profileId, onRetry }: { state: Loadable<SwapRequest[]>; profileId: string | null; onRetry: () => void }) {
  if (state.status === 'loading') return <DashboardCardLoading label="Loading request summary" />
  if (state.status === 'error') return <DashboardCard title="Requests"><DashboardSectionError message={state.message} onRetry={onRetry} /></DashboardCard>

  const pendingIncoming = profileId ? state.data.filter((request) => request.status === 'PENDING' && request.receiver.id === profileId).length : 0
  const accepted = state.data.filter((request) => request.status === 'ACCEPTED').length
  const outgoing = profileId ? state.data.filter((request) => request.sender.id === profileId).length : 0

  return (
    <DashboardCard title="Requests" description="Current request totals" action={<CardLink to="/requests">Review</CardLink>}>
      <dl className="space-y-2">
        <SummaryRow label="Pending incoming" value={pendingIncoming} />
        <SummaryRow label="Accepted" value={accepted} />
        <SummaryRow label="Outgoing" value={outgoing} />
      </dl>
    </DashboardCard>
  )
}

function SessionsCard({ state, onRetry }: { state: Loadable<Session[]>; onRetry: () => void }) {
  if (state.status === 'loading') return <DashboardCardLoading label="Loading upcoming sessions" />
  return (
    <DashboardCard title="Upcoming Sessions" description="Your next scheduled exchanges" action={<CardLink to="/sessions">View sessions</CardLink>}>
      {state.status === 'error' ? <DashboardSectionError message={state.message} onRetry={onRetry} /> : state.data.length === 0 ? <EmptyMessage>No scheduled sessions right now.</EmptyMessage> : (
        <ul className="divide-y divide-slate-100">
          {state.data.slice(0, 3).map((session) => (
            <li key={session.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-coral-100 text-coral-500"><NavIcon name="sessions" /></span>
                <div><p className="font-bold">{formatDateTime(session.scheduledAt)}</p><p className="mt-0.5 text-sm text-slate-500">{session.duration} minutes · {session.meetingType === 'ONLINE' ? 'Online' : 'In person'}</p></div>
              </div>
              <span className="self-start rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 sm:self-auto">Scheduled</span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}

const quickActions: Array<{ to: string; label: string; description: string; icon: NavIconName; accent: string }> = [
  { to: '/discover', label: 'Find a skill partner', description: 'Browse students by skill', icon: 'discover', accent: 'bg-teal-100 text-teal-700' },
  { to: '/profile#add-skill', label: 'Add a skill', description: 'Update what you offer or want', icon: 'profile', accent: 'bg-coral-100 text-coral-500' },
  { to: '/requests', label: 'Review requests', description: 'Check incoming and outgoing', icon: 'requests', accent: 'bg-blue-50 text-blue-700' },
  { to: '/sessions', label: 'View sessions', description: 'See your scheduled exchanges', icon: 'sessions', accent: 'bg-amber-50 text-amber-700' },
]

function QuickActions() {
  return <section aria-labelledby="quick-actions-title"><h2 id="quick-actions-title" className="text-xl font-extrabold tracking-tight">Quick actions</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{quickActions.map((action) => <Link key={action.to} to={action.to} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-white bg-white p-4 shadow-md shadow-teal-900/5 outline-none transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-teal-200"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${action.accent}`}><NavIcon name={action.icon} /></span><span className="min-w-0"><span className="block font-extrabold group-hover:text-teal-700">{action.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{action.description}</span></span></Link>)}</div></section>
}

function Metric({ value, label, tone }: { value: number; label: string; tone: 'teal' | 'coral' }) {
  return <div className={`rounded-2xl p-4 ${tone === 'teal' ? 'bg-teal-50' : 'bg-coral-100/60'}`}><p className={`text-3xl font-black ${tone === 'teal' ? 'text-teal-700' : 'text-coral-500'}`}>{value}</p><p className="mt-1 text-xs font-semibold text-slate-600">{label}</p></div>
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><dt className="text-sm font-semibold text-slate-600">{label}</dt><dd className="font-extrabold text-ink">{value}</dd></div>
}

function CardLink({ to, children }: { to: string; children: string }) {
  return <Link to={to} className="shrink-0 rounded-lg text-sm font-bold text-teal-700 underline decoration-teal-200 decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">{children}</Link>
}

function EmptyMessage({ children }: { children: string }) {
  return <p className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center text-sm leading-6 text-slate-500">{children}</p>
}
