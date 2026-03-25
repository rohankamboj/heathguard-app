import type { ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/shared/AppLayout'
import LoginPage from '@/components/auth/LoginPage'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminUsersPage from '@/pages/AdminUsersPage'
import ManagerDashboard from '@/pages/ManagerDashboard'
import PatientsPage from '@/pages/PatientsPage'
import UserDashboard from '@/pages/UserDashboard'

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role?.name
  if (!role || !roles.includes(role)) return <Navigate to={`/${role || 'login'}`} replace />
  return children
}

function RoleRedirect() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role?.name
  if (role === 'admin') return <Navigate to="/admin" replace />
  if (role === 'manager') return <Navigate to="/manager" replace />
  return <Navigate to="/user" replace />
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <RoleRedirect /> : <LoginPage />}
      />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireRole roles={['admin']}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireRole roles={['admin']}>
              <AppLayout>
                <AdminUsersPage />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/manager"
        element={
          <RequireAuth>
            <RequireRole roles={['manager']}>
              <AppLayout>
                <ManagerDashboard />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/manager/patients"
        element={
          <RequireAuth>
            <RequireRole roles={['manager']}>
              <AppLayout>
                <PatientsPage />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/user"
        element={
          <RequireAuth>
            <RequireRole roles={['user']}>
              <AppLayout>
                <UserDashboard />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={isAuthenticated ? <RoleRedirect /> : <Navigate to="/login" replace />}
      />

      <Route
        path="*"
        element={
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              background: 'var(--bg-base)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 80,
                fontWeight: 800,
                color: 'var(--border-bright)',
                lineHeight: 1,
              }}
            >
              404
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Page not found</p>
            <a
              href="/"
              style={{
                color: 'var(--accent)',
                fontSize: 14,
                textDecoration: 'none',
                border: '1px solid var(--border-accent)',
                padding: '8px 20px',
                borderRadius: 'var(--radius)',
              }}
            >
              Go home
            </a>
          </div>
        }
      />
    </Routes>
  )
}
