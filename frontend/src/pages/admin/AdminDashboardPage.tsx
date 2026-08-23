import { useEffect, useState } from 'react'
import { getAdminStats } from '../../api/admin'
import { normalizeApiError } from '../../api/errors'
import type { AdminStats } from '../../api/types'

type StatsState = { status: 'loading' } | { status: 'loaded'; data: AdminStats } | { status: 'error'; message: string }

export function AdminDashboardPage() {
  const [state, setState] = useState<StatsState>({ status: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    void getAdminStats().then((data) => {
      if (!cancelled) setState({ status: 'loaded', data })
    }).catch((error) => {
      if (!cancelled) setState({ status: 'error', message: normalizeApiError(error).message })
    })
    return () => { cancelled = true }
  }, [retry])

  if (state.status === 'loading') return <AdminLoading label="Loading administrator statistics" />
  if (state.status === 'error') return <AdminError title="Statistics couldn’t be loaded" message={state.message} onRetry={() => setRetry((value) => value + 1)} />

  const stats = state.data
  return (
    <div className="space-y-7">
      <div><h2 className="text-2xl font-extrabold tracking-tight">Platform overview</h2><p className="mt-2 text-slate-500">Current institution-level totals returned by the administration API.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total students" value={stats.students.total} accent="teal" /><StatCard label="Active students" value={stats.students.active} accent="green" /><StatCard label="Total requests" value={stats.requests.total} accent="coral" /><StatCard label="Completed sessions" value={stats.sessions.completed} accent="blue" /></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <BreakdownCard title="Request outcomes" items={[{ label: 'Accepted', value: stats.requests.accepted, color: 'bg-teal-500' }, { label: 'Pending', value: stats.requests.pending, color: 'bg-coral-400' }, { label: 'Declined', value: stats.requests.declined, color: 'bg-slate-400' }]} total={stats.requests.total} />
        <BreakdownCard title="Session progress" items={[{ label: 'Scheduled', value: stats.sessions.scheduled, color: 'bg-coral-400' }, { label: 'Completed', value: stats.sessions.completed, color: 'bg-teal-500' }]} total={stats.sessions.scheduled + stats.sessions.completed} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2"><SkillRanking title="Top wanted skills" items={stats.topWantedSkills} tone="coral" /><SkillRanking title="Top offered skills" items={stats.topOfferedSkills} tone="teal" /></div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: 'teal' | 'green' | 'coral' | 'blue' }) {
  const classes = { teal: 'bg-teal-100 text-teal-700', green: 'bg-emerald-50 text-emerald-700', coral: 'bg-coral-100 text-coral-500', blue: 'bg-blue-50 text-blue-700' }
  return <article className="rounded-[1.5rem] border border-white bg-white p-5 shadow-md shadow-teal-900/5"><span className={`inline-flex rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wider ${classes[accent]}`}>{label}</span><p className="mt-4 text-4xl font-black tracking-tight">{value}</p></article>
}

function BreakdownCard({ title, items, total }: { title: string; items: Array<{ label: string; value: number; color: string }>; total: number }) {
  return <article className="rounded-[2rem] border border-white bg-white p-6 shadow-lg shadow-teal-900/6"><h3 className="text-xl font-extrabold">{title}</h3><div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">{total > 0 && <div className="flex h-full">{items.map((item) => <span key={item.label} className={item.color} style={{ width: `${(item.value / total) * 100}%` }} />)}</div>}</div><dl className="mt-5 grid gap-3 sm:grid-cols-3">{items.map((item) => <div key={item.label} className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-500">{item.label}</dt><dd className="mt-1 text-2xl font-black">{item.value}</dd></div>)}</dl></article>
}

function SkillRanking({ title, items, tone }: { title: string; items: Array<{ skill: string; count: number }>; tone: 'teal' | 'coral' }) {
  const maximum = Math.max(...items.map((item) => item.count), 1)
  return <article className="rounded-[2rem] border border-white bg-white p-6 shadow-lg shadow-teal-900/6"><h3 className="text-xl font-extrabold">{title}</h3>{items.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No skill statistics available.</p> : <ol className="mt-5 space-y-4">{items.map((item, index) => <li key={item.skill}><div className="flex items-center justify-between gap-4 text-sm"><span className="min-w-0 truncate font-bold"><span className="mr-2 text-slate-400">{index + 1}.</span>{item.skill}</span><span className="font-black">{item.count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone === 'teal' ? 'bg-teal-500' : 'bg-coral-400'}`} style={{ width: `${(item.count / maximum) * 100}%` }} /></div></li>)}</ol>}</article>
}

function AdminLoading({ label }: { label: string }) {
  return <div role="status" aria-label={label} className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-40 rounded-[1.5rem] bg-white" />)}</div>
}

function AdminError({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return <div className="grid min-h-72 place-items-center rounded-[2rem] border border-red-100 bg-white p-8 text-center"><div><h2 className="text-xl font-extrabold">{title}</h2><p role="alert" className="mt-2 text-slate-600">{message}</p><button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white">Try again</button></div></div>
}
