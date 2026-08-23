import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth-context'

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}
