import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-muted-foreground">
      {Icon ? <Icon className="size-10 stroke-[1.5]" aria-hidden /> : null}
      <div className="text-center">
        <p className="font-heading text-base font-semibold text-secondary-foreground">{title}</p>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
