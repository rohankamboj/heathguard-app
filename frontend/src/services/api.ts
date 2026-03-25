import axios, { type AxiosProgressEvent } from 'axios'
import type { AuthTokens, DashboardStats, PatientListResponse, UploadResult, User } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = false
let refreshQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

function clearAuth() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error)
    }

    const original = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (refreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      refreshing = true
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post<AuthTokens>('/api/auth/refresh', {
          refresh_token: refreshToken,
        })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)

        refreshQueue.forEach(({ resolve }) => resolve(data.access_token))
        refreshQueue = []
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username: string, password: string) =>
    api.post<AuthTokens>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  refresh: (refresh_token: string) => api.post<AuthTokens>('/auth/refresh', { refresh_token }),
  me: () => api.get<User>('/auth/me'),
}

export const usersApi = {
  list: (params: Record<string, string | number | boolean | undefined>) => api.get<User[]>('/users/', { params }),
  get: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post<User>('/users/', data),
  update: (id: number, data: Record<string, unknown>) => api.patch<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  unlock: (id: number) => api.post(`/users/${id}/unlock`),
  roles: () => api.get<{ id: number; name: string }[]>('/users/meta/roles'),
  locations: () => api.get<{ id: number; code: string; name: string }[]>('/users/meta/locations'),
  teams: () => api.get<{ id: number; code: string; name: string }[]>('/users/meta/teams'),
}

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats'),
  users: () => api.get<User[]>('/dashboard/users'),
}

export const patientsApi = {
  list: (params: Record<string, string | number | undefined>) =>
    api.get<PatientListResponse>('/patients/', { params }),
  get: (id: number) => api.get(`/patients/${id}`),
  update: (id: number, data: Record<string, unknown>) => api.patch(`/patients/${id}`, data),
  delete: (id: number) => api.delete(`/patients/${id}`),
  upload: (file: File, onProgress?: (evt: AxiosProgressEvent) => void) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<UploadResult>('/patients/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  batches: () => api.get('/patients/batches'),
}

export default api
