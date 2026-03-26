import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  /** Larger hit target for header toolbars */
  size?: 'default' | 'sm'
}

export function ThemeToggle({ className, size = 'default' }: Props) {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'flex cursor-pointer items-center justify-center rounded-md border border-line bg-surface-elevated text-fg-secondary transition-colors duration-hg ease-hg',
        'hover:border-line-bright hover:bg-surface-hover hover:text-fg-primary',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        size === 'default' ? 'size-10' : 'size-9',
        className,
      )}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
    </button>
  )
}
