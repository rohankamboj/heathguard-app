import { useAuthStore } from '../store/authStore'
import { Card, Badge } from '../components/shared/UI'
import { format } from 'date-fns'
import { User, Mail, MapPin, Users, Clock, Shield, CheckCircle2 } from 'lucide-react'

const LOC_COLORS = { US: 'var(--loc-us)', IN: 'var(--loc-in)', EU: 'var(--loc-eu)', AU: 'var(--loc-au)' }
const ROLE_BADGE = { admin: 'admin', manager: 'manager', user: 'user' }

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
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-card) 100%)', border: '1px solid var(--border-bright)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
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
              <Badge variant={ROLE_BADGE[role]}>{role}</Badge>
              <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-base)', color: LOC_COLORS[user?.location?.code] || 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}>
                {user?.location?.code} · {user?.location?.name}
              </span>
              <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-base)', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}>
                {user?.team?.code} · {user?.team?.name}
              </span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail fields */}
      <Card>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
          Account Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0 }}>
          {fields.map(({ icon: Icon, label, value }, i) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 0',
              borderBottom: i < fields.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 8, color: 'var(--accent)', flexShrink: 0 }}>
                <Icon size={14} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
