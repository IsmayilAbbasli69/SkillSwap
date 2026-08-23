import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { normalizeApiError } from '../api/errors'
import { listSwapRequests, updateSwapRequest } from '../api/requests'
import type { RequestStatus, SwapRequest } from '../api/types'
import { ScheduleSessionDialog } from '../components/ScheduleSessionDialog'
import { FeedbackBanner } from '../components/FeedbackBanner'
import { formatDateTime } from '../utils/date-time'

type RequestType = 'incoming' | 'outgoing'
type RequestsState =
  | { key: string; status: 'loading' }
  | { key: string; status: 'loaded'; data: SwapRequest[] }
  | { key: string; status: 'error'; message: string }

const statuses: Array<{ value: RequestStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
]

export function RequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const type = parseRequestType(searchParams.get('type'))
  const status = parseRequestStatus(searchParams.get('status'))
  const [retry, setRetry] = useState(0)
  const requestKey = `${type}|${status ?? 'ALL'}|${retry}`
  const [requestsState, setRequestsState] = useState<RequestsState>({ key: requestKey, status: 'loading' })
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [schedulingRequest, setSchedulingRequest] = useState<SwapRequest | null>(null)

  useEffect(() => {
    let cancelled = false
    void listSwapRequests({ type, ...(status ? { status } : {}) })
      .then((requests) => {
        if (!cancelled) setRequestsState({ key: requestKey, status: 'loaded', data: requests })
      })
      .catch((error) => {
        if (!cancelled) setRequestsState({ key: requestKey, status: 'error', message: normalizeApiError(error).message })
      })
    return () => {
      cancelled = true
    }
  }, [requestKey, status, type])

  const isLoading = requestsState.status === 'loading' || requestsState.key !== requestKey
  const requests = requestsState.status === 'loaded' && requestsState.key === requestKey ? requestsState.data : []

  function updateFilters(nextType: RequestType, nextStatus: RequestStatus | null = status ?? null) {
    const next = new URLSearchParams()
    next.set('type', nextType)
    if (nextStatus) next.set('status', nextStatus)
    setSearchParams(next)
    setMutationError(null)
    setSchedulingRequest(null)
  }

  async function handleDecision(requestId: string, nextStatus: 'ACCEPTED' | 'DECLINED') {
    if (mutatingId) return
    setMutatingId(requestId)
    setMutationError(null)
    setSchedulingRequest(null)

    try {
      await updateSwapRequest(requestId, { status: nextStatus })
      setRequestsState((current) => current.status === 'loaded'
        ? {
            ...current,
            data: current.data
              .map((request) => request.id === requestId ? { ...request, status: nextStatus } : request)
              .filter((request) => !status || request.status === status),
          }
        : current)

      try {
        const refreshed = await listSwapRequests({ type, ...(status ? { status } : {}) })
        setRequestsState({ key: requestKey, status: 'loaded', data: refreshed })
      } catch {
        setMutationError('The status was updated, but the latest request details could not be refreshed. Try reloading this list.')
      }
    } catch (error) {
      setMutationError(normalizeApiError(error).message)
    } finally {
      setMutatingId(null)
    }
  }

  return (
    <section aria-labelledby="requests-title" className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-600">Your exchanges</p><h1 id="requests-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">SkillSwap Requests</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">Review proposals, respond to incoming requests, and use disclosed contact details after acceptance.</p></div>
        <Link to="/discover" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 outline-none hover:bg-teal-700 focus-visible:ring-4 focus-visible:ring-teal-200">Find a partner</Link>
      </header>

      <div className="rounded-[2rem] border border-white bg-white p-3 shadow-lg shadow-teal-900/6 sm:p-4">
        <div aria-label="Request direction" className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1.5 sm:max-w-md">
          <DirectionTab selected={type === 'incoming'} label="Incoming" onClick={() => updateFilters('incoming')} />
          <DirectionTab selected={type === 'outgoing'} label="Outgoing" onClick={() => updateFilters('outgoing')} />
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by request status">
          {statuses.map((option) => {
            const selected = (status ?? '') === option.value
            return <button key={option.label} type="button" aria-pressed={selected} onClick={() => updateFilters(type, option.value || null)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold outline-none transition focus-visible:ring-4 focus-visible:ring-teal-100 ${selected ? 'bg-teal-100 text-teal-700' : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-200'}`}>{option.label}</button>
          })}
        </div>
      </div>

      {mutationError && <FeedbackBanner tone="error" message={mutationError} onDismiss={() => setMutationError(null)} />}

      {isLoading ? (
        <RequestsLoading />
      ) : requestsState.status === 'error' ? (
        <div className="grid min-h-72 place-items-center rounded-[2rem] border border-red-100 bg-white p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-700" aria-hidden="true">!</span><h2 className="mt-5 text-xl font-extrabold">Requests couldn’t be loaded</h2><p role="alert" className="mt-2 text-slate-600">{requestsState.message}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-5 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200">Try again</button></div></div>
      ) : requests.length === 0 ? (
        <EmptyRequests type={type} status={status} onClear={() => updateFilters(type, null)} />
      ) : (
        <ul className="grid gap-5 xl:grid-cols-2">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              type={type}
              isMutating={mutatingId === request.id}
              mutationsDisabled={mutatingId !== null}
              onDecision={handleDecision}
              onSchedule={() => setSchedulingRequest(request)}
            />
          ))}
        </ul>
      )}

      {schedulingRequest?.status === 'ACCEPTED' && (
        <ScheduleSessionDialog
          request={schedulingRequest}
          onClose={() => setSchedulingRequest(null)}
        />
      )}
    </section>
  )
}

function RequestCard({ request, type, isMutating, mutationsDisabled, onDecision, onSchedule }: { request: SwapRequest; type: RequestType; isMutating: boolean; mutationsDisabled: boolean; onDecision: (id: string, status: 'ACCEPTED' | 'DECLINED') => Promise<void>; onSchedule: () => void }) {
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-[2rem] border border-white bg-white shadow-lg shadow-teal-900/7">
      <div className={`h-2 ${request.status === 'ACCEPTED' ? 'bg-teal-500' : request.status === 'DECLINED' ? 'bg-slate-300' : 'bg-coral-400'}`} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-100 text-lg font-black text-teal-700" aria-hidden="true">{request.peer.name.charAt(0).toUpperCase()}</span><div className="min-w-0"><Link to={`/users/${request.peer.id}`} title={request.peer.name} className="block truncate text-lg font-extrabold outline-none hover:text-teal-700 hover:underline focus-visible:ring-2 focus-visible:ring-teal-300">{request.peer.name}</Link><time dateTime={request.createdAt} className="mt-1 block text-xs font-semibold text-slate-400">{formatDateTime(request.createdAt)}</time></div></div>
          <StatusBadge status={request.status} />
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <SkillFact label="Requested skill" value={request.requestedSkill.name} tone="teal" />
          <SkillFact label="Offered skill" value={request.offeredSkill?.name ?? 'None offered'} tone="coral" />
        </dl>

        <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="font-bold text-slate-400">From:</span> <span className="font-semibold">{request.sender.name}</span></p><p><span className="font-bold text-slate-400">To:</span> <span className="font-semibold">{request.receiver.name}</span></p></div>

        <div className="mt-4 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Message</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.message || 'No message included.'}</p></div>

        {request.peer.email && (
          <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-teal-600">Contact disclosed</p><a href={`mailto:${request.peer.email}`} className="mt-1 block break-all font-bold text-teal-800 underline decoration-teal-300 decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">{request.peer.email}</a><p className="mt-2 text-xs leading-5 text-teal-700">SkillSwap uses direct contact after acceptance—there is no in-app chat.</p></div>
        )}

        {type === 'incoming' && request.status === 'PENDING' && (
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5"><button type="button" disabled={mutationsDisabled} onClick={() => void onDecision(request.id, 'DECLINED')} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 outline-none hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50">{isMutating ? 'Updating…' : 'Decline'}</button><button type="button" disabled={mutationsDisabled} onClick={() => void onDecision(request.id, 'ACCEPTED')} className="min-h-11 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 outline-none hover:bg-teal-700 focus-visible:ring-4 focus-visible:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-50">{isMutating ? 'Updating…' : 'Accept'}</button></div>
        )}

        {request.status === 'ACCEPTED' && <button type="button" onClick={onSchedule} className="mt-6 min-h-11 w-full rounded-xl bg-coral-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-coral-500/20 outline-none hover:bg-coral-400 focus-visible:ring-4 focus-visible:ring-coral-100">Schedule Session</button>}
      </div>
    </li>
  )
}

function DirectionTab({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-11 rounded-xl px-5 py-2.5 text-sm font-extrabold outline-none transition focus-visible:ring-4 focus-visible:ring-teal-100 ${selected ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-ink'}`}>{label}</button>
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const styles = status === 'ACCEPTED' ? 'bg-teal-100 text-teal-700' : status === 'DECLINED' ? 'bg-slate-100 text-slate-600' : 'bg-coral-100 text-coral-500'
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold capitalize ${styles}`}>{status.toLowerCase()}</span>
}

function SkillFact({ label, value, tone }: { label: string; value: string; tone: 'teal' | 'coral' }) {
  return <div className={`min-w-0 rounded-2xl p-4 ${tone === 'teal' ? 'bg-teal-50' : 'bg-coral-100/60'}`}><dt className={`text-xs font-bold uppercase tracking-wider ${tone === 'teal' ? 'text-teal-600' : 'text-coral-500'}`}>{label}</dt><dd className="mt-1 break-words font-extrabold text-ink">{value}</dd></div>
}

function EmptyRequests({ type, status, onClear }: { type: RequestType; status: RequestStatus | undefined; onClear: () => void }) {
  return <div className="grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-teal-200 bg-white/70 p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-2xl text-teal-700" aria-hidden="true">↔</span><h2 className="mt-5 text-xl font-extrabold">No {type} requests{status ? ` marked ${status.toLowerCase()}` : ''}</h2><p className="mt-2 max-w-md leading-7 text-slate-500">{type === 'incoming' ? 'New requests from other students will appear here.' : 'Requests you send from peer profiles will appear here.'}</p>{status && <button type="button" onClick={onClear} className="mt-5 font-bold text-teal-700 underline decoration-teal-200 decoration-2 underline-offset-4">Show all {type}</button>}</div></div>
}

function RequestsLoading() {
  return <div role="status" aria-label="Loading requests" className="grid animate-pulse gap-5 xl:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-96 rounded-[2rem] bg-white shadow-md shadow-teal-900/5" />)}</div>
}

function parseRequestType(value: string | null): RequestType {
  return value === 'outgoing' ? 'outgoing' : 'incoming'
}

function parseRequestStatus(value: string | null): RequestStatus | undefined {
  return value === 'PENDING' || value === 'ACCEPTED' || value === 'DECLINED' ? value : undefined
}
