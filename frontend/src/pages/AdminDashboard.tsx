import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { StatCard } from '@/components/shared/stat-card'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import UsersTable from '@/components/dashboard/UsersTable'
import { Users, UserCheck, Globe, Shield, Activity } from 'lucide-react'

function roleToBadgeVariant(role: string): BadgeVariant {
  const r = role.toLowerCase()
  if (r === 'admin' || r === 'manager' || r === 'user') return r
  return 'default'
}

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
          trend={
            stats && stats.total_users > 0
              ? `${Math.round((stats.active_users / stats.total_users) * 100)}% active rate`
              : ''
          }
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
            <CardContent className="pt-0">
              <h3 className="font-heading mb-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Users by Role
              </h3>
              {Object.entries(stats.roles || {}).map(([role, count]) => (
                <div
                  key={role}
                  className="flex items-center justify-between border-b border-border py-2.5 last:border-0"
                >
                  <Badge variant={roleToBadgeVariant(role)}>{role}</Badge>
                  <span className="font-heading text-xl font-bold text-foreground">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* By Location */}
          <Card>
            <CardContent className="pt-0">
              <h3 className="font-heading mb-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Users by Location
              </h3>
            {Object.entries(stats.locations || {}).map(([loc, count]) => {
              const colors: Record<string, string> = {
                US: 'var(--loc-us)',
                IN: 'var(--loc-in)',
                EU: 'var(--loc-eu)',
                AU: 'var(--loc-au)',
              }
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
            </CardContent>
          </Card>

          {/* By Team */}
          <Card>
            <CardContent className="pt-0">
              <h3 className="font-heading mb-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Users by Team
              </h3>
              {Object.entries(stats.teams || {}).map(([team, count]) => (
                <div
                  key={team}
                  className="flex items-center justify-between border-b border-border py-2.5 last:border-0"
                >
                  <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {team}
                  </span>
                  <span className="font-heading text-xl font-bold text-foreground">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Users Table */}
      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">All Users</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {users.length} total users across all locations
            </p>
          </div>
        </div>
        <div className="p-0">
          <UsersTable users={users} loading={usersLoading} />
        </div>
      </Card>
    </div>
  )
}
