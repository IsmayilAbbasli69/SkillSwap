import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listAdminStudents, updateStudentStatus } from '../../api/admin'
import { normalizeApiError } from '../../api/errors'
import type { AdminStudent, PaginatedResponse, UserStatus } from '../../api/types'

type StudentsState = { key: string; status: 'loading' } | { key: string; status: 'loaded'; response: PaginatedResponse<AdminStudent> } | { key: string; status: 'error'; message: string }
const fieldClassName = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100'

export function AdminStudentsPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const status = parseStatus(params.get('status'))
  const page = positiveInteger(params.get('page'), 1)
  const limit = positiveInteger(params.get('limit'), 20)
  const [retry, setRetry] = useState(0)
  const key = `${search}|${status ?? 'ALL'}|${page}|${limit}|${retry}`
  const [state, setState] = useState<StudentsState>({ key, status: 'loading' })
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void listAdminStudents({ ...(search ? { search } : {}), ...(status ? { status } : {}), page, limit }).then((response) => {
      if (!cancelled) setState({ key, status: 'loaded', response })
    }).catch((error) => {
      if (!cancelled) setState({ key, status: 'error', message: normalizeApiError(error).message })
    })
    return () => { cancelled = true }
  }, [key, limit, page, search, status])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    const nextSearch = String(data.get('search') ?? '').trim()
    const nextStatus = String(data.get('status') ?? '')
    if (nextSearch) next.set('search', nextSearch)
    if (nextStatus) next.set('status', nextStatus)
    next.set('page', '1')
    next.set('limit', String(data.get('limit') ?? 20))
    setParams(next)
  }

  async function handleStatusChange(student: AdminStudent) {
    if (mutatingId) return
    const nextStatus: UserStatus = student.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    if (nextStatus === 'DISABLED' && !window.confirm(`Disable ${student.name}? They will no longer have active student access.`)) return
    setMutatingId(student.id)
    setMutationError(null)
    try {
      await updateStudentStatus(student.id, { status: nextStatus })
      setState((current) => current.status === 'loaded' ? { ...current, response: { ...current.response, data: current.response.data.map((item) => item.id === student.id ? { ...item, status: nextStatus } : item).filter((item) => !status || item.status === status) } } : current)
      setRetry((value) => value + 1)
    } catch (error) {
      setMutationError(normalizeApiError(error).message)
    } finally {
      setMutatingId(null)
    }
  }

  const loading = state.status === 'loading' || state.key !== key
  const response = state.status === 'loaded' && state.key === key ? state.response : null
  return <div className="space-y-6"><div><h2 className="text-2xl font-extrabold">Student management</h2><p className="mt-2 text-slate-500">Search students and control active access using documented account statuses.</p></div><form key={key.replace(`|${retry}`, '')} onSubmit={handleSearch} className="grid gap-3 rounded-[2rem] border border-white bg-white p-5 shadow-md shadow-teal-900/5 sm:grid-cols-[1fr_0.7fr_0.45fr_auto] sm:items-end"><div><label htmlFor="admin-student-search" className="mb-2 block text-sm font-bold">Search</label><input id="admin-student-search" name="search" type="search" defaultValue={search} placeholder="Student name" className={fieldClassName} /></div><div><label htmlFor="admin-student-status" className="mb-2 block text-sm font-bold">Status</label><select id="admin-student-status" name="status" defaultValue={status ?? ''} className={fieldClassName}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option></select></div><div><label htmlFor="admin-student-limit" className="mb-2 block text-sm font-bold">Per page</label><select id="admin-student-limit" name="limit" defaultValue={String(limit)} className={fieldClassName}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></div><button type="submit" className="min-h-12 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white">Apply</button></form>{mutationError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{mutationError}</p>}{loading ? <TableLoading /> : state.status === 'error' ? <PageError message={state.message} onRetry={() => setRetry((value) => value + 1)} /> : response && response.data.length === 0 ? <EmptyStudents /> : response ? <><div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-lg shadow-teal-900/6"><div className="overflow-x-auto"><table className="w-full min-w-[42rem] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4">Student</th><th className="px-6 py-4">Unit ID</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{response.data.map((student) => <tr key={student.id}><td className="px-6 py-4 font-bold">{student.name}</td><td className="max-w-64 truncate px-6 py-4 font-mono text-xs text-slate-500">{student.unit}</td><td className="px-6 py-4"><StatusBadge status={student.status} /></td><td className="px-6 py-4 text-right"><button type="button" disabled={mutatingId !== null} onClick={() => void handleStatusChange(student)} className={`rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50 ${student.status === 'ACTIVE' ? 'border border-red-200 text-red-700 hover:bg-red-50' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>{mutatingId === student.id ? 'Updating…' : student.status === 'ACTIVE' ? 'Disable' : 'Enable'}</button></td></tr>)}</tbody></table></div></div><Pagination page={response.meta.page} totalPages={response.meta.totalPages} total={response.meta.total} onPage={(nextPage) => { const next = new URLSearchParams(params); next.set('page', String(nextPage)); setParams(next) }} /></> : null}</div>
}

function StatusBadge({ status }: { status: UserStatus }) { return <span className={`rounded-full px-3 py-1 text-xs font-bold ${status === 'ACTIVE' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>{status}</span> }
function Pagination({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (page: number) => void }) { return <div className="flex items-center justify-between gap-4"><p className="text-sm text-slate-500">{total} students · Page {page} of {Math.max(totalPages, 1)}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Previous</button><button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40">Next</button></div></div> }
function parseStatus(value: string | null): UserStatus | undefined { return value === 'ACTIVE' || value === 'DISABLED' ? value : undefined }
function positiveInteger(value: string | null, fallback: number) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback }
function TableLoading() { return <div role="status" aria-label="Loading students" className="h-96 animate-pulse rounded-[2rem] bg-white" /> }
function EmptyStudents() { return <div className="grid min-h-64 place-items-center rounded-[2rem] border border-dashed border-teal-200 bg-white/70 p-8 text-center"><div><h3 className="text-xl font-extrabold">No students found</h3><p className="mt-2 text-slate-500">Try a different search or status filter.</p></div></div> }
function PageError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="rounded-[2rem] border border-red-100 bg-white p-8 text-center"><p role="alert" className="text-red-800">{message}</p><button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white">Try again</button></div> }
