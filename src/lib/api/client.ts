import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://i-ke-api.up.railway.app'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (typeof window === 'undefined') return Promise.reject(error)

    const original = error.config
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = refreshRes.data.accessToken
        localStorage.setItem('accessToken', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('usuario')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
