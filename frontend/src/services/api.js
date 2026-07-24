import axios from 'axios'
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants'

// Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Request Interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: handle 401 & 429 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      window.location.href = '/login'
    }

    // Format 429 Too Many Requests response data
    if (error.response?.status === 429) {
      const data = error.response.data
      let message = 'Too many requests. Please wait a moment and try again.'
      if (typeof data === 'string') {
        message = data
      } else if (data?.message) {
        message = data.message
      }
      error.response.data = { success: false, message }
    }

    return Promise.reject(error)
  }
)

export default api
