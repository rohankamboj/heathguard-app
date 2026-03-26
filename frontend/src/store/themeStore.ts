import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme-store'

export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 'light'
    const parsed = JSON.parse(raw) as { state?: { theme?: string } }
    return parsed.state?.theme === 'light' ? 'light' : 'dark'
  } catch {
    return 'light'
  }
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: readStoredTheme(),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
)
