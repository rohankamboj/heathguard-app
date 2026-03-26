import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const iconToneClass = {
  accent: 'border border-brand-accent/25 bg-brand-accent/10 text-brand-accent',
  success: 'border border-semantic-success/30 bg-semantic-success-bg text-semantic-success',
  info: 'border border-semantic-info/30 bg-semantic-info-bg text-semantic-info',
  admin: 'border border-role-admin/30 bg-role-admin/10 text-role-admin',
} as const

export type StatCardIconTone = keyof typeof iconToneClass

export function StatCard({
  label,
  value,
  icon: Icon,
  iconTone = 'accent',
  trend,
  className,
}: {
  label: string
  value: ReactNode
  icon?: LucideIcon
  iconTone?: StatCardIconTone
  trend?: string
  className?: string
}) {
  return (
    <Card className={cn('gap-0 py-5', className)}>
      <CardContent className="pt-0">
        <div className="mb-3 flex items-start justify-between">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
          {Icon ? (
            <div className={cn('rounded-lg p-2', iconToneClass[iconTone])}>
              <Icon className="size-4" aria-hidden />
            </div>
          ) : null}
        </div>
        <p className="font-heading text-[2rem] leading-none font-extrabold text-foreground">{value}</p>
        {trend ? (
          <p className="mt-2 text-xs text-muted-foreground">{trend}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
