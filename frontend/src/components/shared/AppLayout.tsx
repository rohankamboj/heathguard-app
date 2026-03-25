import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import type { User } from '@/types'
import {
  Shield,
  LayoutDashboard,
  UserCog,
  LogOut,
  ChevronRight,
  Menu,
  X,
  FileSpreadsheet,
} from 'lucide-react'
import toast from 'react-hot-toast'

const NAV_BY_ROLE: Record<string, { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }[]> = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'User Management', icon: UserCog },
  ],
  manager: [
    { to: '/manager', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/manager/patients', label: 'Patient Data', icon: FileSpreadsheet },
  ],
  user: [{ to: '/user', label: 'Dashboard', icon: LayoutDashboard, end: true }],
}

const ROLE_BADGE = { admin: 'admin' as const, manager: 'manager' as const, user: 'user' as const }
const LOC_COLORS: Record<string, string> = {
  US: 'var(--loc-us)',
  IN: 'var(--loc-in)',
  EU: 'var(--loc-eu)',
  AU: 'var(--loc-au)',
}

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }

function LayoutSidebar({
  mobile = false,
  collapsed,
  setCollapsed,
  onCloseMobile,
  user,
  role,
  roleBadgeVariant,
  navItems,
  onLogout,
}: {
  mobile?: boolean
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  onCloseMobile: () => void
  user: User | null
  role: string
  roleBadgeVariant: BadgeVariant
  navItems: NavItem[]
  onLogout: () => void | Promise<void>
}) {
  return (
    <aside
      style={{
        width: collapsed && !mobile ? 72 : 260,
        height: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        position: mobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        zIndex: mobile ? 50 : 1,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minHeight: 72,
        }}
      >
        <div
          style={{
            background: 'var(--accent-glow)',
            border: '1px solid var(--border-accent)',
            borderRadius: 10,
            padding: 8,
            flexShrink: 0,
          }}
        >
          <Shield size={18} color="var(--accent)" />
        </div>
        {(!collapsed || mobile) && (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            HealthGuard
          </span>
        )}
        {!mobile && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              flexShrink: 0,
            }}
          >
            <ChevronRight
              size={16}
              style={{
                transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.25s',
              }}
            />
          </button>
        )}
        {mobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {(!collapsed || mobile) && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                flexShrink: 0,
                background: `linear-gradient(135deg, var(--accent-glow) 0%, var(--bg-hover) 100%)`,
                border: '2px solid var(--border-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--accent)',
              }}
            >
              {user?.full_name?.charAt(0) || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.full_name}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                @{user?.username}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant={roleBadgeVariant}>{role}</Badge>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-hover)',
                color: LOC_COLORS[user?.location?.code ?? ''] || 'var(--text-secondary)',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                border: '1px solid var(--border)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {user?.location?.code}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-hover)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                border: '1px solid var(--border)',
              }}
            >
              {user?.team?.code}
            </span>
          </div>
        </div>
      )}

      <nav
        style={{
          flex: 1,
          padding: '12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          overflowY: 'auto',
        }}
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && onCloseMobile()}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed && !mobile ? '10px' : '10px 12px',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              transition: 'var(--transition)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              border: `1px solid ${isActive ? 'var(--border-accent)' : 'transparent'}`,
              justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
            })}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {(!collapsed || mobile) && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: collapsed && !mobile ? '10px' : '10px 12px',
            borderRadius: 'var(--radius)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'var(--transition)',
            justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--danger-bg)'
            e.currentTarget.style.color = 'var(--danger)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {(!collapsed || mobile) && (
            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)' }}>Sign out</span>
          )}
        </button>
      </div>
    </aside>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = user?.role?.name ?? 'user'
  const navItems = (NAV_BY_ROLE[role] ?? NAV_BY_ROLE.user) as NavItem[]
  const roleBadgeVariant: BadgeVariant =
    role === 'admin' || role === 'manager' || role === 'user' ? ROLE_BADGE[role] : 'default'

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const sidebarProps = {
    collapsed,
    setCollapsed,
    onCloseMobile: () => setMobileOpen(false),
    user,
    role,
    roleBadgeVariant,
    navItems,
    onLogout: handleLogout,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <LayoutSidebar {...sidebarProps} />
      </div>

      {mobileOpen && (
        <>
          <div
            role="presentation"
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(8,12,20,0.7)',
              zIndex: 49,
              backdropFilter: 'blur(2px)',
            }}
          />
          <LayoutSidebar {...sidebarProps} mobile />
        </>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header
          style={{
            height: 56,
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: 'var(--bg-surface)',
            flexShrink: 0,
          }}
          className="mobile-header"
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="var(--accent)" />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              HealthGuard
            </span>
          </div>
          <div style={{ width: 20 }} />
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>{children}</main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>
    </div>
  )
}
