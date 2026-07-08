import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Do not redirect to /login if the request itself was a login request
      const isLoginRequest = error.config?.url?.endsWith('/login')
      if (!isLoginRequest) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('userRole')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
