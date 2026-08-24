import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { normalizeApiError } from '../api/errors'
import { getMyProfile } from '../api/profile'
import { createSwapRequest } from '../api/requests'
import type { CreatedSwapRequest, MyProfile, PeerProfile, UserSkill } from '../api/types'
import { getPeerProfile } from '../api/users'
import { formatDate } from '../utils/date-time'
import { ProfileIdentityCard } from '../components/ProfileIdentityCard'

type Loadable<T> =
  | { status: 'loading' }
  | { status: 'loaded'; data: T }
  | { status: 'error'; message: string }

export function PeerProfilePage() {
  const { userId } = useParams()
  const [peerState, setPeerState] = useState<Loadable<PeerProfile>>({ status: 'loading' })
  const [myProfileState, setMyProfileState] = useState<Loadable<MyProfile>>({ status: 'loading' })
  const [isRequestOpen, setIsRequestOpen] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    void Promise.allSettled([getPeerProfile(userId), getMyProfile()]).then(([peerResult, myProfileResult]) => {
      if (cancelled) return

      if (peerResult.status === 'fulfilled') setPeerState({ status: 'loaded', data: peerResult.value })
      else setPeerState({ status: 'error', message: normalizeApiError(peerResult.reason).message })

      if (myProfileResult.status === 'fulfilled') setMyProfileState({ status: 'loaded', data: myProfileResult.value })
      else setMyProfileState({ status: 'error', message: normalizeApiError(myProfileResult.reason).message })
    })

    return () => {
      cancelled = true
    }
  }, [retry, userId])

  if (!userId) return <PeerError message="No peer was selected." onRetry={() => undefined} />
  if (peerState.status === 'loading') return <PeerProfileLoading />
  if (peerState.status === 'error') return <PeerError message={peerState.message} onRetry={() => { setPeerState({ status: 'loading' }); setRetry((value) => value + 1) }} />

  const peer = peerState.data
  const offeredSkills = peer.skills.filter((skill) => skill.type === 'OFFER')
  const wantedSkills = peer.skills.filter((skill) => skill.type === 'WANT')
  const myOfferedSkills = myProfileState.status === 'loaded' ? myProfileState.data.skills.filter((skill) => skill.type === 'OFFER') : []

  return (
    <section aria-labelledby="peer-profile-title" className="space-y-7">
      <Link to="/discover" className="inline-flex items-center gap-2 rounded-lg text-sm font-bold text-teal-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-teal-300">← Back to Discover</Link>

      <ProfileIdentityCard
        firstName={peer.firstName}
        lastName={peer.lastName}
        avatarUrl={peer.avatarUrl}
        secondaryText={`${peer.department || 'Department not added'} · Year ${peer.academicYear}`}
        eyebrow="Student profile"
        titleId="peer-profile-title"
        action={<button type="button" disabled={offeredSkills.length === 0} onClick={() => setIsRequestOpen(true)} className="min-h-12 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-teal-600/20 outline-none transition hover:bg-teal-700 focus-visible:ring-4 focus-visible:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-50">Request SkillSwap</button>}
      >

          {offeredSkills.length === 0 && <p className="mt-4 text-right text-sm text-slate-500">This student has no offered skills available to request.</p>}

          <div className="mt-8 grid gap-6 border-t border-slate-100 pt-7 lg:grid-cols-[1.5fr_0.8fr]">
            <div><h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">About</h2><p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">{peer.bio || 'No bio provided.'}</p></div>
            <dl className="grid grid-cols-2 gap-3"><Fact label="Rating" value={peer.totalReviews > 0 ? `★ ${peer.averageRating}` : 'Not rated'} /><Fact label="Reviews" value={String(peer.totalReviews)} /><Fact label="Department" value={peer.department} /><Fact label="Academic year" value={String(peer.academicYear)} /></dl>
          </div>
      </ProfileIdentityCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillList title="Skills I Can Help With" description="Skills this student offers." skills={offeredSkills} tone="offer" />
        <SkillList title="Skills I Want Help With" description="Skills this student wants to learn." skills={wantedSkills} tone="want" />
      </div>

      <ReviewsSection reviews={peer.recentReviews} />

      {isRequestOpen && (
        <RequestDialog
          receiverId={userId}
          peerName={`${peer.firstName} ${peer.lastName}`}
          peerOfferedSkills={offeredSkills}
          myOfferedSkills={myOfferedSkills}
          myProfileError={myProfileState.status === 'error' ? myProfileState.message : null}
          onClose={() => setIsRequestOpen(false)}
        />
      )}
    </section>
  )
}

function RequestDialog({ receiverId, peerName, peerOfferedSkills, myOfferedSkills, myProfileError, onClose }: { receiverId: string; peerName: string; peerOfferedSkills: UserSkill[]; myOfferedSkills: UserSkill[]; myProfileError: string | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const submittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdRequest, setCreatedRequest] = useState<CreatedSwapRequest | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const formData = new FormData(event.currentTarget)
    const requestedSkillId = String(formData.get('requestedSkillId') ?? '')
    const offeredSkillId = String(formData.get('offeredSkillId') ?? '')
    const message = String(formData.get('message') ?? '').trim()

    if (!receiverId) {
      setError('The request receiver is missing.')
      return
    }
    if (!requestedSkillId) {
      setError('Choose a skill you want to request.')
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await createSwapRequest({
        receiverId,
        requestedSkillId,
        ...(offeredSkillId ? { offeredSkillId } : {}),
        ...(message ? { message } : {}),
      })
      setCreatedRequest(result)
    } catch (requestError) {
      setError(normalizeApiError(requestError).message)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="request-skillswap-title" onCancel={onClose} className="m-auto max-h-[90dvh] w-[min(94vw,38rem)] overflow-y-auto rounded-[2rem] border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/55 backdrop:backdrop-blur-sm">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-teal-600">SkillSwap request</p><h2 id="request-skillswap-title" title={`Connect with ${peerName}`} className="mt-1 truncate text-xl font-extrabold">Connect with {peerName}</h2></div>
        <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200" aria-label="Close request form">×</button>
      </div>

      {createdRequest ? (
        <div className="p-6 text-center sm:p-8">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal-100 text-3xl text-teal-700" aria-hidden="true">✓</span>
          <h3 className="mt-5 text-2xl font-extrabold">Request sent</h3>
          <p role="status" className="mt-2 leading-7 text-slate-600">Your SkillSwap request was created successfully.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600">Stay here</button><Link to="/requests" className="rounded-xl bg-teal-600 px-5 py-3 font-bold text-white shadow-md shadow-teal-600/20">Go to Requests</Link></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}
          <div><label htmlFor="requested-skill" className="mb-2 flex justify-between gap-3 text-sm font-bold"><span>Skill you want</span><span className="text-xs text-teal-700">Required</span></label><select id="requested-skill" name="requestedSkillId" required defaultValue="" className={selectClassName}><option value="" disabled>Choose one of {peerName}’s skills</option>{peerOfferedSkills.map((skill) => <option key={skill.id} value={skill.skillId}>{skill.name} · {capitalize(skill.level)}</option>)}</select></div>
          <div><label htmlFor="offered-skill" className="mb-2 flex justify-between gap-3 text-sm font-bold"><span>Skill you can offer</span><span className="text-xs font-medium text-slate-400">Optional</span></label><select id="offered-skill" name="offeredSkillId" defaultValue="" className={selectClassName}><option value="">No exchange skill selected</option>{myOfferedSkills.map((skill) => <option key={skill.id} value={skill.skillId}>{skill.name} · {capitalize(skill.level)}</option>)}</select>{myProfileError && <p className="mt-2 text-xs leading-5 text-amber-800">Your offered skills could not be loaded. You can still send a request without one.</p>}</div>
          <div><label htmlFor="request-message" className="mb-2 flex justify-between gap-3 text-sm font-bold"><span>Message</span><span className="text-xs font-medium text-slate-400">Optional</span></label><textarea id="request-message" name="message" rows={5} placeholder={`Tell ${peerName} what you’d like to learn or how you can help.`} className={selectClassName} /></div>
          <button type="submit" disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}{isSubmitting ? 'Sending request…' : 'Send SkillSwap request'}</button>
        </form>
      )}
    </dialog>
  )
}

function SkillList({ title, description, skills, tone }: { title: string; description: string; skills: UserSkill[]; tone: 'offer' | 'want' }) {
  return <article className="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-teal-900/6 sm:p-6"><span className={`grid size-11 place-items-center rounded-2xl text-xl ${tone === 'offer' ? 'bg-teal-100 text-teal-700' : 'bg-coral-100 text-coral-500'}`} aria-hidden="true">{tone === 'offer' ? '↗' : '↙'}</span><h2 className="mt-5 text-xl font-extrabold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p>{skills.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">No skills listed in this section.</p> : <ul className="mt-5 grid gap-3 sm:grid-cols-2">{skills.map((skill) => <li key={skill.id} className="rounded-2xl bg-slate-50 p-4"><p className="font-extrabold">{skill.name}</p><p className="mt-1 text-xs font-semibold text-slate-500">{capitalize(skill.level)}</p></li>)}</ul>}</article>
}

function ReviewsSection({ reviews }: { reviews: PeerProfile['recentReviews'] }) {
  return <article className="rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-teal-900/6 sm:p-7"><div><h2 className="text-xl font-extrabold">Recent reviews</h2><p className="mt-1 text-sm text-slate-500">Feedback returned on this student’s public profile.</p></div>{reviews.length === 0 ? <p className="mt-6 rounded-2xl border border-dashed border-slate-200 px-5 py-9 text-center text-sm text-slate-500">No recent reviews yet.</p> : <ul className="mt-6 grid gap-4 md:grid-cols-2">{reviews.map((review, index) => <ReviewCard key={`${review.createdAt}-${index}`} review={review} />)}</ul>}</article>
}

function ReviewCard({ review }: { review: PeerProfile['recentReviews'][number] }) {
  return <li className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-5"><StarRating rating={review.rating} /><p className="mt-3 break-words leading-7 text-slate-600">{review.comment || 'No written comment.'}</p><p className="mt-4 text-sm font-semibold text-slate-600">{review.reviewer?.name ?? 'SkillSwap member'}</p><time dateTime={review.createdAt} className="mt-1 block text-xs font-semibold text-slate-400">{formatDate(review.createdAt)}</time></li>
}

function StarRating({ rating }: { rating: number }) {
  return <div aria-label={`${rating} out of 5 stars`} className="flex gap-0.5 text-lg"><span aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <span key={index} className={index < rating ? 'text-amber-400' : 'text-slate-200'}>★</span>)}</span></div>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-3"><dt className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-bold">{value}</dd></div>
}

function PeerProfileLoading() {
  return <div role="status" aria-label="Loading peer profile" className="animate-pulse space-y-7"><div className="h-10 w-36 rounded-xl bg-teal-100" /><div className="h-96 rounded-[2rem] bg-white" /><div className="grid gap-6 lg:grid-cols-2"><div className="h-72 rounded-[2rem] bg-white" /><div className="h-72 rounded-[2rem] bg-white" /></div></div>
}

function PeerError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <section className="grid min-h-96 place-items-center rounded-[2rem] border border-red-100 bg-white p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-700" aria-hidden="true">!</span><h1 className="mt-5 text-2xl font-extrabold">Profile unavailable</h1><p role="alert" className="mt-2 text-slate-600">{message}</p><button type="button" onClick={onRetry} className="mt-6 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200">Try again</button></div></section>
}

const selectClassName = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100'

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}
