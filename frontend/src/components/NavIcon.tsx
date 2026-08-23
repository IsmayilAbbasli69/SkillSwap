export type NavIconName = 'dashboard' | 'discover' | 'requests' | 'sessions' | 'profile' | 'admin'

interface NavIconProps {
  name: NavIconName
}

export function NavIcon({ name }: NavIconProps) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    discover: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /><path d="m13.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    requests: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /><path d="M8 9h8M8 13h5" /></>,
    sessions: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="m9 16 2 2 4-5" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    admin: <><path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">
      {paths[name]}
    </svg>
  )
}
