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

import { locationTextClass } from '@/lib/location-classes'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

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
      className={cn(
        'flex h-screen shrink-0 flex-col border-line border-r bg-surface transition-[width] duration-250 ease-hg',
        mobile ? 'fixed top-0 left-0 z-50' : 'sticky top-0 z-1',
        collapsed && !mobile ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      <div className="flex min-h-[72px] items-center gap-3 border-line border-b px-5 pt-5 pb-4">
        <div className="shrink-0 rounded-[10px] border border-line-accent bg-brand-accent-glow p-2">
          <Shield className="size-[18px] text-brand-accent" aria-hidden />
        </div>
        {(!collapsed || mobile) && (
          <span className="truncate font-display text-xs font-extrabold tracking-tight text-fg-primary">
            HealthGuard
          </span>
        )}
        {!mobile && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex cursor-pointer rounded-md border-0 bg-transparent p-1 text-fg-muted hover:text-fg-secondary"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRight
                className={cn('size-4 transition-transform duration-250', collapsed ? 'rotate-0' : 'rotate-180')}
                aria-hidden
              />
            </button>
          </div>
        )}
        {mobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto flex cursor-pointer border-0 bg-transparent text-fg-muted hover:text-fg-secondary"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
        )}
      </div>

      {(!collapsed || mobile) && (
        <div className="border-line border-b px-5 py-4">
          <div className="mb-2.5 flex items-center gap-3">
            <div
              className={cn(
                'flex size-[38px] shrink-0 items-center justify-center rounded-full border-2 border-line-accent font-display text-sm font-bold text-brand-accent',
                'bg-[linear-gradient(135deg,var(--accent-glow)_0%,var(--bg-hover)_100%)]',
              )}
            >
              {user?.full_name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-[13px] font-semibold text-fg-primary">{user?.full_name}</p>
              <p className="truncate text-[11px] text-fg-muted">@{user?.username}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={roleBadgeVariant}>{role}</Badge>
            <span
              className={cn(
                'rounded-full-hg border border-line bg-surface-hover px-2 py-0.5 font-body text-[11px] font-semibold tracking-wide uppercase',
                locationTextClass(user?.location?.code),
              )}
            >
              {user?.location?.code}
            </span>
            <span className="rounded-full-hg border border-line bg-surface-hover px-2 py-0.5 font-body text-[11px] font-semibold text-fg-secondary">
              {user?.team?.code}
            </span>
          </div>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && onCloseMobile()}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md border font-body text-sm font-medium transition-colors duration-hg ease-hg no-underline',
                collapsed && !mobile ? 'justify-center px-2.5 py-2.5' : 'px-3 py-2.5',
                isActive
                  ? 'border-line-accent bg-brand-accent-glow text-brand-accent'
                  : 'border-transparent text-fg-secondary hover:bg-surface-hover/80',
              )
            }
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {(!collapsed || mobile) && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {mobile && (
        <div className="border-line border-t p-3">
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              'flex w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent font-body text-sm font-medium text-fg-muted transition-colors duration-hg ease-hg',
              'hover:bg-semantic-danger-bg hover:text-semantic-danger',
              'px-3 py-2.5',
            )}
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            <span>Sign out</span>
          </button>
        </div>
      )}
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
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <div className="desktop-sidebar hidden">
        <LayoutSidebar {...sidebarProps} />
      </div>

      {mobileOpen ? (
        <>
          <div
            role="presentation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-49 bg-surface-base/70 backdrop-blur-sm"
          />
          <LayoutSidebar {...sidebarProps} mobile />
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-line border-b bg-surface px-5 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex cursor-pointer border-0 bg-transparent text-fg-secondary hover:text-fg-primary"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-brand-accent" aria-hidden />
            <span className="font-display text-[15px] font-bold text-fg-primary">HealthGuard</span>
          </div>
          <ThemeToggle size="sm" className="border-line bg-surface-elevated" />
        </header>

        <header className="hidden h-14 shrink-0 items-center justify-end gap-2 border-line border-b bg-surface px-5 md:flex">
          <ThemeToggle size="sm" className="border-line bg-surface-elevated" />
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-3 py-2 font-body text-sm font-medium text-fg-muted transition-colors duration-hg ease-hg',
              'hover:bg-semantic-danger-bg hover:text-semantic-danger',
            )}
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            <span>Sign out</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  )
}
