import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { StatCard } from '@/components/shared/stat-card'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import UsersTable from '@/components/dashboard/UsersTable'
import { LOCATION_BG_CLASS, LOCATION_TEXT_CLASS } from '@/lib/location-classes'
import { cn } from '@/lib/utils'
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
    <div className="mx-auto max-w-[1280px] animate-fade-in-hg flex flex-col gap-4">
      {/* Header */}
      <div className="">
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-[10px] border border-line-accent bg-brand-accent-glow p-2">
            <Shield className="size-5 text-brand-accent" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-[28px] font-extrabold tracking-tight text-fg-primary">
              Admin Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-fg-secondary">
              Welcome back, {user?.full_name} — full system overview
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className=" grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <StatCard
          label="Total Users"
          value={statsLoading ? '—' : stats?.total_users ?? 0}
          icon={Users}
          iconTone="accent"
        />
        <StatCard
          label="Active Users"
          value={statsLoading ? '—' : stats?.active_users ?? 0}
          icon={UserCheck}
          iconTone="success"
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
          iconTone="info"
        />
        <StatCard
          label="Teams"
          value={statsLoading ? '—' : Object.keys(stats?.teams || {}).length}
          icon={Activity}
          iconTone="admin"
        />
      </div>

      {/* Breakdowns */}
      {stats && (
        <div className=" grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {/* By Role */}
          <Card>
            <CardContent className="pt-0">
              <h3 className="font-heading mb-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Users by Role
              </h3>
              <div className="flex flex-col gap-2">
              {Object.entries(stats.roles || {}).map(([role, count]) => (
                <div
                  key={role}
                  className="flex items-center justify-between border-b border-border py-2.5 last:border-0"
                >
                  <Badge variant={roleToBadgeVariant(role)}>{role}</Badge>
                  <span className="font-heading text-xl font-bold text-foreground">{count}</span>
                </div>
              ))}
              </div>
            </CardContent>
          </Card>

          {/* By Location */}
          <Card>
            <CardContent className="pt-0">
              <h3 className="font-heading mb-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Users by Location
              </h3>
            {Object.entries(stats.locations || {}).map(([loc, count]) => {
              const total = stats.total_users || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={loc} className="mb-3.5">
                  <div className="mb-1.5 flex justify-between">
                    <span
                      className={cn(
                        'text-[13px] font-semibold',
                        LOCATION_TEXT_CLASS[loc] ?? 'text-fg-secondary',
                      )}
                    >
                      {loc}
                    </span>
                    <span className="text-[13px] text-fg-muted">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-sm bg-surface-elevated">
                    <div
                      className={cn(
                        'h-full rounded-sm transition-[width] duration-500 ease-out',
                        LOCATION_BG_CLASS[loc] ?? 'bg-brand-accent',
                      )}
                      style={{ width: `${pct}%` }}
                    />
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
