import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/services/api'
import type { User } from '@/types'

export interface LoginResultSuccess {
  success: true
  role: string
}

export interface LoginResultFailure {
  success: false
  error: string
}

export type LoginResult = LoginResultSuccess | LoginResultFailure

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  role: () => string | undefined
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true })
        try {
          const { data: tokens } = await authApi.login(username, password)
          localStorage.setItem('access_token', tokens.access_token)
          localStorage.setItem('refresh_token', tokens.refresh_token)

          const { data: user } = await authApi.me()
          set({ user, isAuthenticated: true, isLoading: false })
          return { success: true, role: user.role?.name ?? 'user' }
        } catch (err: unknown) {
          set({ isLoading: false })
          const msg =
            axiosDetail(err) ?? 'Login failed'
          return { success: false, error: msg }
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch {
          /* ignore */
        }
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        try {
          const { data: user } = await authApi.me()
          set({ user, isAuthenticated: true })
        } catch {
          set({ user: null, isAuthenticated: false })
        }
      },

      role: () => get().user?.role?.name,
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
)

function axiosDetail(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const r = err as { response?: { data?: { detail?: unknown } } }
    const d = r.response?.data?.detail
    if (typeof d === 'string') return d
  }
  return undefined
}
