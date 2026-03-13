import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Interceptor: manejo de errores globales ──────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    if (!err.config || err.config.url?.includes('/auth/login')) {
      return Promise.reject(err)
    }

    // Renovar token si 401
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await apiClient.post('/auth/refresh')
        return apiClient(originalRequest)
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      }
    }

    return Promise.reject(err)
  }
)

export default apiClient
