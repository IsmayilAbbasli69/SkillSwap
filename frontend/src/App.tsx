import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AdminRoute } from './auth/AdminRoute'
import { PublicOnlyRoute } from './auth/PublicOnlyRoute'
import { AppShell } from './components/AppShell'
import { AdminLayout } from './components/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminSkillsPage } from './pages/admin/AdminSkillsPage'
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage'
import { DashboardPage } from './pages/DashboardPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { LoginPage } from './pages/LoginPage'
import { PeerProfilePage } from './pages/PeerProfilePage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { RequestsPage } from './pages/RequestsPage'
import { SessionsPage } from './pages/SessionsPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:userId" element={<PeerProfilePage />} />
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/students" element={<AdminStudentsPage />} />
              <Route path="/admin/skills" element={<AdminSkillsPage />} />
            </Route>
          </Route>
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
