import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { StatCard, Card, Badge } from '../components/shared/UI'
import UsersTable from '../components/dashboard/UsersTable'
import { Users, UserCheck, Globe, Shield, Activity } from 'lucide-react'

export default function AdminDashboard() {
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
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: 8 }}>
            <Shield size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
              Welcome back, {user?.full_name} — full system overview
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard
          label="Total Users"
          value={statsLoading ? '—' : stats?.total_users ?? 0}
          icon={Users}
          color="var(--accent)"
        />
        <StatCard
          label="Active Users"
          value={statsLoading ? '—' : stats?.active_users ?? 0}
          icon={UserCheck}
          color="var(--success)"
          trend={stats ? `${Math.round((stats.active_users / stats.total_users) * 100)}% active rate` : ''}
        />
        <StatCard
          label="Locations"
          value={statsLoading ? '—' : Object.keys(stats?.locations || {}).length}
          icon={Globe}
          color="var(--info)"
        />
        <StatCard
          label="Teams"
          value={statsLoading ? '—' : Object.keys(stats?.teams || {}).length}
          icon={Activity}
          color="var(--role-admin)"
        />
      </div>

      {/* Breakdowns */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
          {/* By Role */}
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Users by Role
            </h3>
            {Object.entries(stats.roles || {}).map(([role, count]) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <Badge variant={role}>{role}</Badge>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>{count}</span>
              </div>
            ))}
          </Card>

          {/* By Location */}
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Users by Location
            </h3>
            {Object.entries(stats.locations || {}).map(([loc, count]) => {
              const colors = { US: 'var(--loc-us)', IN: 'var(--loc-in)', EU: 'var(--loc-eu)', AU: 'var(--loc-au)' }
              const total = stats.total_users || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={loc} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors[loc] || 'var(--text-secondary)' }}>{loc}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colors[loc] || 'var(--accent)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </Card>

          {/* By Team */}
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Users by Team
            </h3>
            {Object.entries(stats.teams || {}).map(([team, count]) => (
              <div key={team} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontWeight: 600 }}>{team}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>{count}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* All Users Table */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>All Users</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{users.length} total users across all locations</p>
          </div>
        </div>
        <div style={{ padding: '0' }}>
          <UsersTable users={users} loading={usersLoading} />
        </div>
      </Card>
    </div>
  )
}
