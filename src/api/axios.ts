import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Do not redirect to /login if the request itself was a login request
      const isLoginRequest = error.config?.url?.endsWith('/login')
      if (!isLoginRequest) {
        const authStore = useAuthStore()
        authStore.logout()
      }
    }
    return Promise.reject(error)
  },
)

export default api