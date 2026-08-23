import { NavLink, Outlet } from 'react-router-dom'

const adminNavigation = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/students', label: 'Students', end: false },
  { to: '/admin/skills', label: 'Skills', end: false },
]

export function AdminLayout() {
  return (
    <section className="space-y-7">
      <header className="rounded-[2rem] bg-gradient-to-br from-ink to-teal-800 px-6 py-8 text-white shadow-xl shadow-teal-900/15 sm:px-8"><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-200">Institution administration</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Admin workspace</h1><p className="mt-3 max-w-2xl leading-7 text-teal-50">Manage students, maintain the skill catalog, and monitor real platform activity.</p></header>
      <nav aria-label="Administration" className="flex gap-2 overflow-x-auto rounded-2xl border border-white bg-white p-2 shadow-md shadow-teal-900/5">{adminNavigation.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `min-h-11 shrink-0 rounded-xl px-5 py-3 text-sm font-extrabold outline-none transition focus-visible:ring-4 focus-visible:ring-teal-100 ${isActive ? 'bg-teal-100 text-teal-800' : 'text-slate-500 hover:bg-slate-50 hover:text-ink'}`}>{item.label}</NavLink>)}</nav>
      <Outlet />
    </section>
  )
}
