import { useAuthStore } from '@/store/authStore'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { User, Mail, MapPin, Users, Clock, Shield, CheckCircle2 } from 'lucide-react'

import { locationTextClass } from '@/lib/location-classes'
import { cn } from '@/lib/utils'

function roleToBadgeVariant(name?: string): BadgeVariant {
  const n = name?.toLowerCase()
  if (n === 'admin' || n === 'manager' || n === 'user') return n
  return 'default'
}

export default function UserDashboard() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role?.name

  const fields = [
    { icon: User, label: 'Full Name', value: user?.full_name },
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Shield, label: 'Username', value: `@${user?.username}` },
    { icon: MapPin, label: 'Location', value: `${user?.location?.name} (${user?.location?.code})` },
    { icon: Users, label: 'Team', value: `${user?.team?.name} (${user?.team?.code})` },
    {
      icon: Clock,
      label: 'Last Login',
      value: user?.last_login ? format(new Date(user.last_login), 'PPpp') : 'First session',
    },
    {
      icon: CheckCircle2,
      label: 'Member Since',
      value: user?.created_at ? format(new Date(user.created_at), 'PPP') : '—',
    },
  ]

  return (
    <div className="mx-auto max-w-[800px] animate-fade-in-hg">
      <div className="mb-8">
        <h1 className="font-display text-[28px] font-extrabold tracking-tight text-fg-primary">
          My Dashboard
        </h1>
        <p className="mt-1 text-sm text-fg-secondary">
          Your account details and profile information
        </p>
      </div>

      <Card
        className={cn(
          'mb-6 gap-0 border-line-bright py-6',
          'bg-[linear-gradient(135deg,var(--bg-elevated)_0%,var(--bg-card)_100%)]',
        )}
      >
        <CardContent className="flex items-center gap-5 pt-0">
          <div className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-[3px] border-line-accent bg-brand-accent-glow font-display text-[28px] font-extrabold text-brand-accent">
            {user?.full_name?.charAt(0)}
          </div>
          <div>
            <h2 className="mb-2 font-display text-[22px] font-extrabold tracking-tight text-fg-primary">
              {user?.full_name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant={roleToBadgeVariant(role)}>{role ?? '—'}</Badge>
              <span
                className={cn(
                  'rounded-full-hg border border-line bg-surface-base px-2.5 py-0.5 font-body text-xs font-semibold',
                  locationTextClass(user?.location?.code),
                )}
              >
                {user?.location?.code} · {user?.location?.name}
              </span>
              <span className="rounded-full-hg border border-line bg-surface-base px-2.5 py-0.5 font-body text-xs font-semibold text-fg-secondary">
                {user?.team?.code} · {user?.team?.name}
              </span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-0">
          <h3 className="font-heading mb-5 text-sm font-bold tracking-wide text-muted-foreground uppercase">
            Account Details
          </h3>
          <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
            {fields.map(({ icon: Icon, label, value }, i) => (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-3.5 py-3.5',
                  i < fields.length - 1 && 'border-b border-line',
                )}
              >
                <div className="shrink-0 rounded-md border border-line bg-surface-elevated p-2 text-brand-accent">
                  <Icon className="size-3.5" aria-hidden />
                </div>
                <div>
                  <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-fg-muted uppercase">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-fg-primary">{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
