import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { normalizeApiError } from '../api/errors'
import { searchStudents } from '../api/search'
import { listSkills } from '../api/skills'
import type {
  PaginatedResponse,
  Skill,
  SkillLevel,
  StudentSearchResult,
} from '../api/types'
import { getMatchQuality } from '../utils/match-quality'

const levelValues: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const limitValues = [6, 9, 12, 20]
const fieldClassName = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100'

type CatalogState =
  | { status: 'loading' }
  | { status: 'loaded'; data: Skill[] }
  | { status: 'error'; message: string }

type ResultsState =
  | { key: string; status: 'loading' }
  | { key: string; status: 'loaded'; response: PaginatedResponse<StudentSearchResult> }
  | { key: string; status: 'error'; message: string }

export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [catalogState, setCatalogState] = useState<CatalogState>({ status: 'loading' })
  const [catalogRetry, setCatalogRetry] = useState(0)
  const [resultsRetry, setResultsRetry] = useState(0)
  const [catalogQuery, setCatalogQuery] = useState('')
  const queryKey = searchParams.toString()
  const requestKey = `${queryKey}|retry=${resultsRetry}`
  const [resultsState, setResultsState] = useState<ResultsState>({ key: requestKey, status: 'loading' })

  const selectedSkillId = searchParams.get('skillId') ?? ''
  const selectedLevel = parseLevel(searchParams.get('level'))
  const selectedUnitId = searchParams.get('unitId') ?? ''
  const page = parsePositiveInteger(searchParams.get('page'), 1)
  const limit = parseLimit(searchParams.get('limit'))

  useEffect(() => {
    let cancelled = false
    void listSkills()
      .then((skills) => {
        if (!cancelled) setCatalogState({ status: 'loaded', data: skills })
      })
      .catch((error) => {
        if (!cancelled) setCatalogState({ status: 'error', message: normalizeApiError(error).message })
      })
    return () => {
      cancelled = true
    }
  }, [catalogRetry])

  useEffect(() => {
    let cancelled = false
    void searchStudents({
      ...(selectedSkillId ? { skillId: selectedSkillId } : {}),
      ...(selectedUnitId ? { unitId: selectedUnitId } : {}),
      ...(selectedLevel ? { level: selectedLevel } : {}),
      page,
      limit,
    })
      .then((response) => {
        if (!cancelled) setResultsState({ key: requestKey, status: 'loaded', response })
      })
      .catch((error) => {
        if (!cancelled) setResultsState({ key: requestKey, status: 'error', message: normalizeApiError(error).message })
      })
    return () => {
      cancelled = true
    }
  }, [limit, page, requestKey, selectedLevel, selectedSkillId, selectedUnitId])

  const resultsAreLoading = resultsState.status === 'loading' || resultsState.key !== requestKey
  const catalog = useMemo(() => catalogState.status === 'loaded' ? catalogState.data : [], [catalogState])
  const filteredCatalog = useMemo(() => {
    const normalizedQuery = catalogQuery.trim().toLowerCase()
    if (!normalizedQuery) return catalog
    return catalog.filter((skill) => `${skill.name} ${skill.category}`.toLowerCase().includes(normalizedQuery))
  }, [catalog, catalogQuery])
  const selectedSkill = catalog.find((skill) => skill.id === selectedSkillId)

  function handleFiltersSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    setIfPresent(next, 'skillId', String(formData.get('skillId') ?? ''))
    setIfPresent(next, 'unitId', String(formData.get('unitId') ?? '').trim())
    setIfPresent(next, 'level', String(formData.get('level') ?? ''))
    setIfPresent(next, 'limit', String(formData.get('limit') ?? ''))
    next.set('page', '1')
    setSearchParams(next)
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section aria-labelledby="discover-title" className="space-y-7">
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 px-6 py-9 text-white shadow-xl shadow-teal-900/15 sm:px-9 sm:py-11">
        <div aria-hidden="true" className="absolute -right-12 -top-20 size-60 rounded-full border-[32px] border-white/8" />
        <div className="relative max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-100">Discover your next exchange</p>
          <h1 id="discover-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">What do you want help with?</h1>
          <p className="mt-3 max-w-2xl leading-7 text-teal-50">Choose a skill to find relevant peers, or browse everyone in your institution. Match scores and reasons come directly from SkillSwap.</p>
        </div>
      </header>

      <div className="rounded-[2rem] border border-white bg-white p-5 shadow-xl shadow-teal-900/8 sm:p-7">
        <form key={queryKey} onSubmit={handleFiltersSubmit} className="grid gap-4 lg:grid-cols-[1.4fr_1.2fr_0.8fr_0.7fr_auto] lg:items-end">
          <div>
            <label htmlFor="skill-catalog-search" className="mb-2 block text-sm font-bold">Search skill catalog</label>
            <input id="skill-catalog-search" type="search" value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Try JavaScript or Design" className={fieldClassName} disabled={catalogState.status !== 'loaded'} />
          </div>
          <div>
            <label htmlFor="discover-skill" className="mb-2 block text-sm font-bold">Skill</label>
            <select id="discover-skill" name="skillId" defaultValue={selectedSkillId} className={fieldClassName} disabled={catalogState.status !== 'loaded'}>
              <option value="">Browse all peers</option>
              {filteredCatalog.map((skill) => <option key={skill.id} value={skill.id}>{skill.name} · {skill.category}</option>)}
              {selectedSkill && !filteredCatalog.some((skill) => skill.id === selectedSkill.id) && <option value={selectedSkill.id}>{selectedSkill.name} · {selectedSkill.category}</option>}
            </select>
          </div>
          <div>
            <label htmlFor="discover-level" className="mb-2 block text-sm font-bold">Level</label>
            <select id="discover-level" name="level" defaultValue={selectedLevel ?? ''} className={fieldClassName}>
              <option value="">Any level</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <div>
            <label htmlFor="discover-limit" className="mb-2 block text-sm font-bold">Per page</label>
            <select id="discover-limit" name="limit" defaultValue={String(limit)} className={fieldClassName}>
              {limitValues.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <button type="submit" className="min-h-12 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/20 outline-none transition hover:bg-teal-700 focus-visible:ring-4 focus-visible:ring-teal-200">Search</button>

          <details className="lg:col-span-full">
            <summary className="w-fit cursor-pointer rounded-lg text-sm font-bold text-teal-700 outline-none focus-visible:ring-2 focus-visible:ring-teal-300">More filters</summary>
            <div className="mt-4 max-w-md">
              <label htmlFor="discover-unit" className="mb-2 block text-sm font-bold">Institution unit ID <span className="font-medium text-slate-400">(optional)</span></label>
              <input id="discover-unit" name="unitId" defaultValue={selectedUnitId} placeholder="Enter a unit UUID if you know it" className={fieldClassName} />
              <p className="mt-2 text-xs leading-5 text-slate-500">The current API has no unit directory, so this documented filter accepts a known unit ID without inventing lookup data.</p>
            </div>
          </details>
        </form>

        {catalogState.status === 'error' && (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <p role="alert">Skill catalog unavailable: {catalogState.message}. You can still browse all peers.</p>
            <button type="button" onClick={() => { setCatalogState({ status: 'loading' }); setCatalogRetry((value) => value + 1) }} className="shrink-0 font-bold text-teal-700 underline underline-offset-4">Retry catalog</button>
          </div>
        )}

        {(selectedSkillId || selectedLevel || selectedUnitId) && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active filters</span>
            {selectedSkillId && <FilterPill>{selectedSkill?.name ?? 'Selected skill'}</FilterPill>}
            {selectedLevel && <FilterPill>{capitalize(selectedLevel)}</FilterPill>}
            {selectedUnitId && <FilterPill>Unit ID applied</FilterPill>}
            <button type="button" onClick={() => setSearchParams({})} className="ml-1 rounded-lg text-sm font-bold text-coral-500 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-300">Clear filters</button>
          </div>
        )}
      </div>

      <ResultsHeader state={resultsState} requestKey={requestKey} selectedSkillName={selectedSkill?.name} />

      {resultsAreLoading ? (
        <ResultsLoading />
      ) : resultsState.status === 'error' ? (
        <div className="grid min-h-72 place-items-center rounded-[2rem] border border-red-100 bg-white p-8 text-center">
          <div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-700" aria-hidden="true">!</span><h2 className="mt-5 text-xl font-extrabold">Search couldn’t be completed</h2><p role="alert" className="mt-2 text-slate-600">{resultsState.message}</p><button type="button" onClick={() => setResultsRetry((value) => value + 1)} className="mt-5 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200">Try again</button></div>
        </div>
      ) : resultsState.status === 'loaded' && resultsState.response.data.length === 0 ? (
        <div className="grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-teal-200 bg-white/70 p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-2xl" aria-hidden="true">⌕</span><h2 className="mt-5 text-xl font-extrabold">No peers found</h2><p className="mt-2 max-w-md leading-7 text-slate-500">Try another canonical skill, remove a filter, or browse all peers in your institution.</p><button type="button" onClick={() => setSearchParams({})} className="mt-5 font-bold text-teal-700 underline decoration-teal-200 decoration-2 underline-offset-4">Browse all peers</button></div></div>
      ) : resultsState.status === 'loaded' ? (
        <>
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {resultsState.response.data.map((result) => <PeerCard key={result.profile.id} result={result} />)}
          </ul>
          <Pagination meta={resultsState.response.meta} onPageChange={changePage} />
        </>
      ) : null}

    </section>
  )
}

function PeerCard({ result }: { result: StudentSearchResult }) {
  const quality = getMatchQuality(result.match.score)
  const tone = quality === 'Excellent Match' ? 'bg-teal-100 text-teal-700' : quality === 'Good Match' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800'
  const unitName = result.profile.unit?.name

  return (
    <li className="group flex min-w-0 flex-col overflow-hidden rounded-[2rem] border border-white bg-white shadow-lg shadow-teal-900/7 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="h-2 bg-gradient-to-r from-teal-500 to-coral-400" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-100 text-lg font-black text-teal-700" aria-hidden="true">{result.profile.name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0"><h2 title={result.profile.name} className="truncate text-lg font-extrabold">{result.profile.name}</h2><p title={result.profile.department} className="mt-0.5 truncate text-sm text-slate-500">{result.profile.department}</p></div>
          </div>
          <div className="shrink-0 text-right"><p className="text-2xl font-black text-teal-700">{result.match.score}</p><p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">score</p></div>
        </div>

        <span className={`mt-5 w-fit rounded-full px-3 py-1 text-xs font-extrabold ${tone}`}>{quality}</span>
        <p className="mt-4 line-clamp-3 min-h-18 text-sm leading-6 text-slate-600">{result.profile.bio || 'No bio provided.'}</p>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <InfoFact label="Rating" value={result.profile.averageRating > 0 ? `★ ${result.profile.averageRating}` : 'Not rated'} />
          <InfoFact label="Unit" value={unitName ?? 'Not specified'} />
        </dl>

        {result.offeredSkill ? (
          <div className="mt-4 rounded-2xl bg-teal-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-teal-600">Offers</p><p className="mt-1 font-extrabold text-ink">{result.offeredSkill.name}</p><p className="mt-1 text-xs font-semibold capitalize text-slate-500">{result.offeredSkill.level.toLowerCase()}</p></div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Browse result — no offered skill filter applied.</div>
        )}

        <div className="mt-4 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Why this match</p>
          {result.match.reasons.length > 0 ? <ul className="mt-2 space-y-1.5">{result.match.reasons.slice(0, 2).map((reason) => <li key={reason} className="flex gap-2 text-xs leading-5 text-slate-600"><span className="text-teal-600" aria-hidden="true">✓</span>{reason}</li>)}</ul> : <p className="mt-2 text-xs text-slate-500">No match reasons provided.</p>}
        </div>

        <Link to={`/users/${result.profile.id}`} className="mt-6 flex min-h-11 w-full items-center justify-center rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-bold text-teal-700 outline-none transition hover:bg-teal-50 focus-visible:ring-4 focus-visible:ring-teal-100">View Profile</Link>
      </div>
    </li>
  )
}

function ResultsHeader({ state, requestKey, selectedSkillName }: { state: ResultsState; requestKey: string; selectedSkillName?: string }) {
  const isCurrent = state.key === requestKey
  const meta = isCurrent && state.status === 'loaded' ? state.response.meta : null
  return <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-extrabold tracking-tight">{selectedSkillName ? `${selectedSkillName} matches` : 'Students to discover'}</h2><p className="mt-1 text-sm text-slate-500">{meta ? `${meta.total} ${meta.total === 1 ? 'peer' : 'peers'} found` : 'Searching your institution…'}</p></div>{meta && <p className="text-sm font-semibold text-slate-500">Page {meta.page} of {Math.max(meta.totalPages, 1)}</p>}</div>
}

function Pagination({ meta, onPageChange }: { meta: PaginatedResponse<never>['meta']; onPageChange: (page: number) => void }) {
  if (meta.totalPages <= 1) return null
  const pages = paginationWindow(meta.page, meta.totalPages)
  return <nav aria-label="Search result pages" className="mt-8 flex flex-wrap items-center justify-center gap-2"><button type="button" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Previous</button>{pages.map((pageNumber) => <button key={pageNumber} type="button" aria-current={pageNumber === meta.page ? 'page' : undefined} onClick={() => onPageChange(pageNumber)} className={`size-11 rounded-xl text-sm font-bold ${pageNumber === meta.page ? 'bg-teal-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-teal-50'}`}>{pageNumber}</button>)}<button type="button" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Next</button></nav>
}

function ResultsLoading() {
  return <div role="status" aria-label="Loading search results" className="grid animate-pulse gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[30rem] rounded-[2rem] bg-white shadow-md shadow-teal-900/5" />)}</div>
}

function InfoFact({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-3"><dt className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-bold">{value}</dd></div>
}

function FilterPill({ children }: { children: string }) {
  return <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{children}</span>
}

function parseLevel(value: string | null): SkillLevel | undefined {
  return levelValues.includes(value as SkillLevel) ? value as SkillLevel : undefined
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseLimit(value: string | null) {
  const parsed = parsePositiveInteger(value, 9)
  return limitValues.includes(parsed) ? parsed : 9
}

function setIfPresent(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value)
}

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function paginationWindow(current: number, total: number) {
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}
