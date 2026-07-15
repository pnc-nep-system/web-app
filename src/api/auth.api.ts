import api from './axios'

export const authApi = {
  getCsrfCookie() {
    // Sanctum CSRF cookie is served at the host root (not under /api)
    const baseURL = api.defaults.baseURL || ''
    const csrfURL = baseURL.replace(/\/api$/, '') + '/sanctum/csrf-cookie'
    return api.get(csrfURL, { baseURL: '' })
  },
  login(credentials: { email: string; password: string }) {
    return api.post('/login', credentials)
  },
  logout() {
    return api.post('/logout')
  },
  getUser() {
    return api.get('/user')
  },
}
