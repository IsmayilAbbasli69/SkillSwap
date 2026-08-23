import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { NavIcon, type NavIconName } from './NavIcon'

interface NavigationItem {
  to: string
  label: string
  icon: NavIconName
}

const studentNavigation: NavigationItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/discover', label: 'Discover', icon: 'discover' },
  { to: '/requests', label: 'Requests', icon: 'requests' },
  { to: '/sessions', label: 'Sessions', icon: 'sessions' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
]

export function AppShell() {
  const { user, role, logout } = useAuth()
  const navigation = role === 'ADMIN'
    ? [...studentNavigation, { to: '/admin', label: 'Admin', icon: 'admin' as const }]
    : studentNavigation
  const initial = user?.email.charAt(0).toUpperCase() || 'S'

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream text-ink">
      <a href="#main-content" className="fixed left-4 top-3 z-50 -translate-y-20 rounded-xl bg-ink px-4 py-3 font-bold text-white shadow-xl transition focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-teal-200">Skip to main content</a>
      <header className="sticky top-0 z-30 border-b border-teal-100/80 bg-cream/95 backdrop-blur-lg">
        <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <NavLink to="/dashboard" className="flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-teal-200">
            <span className="grid size-10 place-items-center rounded-2xl bg-teal-600 text-lg font-black text-white shadow-md shadow-teal-600/20" aria-hidden="true">S</span>
            <span className="hidden text-xl font-extrabold tracking-tight sm:inline">SkillSwap</span>
          </NavLink>

          <nav aria-label="Primary navigation" className="mx-auto hidden items-center gap-1 lg:flex">
            {navigation.map((item) => (
              <DesktopNavLink key={item.to} {...item} />
            ))}
          </nav>

          <details className="group relative ml-auto">
            <summary className="flex list-none items-center gap-3 rounded-xl p-1.5 outline-none transition hover:bg-white focus-visible:ring-4 focus-visible:ring-teal-200 [&::-webkit-details-marker]:hidden">
              <span className="grid size-9 place-items-center rounded-full bg-coral-100 font-extrabold text-coral-500" aria-hidden="true">{initial}</span>
              <span className="hidden max-w-44 truncate text-left text-sm font-semibold md:block">{user?.email}</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="hidden size-4 text-slate-500 md:block"><path d="m6 8 4 4 4-4" /></svg>
              <span className="sr-only">Open user menu</span>
            </summary>
            <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-teal-900/10">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Signed in as</p>
                <p className="mt-1 truncate text-sm font-bold">{user?.email}</p>
                {role && <p className="mt-1 text-xs font-semibold text-teal-700">{role}</p>}
              </div>
              <NavLink to="/profile" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">
                <NavIcon name="profile" /> Profile
              </NavLink>
              <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-coral-500 hover:bg-coral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></svg>
                Log out
              </button>
            </div>
          </details>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 outline-none sm:px-6 sm:pt-10 lg:px-8 lg:pb-12">
        <Outlet />
      </main>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-teal-100 bg-white/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(24,49,47,0.08)] backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-xl items-stretch justify-around">
          {navigation.map((item) => (
            <MobileNavLink key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function DesktopNavLink({ to, label, icon }: NavigationItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none transition focus-visible:ring-4 focus-visible:ring-teal-200 ${isActive ? 'bg-teal-100 text-teal-700' : 'text-slate-600 hover:bg-white hover:text-ink'}`}
    >
      <NavIcon name={icon} /> {label}
    </NavLink>
  )
}

function MobileNavLink({ to, label, icon }: NavigationItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[0.65rem] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300 sm:text-xs ${isActive ? 'text-teal-700' : 'text-slate-500'}`}
    >
      {({ isActive }) => (
        <>
          <span className={`grid size-8 place-items-center rounded-xl ${isActive ? 'bg-teal-100' : ''}`}><NavIcon name={icon} /></span>
          <span className="max-w-full truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}
