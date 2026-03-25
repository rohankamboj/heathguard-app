import { Badge } from '../shared/UI'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Lock } from 'lucide-react'

const LOC_COLORS = { US: 'var(--loc-us)', IN: 'var(--loc-in)', EU: 'var(--loc-eu)', AU: 'var(--loc-au)' }
const ROLE_BADGE = { admin: 'admin', manager: 'manager', user: 'user' }

export default function UsersTable({ users = [], loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ height: 56, borderRadius: 'var(--radius)', background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    )
  }

  if (!users.length) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No users found</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
            {['Name', 'Username', 'Email', 'Role', 'Location', 'Team', 'Status', 'Last Login'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={user.id}
              style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
            >
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-glow)', border: '1px solid var(--border-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--accent)',
                  }}>
                    {user.full_name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{user.full_name}</span>
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>@{user.username}</span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.email}</span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <Badge variant={ROLE_BADGE[user.role?.name]}>{user.role?.name}</Badge>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: LOC_COLORS[user.location?.code] || 'var(--text-secondary)' }}>
                  {user.location?.code}
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>· {user.location?.name}</span>
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontWeight: 600 }}>
                  {user.team?.code}
                </span>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {user.is_locked ? (
                    <><Lock size={13} color="var(--warning)" /><span style={{ fontSize: 12, color: 'var(--warning)' }}>Locked</span></>
                  ) : user.is_active ? (
                    <><CheckCircle2 size={13} color="var(--success)" /><span style={{ fontSize: 12, color: 'var(--success)' }}>Active</span></>
                  ) : (
                    <><XCircle size={13} color="var(--text-muted)" /><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Inactive</span></>
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {user.last_login ? format(new Date(user.last_login), 'MMM d, HH:mm') : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
