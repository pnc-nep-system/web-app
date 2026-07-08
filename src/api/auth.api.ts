import api from './axios'

export const authApi = {
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
