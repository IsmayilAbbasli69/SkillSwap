import type { ReactNode } from 'react'

interface ProfileIdentityCardProps {
  firstName: string
  lastName: string
  avatarUrl: string | null
  secondaryText: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
  titleId?: string
}

export function ProfileIdentityCard({ firstName, lastName, avatarUrl, secondaryText, eyebrow, action, children, titleId }: ProfileIdentityCardProps) {
  const fullName = `${firstName} ${lastName}`.trim()
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-xl shadow-teal-900/8">
      <div className="h-24 bg-gradient-to-r from-teal-600 via-teal-500 to-teal-200 sm:h-28" />
      <div className="px-5 pb-7 sm:px-8 sm:pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-10 flex min-w-0 items-end gap-4 sm:-mt-12">
            <div className="grid size-20 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-coral-100 text-2xl font-black text-coral-500 shadow-md sm:size-24 sm:text-3xl">
              {avatarUrl ? <img src={avatarUrl} alt={`${fullName} profile`} className="size-full object-cover" /> : <span className="place-self-center" aria-label={`${fullName} initials`}>{initials}</span>}
            </div>
            <div className="min-w-0 pb-1">
              {eyebrow && <p className="text-xs font-bold uppercase tracking-wider text-teal-600 sm:text-sm">{eyebrow}</p>}
              <h2 id={titleId} title={fullName} className="break-words text-2xl font-extrabold tracking-tight sm:text-3xl">{fullName}</h2>
              <p className="mt-1 break-words text-sm font-medium text-slate-500">{secondaryText}</p>
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </div>
    </article>
  )
}
