import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'

export const useAuthStore = create(
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
          return { success: true, role: user.role.name }
        } catch (err) {
          set({ isLoading: false })
          const msg = err.response?.data?.detail || 'Login failed'
          return { success: false, error: msg }
        }
      },

      logout: async () => {
        try { await authApi.logout() } catch {}
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
