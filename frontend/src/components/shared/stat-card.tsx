import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'var(--accent)',
  trend,
  className,
}: {
  label: string
  value: ReactNode
  icon?: LucideIcon
  color?: string
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
            <div
              className="rounded-lg p-2"
              style={{
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
                color,
              }}
            >
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
