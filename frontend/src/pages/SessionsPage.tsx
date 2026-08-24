import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { normalizeApiError } from '../api/errors'
import { listSessions, submitReview, updateSession } from '../api/sessions'
import type { Session, SessionStatus, SubmittedReview } from '../api/types'
import { StarRatingInput } from '../components/StarRatingInput'
import { FeedbackBanner } from '../components/FeedbackBanner'
import { formatDateTime } from '../utils/date-time'

type SessionsState =
  | { key: string; status: 'loading' }
  | {
      key: string
      status: 'loaded'
      sessions: Session[]
    }
  | { key: string; status: 'error'; message: string }

const tabs: Array<{ status: SessionStatus; label: string; description: string }> = [
  { status: 'SCHEDULED', label: 'Upcoming', description: 'Sessions waiting to happen' },
  { status: 'COMPLETED', label: 'Completed', description: 'Finished skill exchanges' },
  { status: 'CANCELLED', label: 'Cancelled', description: 'Sessions that did not go ahead' },
]

export function SessionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeStatus = parseSessionStatus(searchParams.get('status'))
  const [retry, setRetry] = useState(0)
  const requestKey = `${activeStatus}|${retry}`
  const [state, setState] = useState<SessionsState>({ key: requestKey, status: 'loading' })
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reviewSession, setReviewSession] = useState<Session | null>(null)

  useEffect(() => {
    let cancelled = false
    void listSessions({ status: activeStatus }).then((loadedSessions) => {
      if (cancelled) return
      setState({
        key: requestKey,
        status: 'loaded',
        sessions: [...loadedSessions].sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt)),
      })
    }).catch((error) => {
      if (!cancelled) setState({ key: requestKey, status: 'error', message: normalizeApiError(error).message })
    })

    return () => {
      cancelled = true
    }
  }, [activeStatus, requestKey])

  const isLoading = state.status === 'loading' || state.key !== requestKey
  const sessions = state.status === 'loaded' && state.key === requestKey ? state.sessions : []

  async function handleStatusUpdate(sessionId: string, nextStatus: 'COMPLETED' | 'CANCELLED') {
    if (mutatingId) return
    setMutatingId(sessionId)
    setMutationError(null)
    setNotice(null)
    try {
      await updateSession(sessionId, { status: nextStatus })
      setState((current) => current.status === 'loaded'
        ? { ...current, sessions: current.sessions.filter((session) => session.id !== sessionId) }
        : current)
      setNotice(nextStatus === 'COMPLETED' ? 'Session marked as completed.' : 'Session cancelled.')
      setRetry((value) => value + 1)
    } catch (error) {
      setMutationError(normalizeApiError(error).message)
    } finally {
      setMutatingId(null)
    }
  }

  function changeTab(status: SessionStatus) {
    setSearchParams({ status })
    setMutationError(null)
    setNotice(null)
    setReviewSession(null)
  }

  return (
    <section aria-labelledby="sessions-title" className="space-y-7">
      <header><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-600">Learn together</p><h1 id="sessions-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Sessions</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">Manage scheduled exchanges, record their outcome, and leave feedback after completed sessions.</p></header>

      <div aria-label="Session status" className="grid gap-2 rounded-[2rem] border border-white bg-white p-2 shadow-lg shadow-teal-900/6 sm:grid-cols-3 sm:p-3">
        {tabs.map((tab) => {
          const selected = activeStatus === tab.status
          return <button key={tab.status} type="button" aria-pressed={selected} onClick={() => changeTab(tab.status)} className={`min-h-16 rounded-2xl px-4 py-3 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-teal-100 ${selected ? 'bg-teal-100 text-teal-800' : 'text-slate-500 hover:bg-slate-50 hover:text-ink'}`}><span className="block font-extrabold">{tab.label}</span><span className="mt-0.5 block text-xs opacity-75">{tab.description}</span></button>
        })}
      </div>

      {mutationError && <FeedbackBanner tone="error" message={mutationError} onDismiss={() => setMutationError(null)} />}
      {notice && <FeedbackBanner tone="success" message={notice} onDismiss={() => setNotice(null)} />}

      {isLoading ? (
        <SessionsLoading />
      ) : state.status === 'error' ? (
        <ErrorState message={state.message} onRetry={() => setRetry((value) => value + 1)} />
      ) : sessions.length === 0 ? (
        <EmptyState status={activeStatus} />
      ) : state.status === 'loaded' ? (
        <ul className="grid gap-5 xl:grid-cols-2">
          {sessions.map((session) => <SessionCard key={session.id} session={session} isMutating={mutatingId === session.id} mutationsDisabled={mutatingId !== null} onStatusUpdate={handleStatusUpdate} onReview={() => session.peer && setReviewSession(session)} />)}
        </ul>
      ) : null}

      {reviewSession?.status === 'COMPLETED' && reviewSession.peer && (
        <ReviewDialog
          session={reviewSession as Session & { peer: NonNullable<Session['peer']> }}
          onClose={() => setReviewSession(null)}
          onReviewed={() => {
            setState((current) => current.status === 'loaded' ? { ...current, sessions: current.sessions.map((session) => session.id === reviewSession.id ? { ...session, reviewSubmitted: true } : session) } : current)
            setNotice('Review submitted successfully.')
          }}
        />
      )}
    </section>
  )
}

function SessionCard({ session, isMutating, mutationsDisabled, onStatusUpdate, onReview }: { session: Session; isMutating: boolean; mutationsDisabled: boolean; onStatusUpdate: (id: string, status: 'COMPLETED' | 'CANCELLED') => Promise<void>; onReview: () => void }) {
  const meetingUrlIsSafe = session.meetingUrl ? isHttpUrl(session.meetingUrl) : false
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-[2rem] border border-white bg-white shadow-lg shadow-teal-900/7">
      <div className={`h-2 ${session.status === 'SCHEDULED' ? 'bg-coral-400' : session.status === 'COMPLETED' ? 'bg-teal-500' : 'bg-slate-300'}`} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-600">{session.status === 'COMPLETED' ? 'Completed session' : session.meetingType === 'ONLINE' ? 'Online session' : 'In-person session'}</p><h2 className="mt-2 text-xl font-extrabold">{session.peer ? `with ${session.peer.name}` : 'Peer unavailable'}</h2><p className="mt-1 text-sm text-slate-500">{formatDateTime(session.scheduledAt)} · {session.duration} minutes</p></div><StatusBadge status={session.status} /></div>

        {(session.requestedSkill || session.offeredSkill) && <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">{session.requestedSkill?.name ?? 'Skill not specified'} <span className="px-1 text-coral-500" aria-hidden="true">↔</span> {session.offeredSkill?.name ?? 'No exchange skill'}</p>}

        <dl className="mt-5 grid gap-3 sm:grid-cols-2"><Fact label="Meeting type" value={session.meetingType === 'ONLINE' ? 'Online' : 'In person'} /><Fact label="Duration" value={`${session.duration} minutes`} /></dl>

        {session.locationNote && <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{session.meetingType === 'IN_PERSON' ? 'Location note' : 'Note'}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{session.locationNote}</p></div>}

        {session.meetingType === 'ONLINE' && session.meetingUrl && (
          meetingUrlIsSafe ? <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="mt-5 flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/20 outline-none hover:bg-teal-700 focus-visible:ring-4 focus-visible:ring-teal-200">Join meeting <span aria-hidden="true">↗</span></a> : <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">The stored meeting URL is not a safe HTTP or HTTPS link.</p>
        )}

        <div className="mt-auto pt-6">
          {session.status === 'SCHEDULED' && <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-5"><button type="button" disabled={mutationsDisabled} onClick={() => void onStatusUpdate(session.id, 'CANCELLED')} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50">{isMutating ? 'Updating…' : 'Cancel session'}</button><button type="button" disabled={mutationsDisabled} onClick={() => void onStatusUpdate(session.id, 'COMPLETED')} className="min-h-11 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-50">{isMutating ? 'Updating…' : 'Mark completed'}</button></div>}
          {session.status === 'COMPLETED' && (session.reviewSubmitted ? <p className="rounded-xl bg-teal-50 px-4 py-3 text-center text-sm font-bold text-teal-700">✓ Review submitted</p> : <><button type="button" disabled={!session.peer} onClick={onReview} className="min-h-11 w-full rounded-xl bg-coral-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-coral-500/20 hover:bg-coral-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral-100 disabled:cursor-not-allowed disabled:opacity-50">Add Review</button>{!session.peer && <p className="mt-2 text-center text-xs leading-5 text-slate-500">Peer identity is unavailable, so a valid review cannot be submitted.</p>}</>)}
        </div>
      </div>
    </li>
  )
}

function ReviewDialog({ session, onClose, onReviewed }: { session: Session & { peer: NonNullable<Session['peer']> }; onClose: () => void; onReviewed: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const submittingRef = useRef(false)
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [review, setReview] = useState<SubmittedReview | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  if (session.status !== 'COMPLETED') return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    if (rating < 1 || rating > 5) {
      setError('Choose a rating from 1 to 5 stars.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const comment = String(formData.get('comment') ?? '').trim()
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)
    try {
      const submitted = await submitReview(session.id, { revieweeId: session.peer.id, rating, ...(comment ? { comment } : {}) })
      setReview(submitted)
      onReviewed()
    } catch (requestError) {
      setError(normalizeApiError(requestError).message)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="review-session-title" onCancel={onClose} className="m-auto max-h-[92dvh] w-[min(94vw,36rem)] overflow-y-auto rounded-[2rem] border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/55 backdrop:backdrop-blur-sm">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7"><div><p className="text-xs font-bold uppercase tracking-wider text-coral-500">Completed session</p><h2 id="review-session-title" className="mt-1 text-xl font-extrabold">Review {session.peer.name}</h2><p className="mt-1 text-sm text-slate-500">Share your experience from your SkillSwap session with {session.peer.name.split(' ')[0]}.</p></div><button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200" aria-label="Close review form">×</button></header>
      {review ? <div className="p-7 text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal-100 text-3xl text-teal-700" aria-hidden="true">✓</span><h3 className="mt-5 text-2xl font-extrabold">Thank you</h3><p role="status" className="mt-2 leading-7 text-slate-600">Your {review.rating}-star review was submitted successfully.</p><button type="button" onClick={onClose} className="mt-7 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white">Done</button></div> : <form noValidate onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}<StarRatingInput value={rating} onChange={setRating} disabled={isSubmitting} /><div><label htmlFor="review-comment" className="mb-2 flex justify-between gap-3 text-sm font-bold"><span>Comment</span><span className="text-xs font-medium text-slate-400">Optional</span></label><textarea id="review-comment" name="comment" rows={5} placeholder="What made this session helpful?" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></div><button type="submit" disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-3 font-bold text-white shadow-lg shadow-coral-500/20 hover:bg-coral-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral-100 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}{isSubmitting ? 'Submitting…' : 'Submit review'}</button></form>}
    </dialog>
  )
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const classes = status === 'SCHEDULED' ? 'bg-coral-100 text-coral-500' : status === 'COMPLETED' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold capitalize ${classes}`}>{status.toLowerCase()}</span>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><dt className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 text-sm font-bold">{value}</dd></div>
}

function EmptyState({ status }: { status: SessionStatus }) {
  const copy = status === 'SCHEDULED' ? ['No upcoming sessions', 'Schedule a session from an accepted SkillSwap request.'] : status === 'COMPLETED' ? ['No completed sessions', 'Sessions you mark as completed will appear here.'] : ['No cancelled sessions', 'Cancelled sessions will appear here.']
  return <div className="grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-teal-200 bg-white/70 p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-2xl text-teal-700" aria-hidden="true">◷</span><h2 className="mt-5 text-xl font-extrabold">{copy[0]}</h2><p className="mt-2 text-slate-500">{copy[1]}</p></div></div>
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="grid min-h-72 place-items-center rounded-[2rem] border border-red-100 bg-white p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-700" aria-hidden="true">!</span><h2 className="mt-5 text-xl font-extrabold">Sessions couldn’t be loaded</h2><p role="alert" className="mt-2 text-slate-600">{message}</p><button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white">Try again</button></div></div>
}

function SessionsLoading() {
  return <div role="status" aria-label="Loading sessions" className="grid animate-pulse gap-5 xl:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-80 rounded-[2rem] bg-white shadow-md shadow-teal-900/5" />)}</div>
}

function parseSessionStatus(value: string | null): SessionStatus {
  return value === 'COMPLETED' || value === 'CANCELLED' ? value : 'SCHEDULED'
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
