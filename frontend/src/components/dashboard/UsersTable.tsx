import { Badge, type BadgeVariant } from '@/components/ui/badge'
import type { User } from '@/types'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Lock } from 'lucide-react'

import { locationTextClass } from '@/lib/location-classes'
import { cn } from '@/lib/utils'

function roleToBadgeVariant(name?: string): BadgeVariant {
  const n = name?.toLowerCase()
  if (n === 'admin' || n === 'manager' || n === 'user') return n
  return 'default'
}

export default function UsersTable({
  users = [],
  loading,
}: {
  users?: User[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 animate-shimmer-hg rounded-md bg-[linear-gradient(90deg,var(--bg-elevated)_25%,var(--bg-hover)_50%,var(--bg-elevated)_75%)] bg-[length:200%_100%]"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    )
  }

  if (!users.length) {
    return (
      <div className="px-6 py-12 text-center text-fg-muted">
        <p className="font-display text-[15px] font-semibold text-fg-secondary">No users found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg-hg border border-line">
      <table className="w-full border-collapse font-body">
        <thead>
          <tr className="border-b border-line bg-surface-elevated">
            {['Name', 'Username', 'Email', 'Role', 'Location', 'Team', 'Status', 'Last Login'].map(
              (h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-fg-muted uppercase"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr
              key={user.id}
              className={cn(
                'border-b border-line transition-colors duration-hg ease-hg',
                idx % 2 === 1 && 'bg-white/[0.01]',
                'hover:bg-surface-hover',
              )}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-accent bg-brand-accent-glow font-display text-xs font-bold text-brand-accent">
                    {user.full_name?.charAt(0)}
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium text-fg-primary">
                    {user.full_name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-[13px] text-fg-secondary">@{user.username}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-fg-secondary">{user.email}</span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={roleToBadgeVariant(user.role?.name)}>{user.role?.name}</Badge>
              </td>
              <td className="px-4 py-3">
                <span className={cn('text-[13px] font-semibold', locationTextClass(user.location?.code))}>
                  {user.location?.code}
                  <span className="ml-1 text-[11px] font-normal text-fg-muted">
                    · {user.location?.name}
                  </span>
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-block rounded-full-hg border border-line bg-surface-elevated px-2 py-0.5 text-xs font-semibold text-fg-secondary">
                  {user.team?.code}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {user.is_locked ? (
                    <>
                      <Lock className="size-[13px] text-semantic-warning" aria-hidden />
                      <span className="text-xs text-semantic-warning">Locked</span>
                    </>
                  ) : user.is_active ? (
                    <>
                      <CheckCircle2 className="size-[13px] text-semantic-success" aria-hidden />
                      <span className="text-xs text-semantic-success">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-[13px] text-fg-muted" aria-hidden />
                      <span className="text-xs text-fg-muted">Inactive</span>
                    </>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-fg-muted">
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
