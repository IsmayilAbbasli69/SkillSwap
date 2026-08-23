import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth-context'

export function AdminRoute() {
  const { role, isRoleLoading } = useAuth()

  if (isRoleLoading) {
    return <div role="status" aria-label="Checking administrator access" className="grid min-h-[60vh] place-items-center"><div className="text-center"><span className="mx-auto block size-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" aria-hidden="true" /><p className="mt-4 text-sm font-semibold text-slate-500">Checking administrator access…</p></div></div>
  }

  return role === 'ADMIN' ? <Outlet /> : <Navigate to="/dashboard" replace />
}
