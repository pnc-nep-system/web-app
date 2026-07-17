import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? ''
      const isAuthRequest = requestUrl.endsWith('/login') || requestUrl.endsWith('/logout')

      if (!isAuthRequest) {
        const authStore = useAuthStore()
        authStore.clearAuthState(true)
      }
    }

    return Promise.reject(error)
  },
)

export default api

// Global deduplication for concurrent GET requests
const originalGet = api.get
const pendingGetRequests = new Map<string, Promise<any>>()

api.get = function (url: string, config?: any) {
  // Generate a unique key based on URL and query parameters
  const key = url + (config?.params ? '?' + JSON.stringify(config.params) : '')

  if (pendingGetRequests.has(key)) {
    return pendingGetRequests.get(key) as Promise<any>
  }

  const promise = originalGet.call(this, url, config).finally(() => {
    pendingGetRequests.delete(key)
  })

  pendingGetRequests.set(key, promise)
  return promise
}
