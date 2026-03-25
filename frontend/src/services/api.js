import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// ── Request interceptor — attach token ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — handle 401 / refresh ───────────────────────────────
let refreshing = false
let refreshQueue = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (refreshing) {
        return new Promise((resolve, reject) => {
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
        const { data } = await axios.post('/api/auth/refresh', {
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

function clearAuth() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
  me: () => api.get('/auth/me'),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params) => api.get('/users/', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  unlock: (id) => api.post(`/users/${id}/unlock`),
  roles: () => api.get('/users/meta/roles'),
  locations: () => api.get('/users/meta/locations'),
  teams: () => api.get('/users/meta/teams'),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  users: () => api.get('/dashboard/users'),
}

// ── Patients ──────────────────────────────────────────────────────────────────
export const patientsApi = {
  list: (params) => api.get('/patients/', { params }),
  get: (id) => api.get(`/patients/${id}`),
  update: (id, data) => api.patch(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  upload: (file, onProgress) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/patients/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  batches: () => api.get('/patients/batches'),
}

export default api
