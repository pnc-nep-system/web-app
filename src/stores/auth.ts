import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'

export const useAuthStore = defineStore('auth', () => {

  const token = ref<string | null>(sessionStorage.getItem('authToken'))
  const currentUserId = ref<string | null>(null)
  const currentUser = ref<Record<string, unknown> | null>(null)
  const authError = ref('')
  const networkError = ref('')
  const fieldErrors = ref<Record<string, string[]>>({})
  const loading = ref(false)

  const userRole = ref<string>(sessionStorage.getItem('userRole') ?? '')

  const isAuthenticated = computed(() => !!token.value)

  function clearErrors() {
    authError.value = ''
    networkError.value = ''
    fieldErrors.value = {}
  }

  async function login(email: string, password: string) {
    loading.value = true
    clearErrors()

    try {
      const response = await authApi.login({ email, password })
      // API returns: { message, token, user: { id, name, email, role, ... } }
      const { token: newToken, user } = response.data

      token.value = newToken || 'default_token'
      userRole.value = user?.role || 'user'
      currentUser.value = user ?? null

      sessionStorage.setItem('authToken', token.value)
      sessionStorage.setItem('userRole', userRole.value)

      if (user?.id) {
        currentUserId.value = user.id
      }

      loading.value = false
      return true
    } catch (error) {
      loading.value = false

      const axiosError = error as {
        code?: string
        message?: string
        response?: {
          status?: number
          data?: {
            message?: string
            errors?: Record<string, string[]>
          }
        }
      }
      const res = axiosError.response
      // Network / server unreachable — no response object
      if (
        !res ||
        axiosError.code === 'ERR_NETWORK' ||
        axiosError.message?.includes('Network Error') ||
        axiosError.code === 'ECONNREFUSED'
      ) {
        networkError.value =
          'Unable to connect to the server. Please check your internet connection or try again later.'
        return false
      }
      // HTTP 401 — invalid credentials
      if (res.status === 401) {
        authError.value = 'Invalid email or password.'
        return false
      }

      if (res.status === 422 && res.data?.errors) {
        fieldErrors.value = res.data.errors
        authError.value = res.data.message ?? 'Please correct the errors below.'
        return false
      }

      authError.value =
        res.data?.message ?? 'Something went wrong on database. Please try again.'
      return false
    }
  }

  function logout() {
    token.value = null
    currentUserId.value = null
    currentUser.value = null
    userRole.value = ''
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('userRole')
    window.location.href = '/login'
  }

  async function fetchCurrentUser() {
    if (!isAuthenticated.value) return null
    loading.value = true
    try {
      const response = await authApi.getUser()
      const user = response.data.data || response.data
      currentUser.value = user
      userRole.value = user?.role || userRole.value
      if (user?.role) {
        sessionStorage.setItem('userRole', userRole.value)
      }
      if (user?.id) {
        currentUserId.value = user.id
      }
      return user
    } catch (error) {
      console.error('Failed to fetch current user profile:', error)
      logout()
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    token,
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
    clearErrors,
    fetchCurrentUser,
  }
})