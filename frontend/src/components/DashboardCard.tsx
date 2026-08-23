import type { PropsWithChildren, ReactNode } from 'react'

interface DashboardCardProps extends PropsWithChildren {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function DashboardCard({ title, description, action, className = '', children }: DashboardCardProps) {
  return (
    <article className={`rounded-[2rem] border border-white bg-white p-5 shadow-lg shadow-teal-900/6 sm:p-6 ${className}`}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
        </div>
        {action}
      </header>
      <div className="mt-5">{children}</div>
    </article>
  )
}

export function DashboardCardLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="animate-pulse rounded-[2rem] border border-white bg-white p-6 shadow-lg shadow-teal-900/6">
      <div className="h-5 w-36 rounded bg-teal-100" />
      <div className="mt-5 h-20 rounded-2xl bg-slate-100" />
      <div className="mt-3 h-12 rounded-2xl bg-slate-50" />
    </div>
  )
}

export function DashboardSectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
      <p role="alert" className="text-sm leading-6 text-red-800">{message}</p>
      <button type="button" onClick={onRetry} className="mt-2 rounded-lg text-sm font-bold text-teal-700 underline decoration-teal-300 decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">Try again</button>
    </div>
  )
}
