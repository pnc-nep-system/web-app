import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { connectRealtimeForRole, disconnectRealtime } from '@/realtime'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref<boolean>(sessionStorage.getItem('isLoggedIn') === 'true')
  const currentUserId = ref<string | null>(sessionStorage.getItem('currentUserId'))
  const currentUser = ref<Record<string, unknown> | null>(null)
  const authError = ref('')
  const networkError = ref('')
  const fieldErrors = ref<Record<string, string[]>>({})
  const loading = ref(false)
  const fetchingUser = ref(false)
  const loggingOut = ref(false)
  const userRole = ref<string>(sessionStorage.getItem('userRole') ?? '')

  const isAuthenticated = computed(() => isLoggedIn.value)

  function clearErrors() {
    authError.value = ''
    networkError.value = ''
    fieldErrors.value = {}
  }

  function rememberUser(user: Record<string, unknown> | null) {
    currentUser.value = user
    userRole.value = typeof user?.role === 'string' ? user.role : ''
    currentUserId.value = user?.id ? String(user.id) : null
    isLoggedIn.value = Boolean(user)

    if (user) {
      sessionStorage.setItem('isLoggedIn', 'true')
      sessionStorage.setItem('userRole', userRole.value)
      if (currentUserId.value) {
        sessionStorage.setItem('currentUserId', currentUserId.value)
      }
      connectRealtimeForRole(userRole.value)
    } else {
      disconnectRealtime()
      sessionStorage.removeItem('isLoggedIn')
      sessionStorage.removeItem('userRole')
      sessionStorage.removeItem('currentUserId')
    }
  }

  function clearAuthState(redirectToLogin = false) {
    if (redirectToLogin && window.location.pathname !== '/login') {
      sessionStorage.removeItem('isLoggedIn')
      sessionStorage.removeItem('userRole')
      sessionStorage.removeItem('currentUserId')
      try {
        disconnectRealtime()
      } catch (err) {
        console.error('Failed to disconnect realtime:', err)
      }
      window.location.assign('/login')
      return
    }
    rememberUser(null)
  }

  let loginPromise: Promise<boolean> | null = null
  let fetchUserPromise: Promise<unknown> | null = null

  async function login(email: string, password: string) {
    if (loginPromise) return loginPromise
    loginPromise = _doLogin(email, password).finally(() => { loginPromise = null })
    return loginPromise
  }

  async function _doLogin(email: string, password: string): Promise<boolean> {
    loading.value = true
    clearErrors()
    try {
      const hasCsrfToken = document.cookie.split(';').some(c => c.trim().startsWith('XSRF-TOKEN='))
      if (!hasCsrfToken) {
        await authApi.getCsrfCookie()
      }
      const response = await authApi.login({ email, password })
      rememberUser(response.data.user ?? null)
      return true
    } catch (error) {
      const axiosError = error as {
        code?: string
        message?: string
        response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }
      }
      const res = axiosError.response
      if (!res || axiosError.code === 'ERR_NETWORK' || axiosError.message?.includes('Network Error') || axiosError.code === 'ECONNREFUSED') {
        networkError.value = 'Unable to connect to the server. Please check your internet connection or try again later.'
        return false
      }
      if (res.status === 401) {
        authError.value = 'Invalid email or password.'
        return false
      }
      if (res.status === 422 && res.data?.errors) {
        fieldErrors.value = res.data.errors
        authError.value = res.data.message ?? 'Please correct the errors below.'
        return false
      }
      authError.value = res.data?.message ?? 'Something went wrong on database. Please try again.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (loggingOut.value) return
    loggingOut.value = true
    authApi.logout().catch((err) => {
      console.error('Failed to notify backend on logout:', err)
    })
    clearAuthState(true)
  }

  async function fetchCurrentUser() {
    if (fetchUserPromise) return fetchUserPromise
    fetchUserPromise = _doFetchUser().finally(() => { fetchUserPromise = null })
    return fetchUserPromise
  }

  async function _doFetchUser() {
    fetchingUser.value = true
    try {
      const response = await authApi.getUser()
      const user = response.data.data || response.data
      rememberUser(user ?? null)
      return user
    } catch (error) {
      console.error('Failed to fetch current user profile:', error)
      clearAuthState(false)
      throw error
    } finally {
      fetchingUser.value = false
    }
  }

  return {
    isLoggedIn,
    currentUserId,
    currentUser,
    authError,
    networkError,
    fieldErrors,
    loading,
    isAuthenticated,
    userRole,
    login,
    logout,
    clearAuthState,
    clearErrors,
    fetchCurrentUser,
  }
})

