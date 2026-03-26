import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

/** Keeps `document.documentElement` class in sync with persisted theme. */
export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return null
}
