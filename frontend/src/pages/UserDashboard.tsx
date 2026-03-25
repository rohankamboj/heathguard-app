import { useAuthStore } from '@/store/authStore'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { User, Mail, MapPin, Users, Clock, Shield, CheckCircle2 } from 'lucide-react'

const LOC_COLORS: Record<string, string> = {
  US: 'var(--loc-us)',
  IN: 'var(--loc-in)',
  EU: 'var(--loc-eu)',
  AU: 'var(--loc-au)',
}

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
    { icon: Clock, label: 'Last Login', value: user?.last_login ? format(new Date(user.last_login), 'PPpp') : 'First session' },
    { icon: CheckCircle2, label: 'Member Since', value: user?.created_at ? format(new Date(user.created_at), 'PPP') : '—' },
  ]

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          My Dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Your account details and profile information</p>
      </div>

      {/* Profile hero */}
      <Card
        className="mb-6 gap-0 border-[var(--border-bright)] py-6"
        style={{
          background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
        }}
      >
        <CardContent className="flex items-center gap-5 pt-0">
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--accent-glow)', border: '3px solid var(--border-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--accent)',
            flexShrink: 0,
          }}>
            {user?.full_name?.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {user?.full_name}
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge variant={roleToBadgeVariant(role)}>{role ?? '—'}</Badge>
              <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-base)', color: LOC_COLORS[user?.location?.code ?? ''] || 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}>
                {user?.location?.code} · {user?.location?.name}
              </span>
              <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-base)', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}>
                {user?.team?.code} · {user?.team?.name}
              </span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail fields */}
      <Card>
        <CardContent className="pt-0">
          <h3 className="font-heading mb-5 text-sm font-bold tracking-wide text-muted-foreground uppercase">
            Account Details
          </h3>
          <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
            {fields.map(({ icon: Icon, label, value }, i) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 0',
                  borderBottom: i < fields.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 8,
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {value || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
