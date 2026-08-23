interface FeedbackBannerProps {
  tone: 'success' | 'error' | 'warning' | 'info'
  message: string
  onDismiss?: () => void
}

export function FeedbackBanner({ tone, message, onDismiss }: FeedbackBannerProps) {
  const classes = {
    success: 'border-teal-200 bg-teal-50 text-teal-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-950',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
  }

  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-4 rounded-2xl border px-5 py-4 text-sm font-medium ${classes[tone]}`}>
      <span className="min-w-0 break-words">{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss message" className="-mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-lg leading-none hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">×</button>
      )}
    </div>
  )
}
