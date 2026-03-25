import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { StatCard, Card } from '../components/shared/UI'
import UsersTable from '../components/dashboard/UsersTable'
import { Users, UserCheck, FileSpreadsheet, Activity, Database } from 'lucide-react'

export default function ManagerDashboard() {
  const user = useAuthStore((s) => s.user)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data),
  })

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => dashboardApi.users().then(r => r.data),
  })

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Manager Dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          {user?.location?.name} ({user?.location?.code}) · {user?.team?.name} team
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Location Users" value={statsLoading ? '—' : stats?.total_users ?? 0} icon={Users} color="var(--accent)" />
        <StatCard label="Active Users" value={statsLoading ? '—' : stats?.active_users ?? 0} icon={UserCheck} color="var(--success)" />
        <StatCard label="My Patients" value={statsLoading ? '—' : stats?.my_patients ?? 0} icon={Database} color="var(--role-admin)" />
        <StatCard label="Total Uploads" value={statsLoading ? '—' : stats?.recent_uploads ?? 0} icon={FileSpreadsheet} color="var(--info)" />
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {user?.location?.name} Team
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Users within your location scope
          </p>
        </div>
        <UsersTable users={users} loading={usersLoading} />
      </Card>
    </div>
  )
}
