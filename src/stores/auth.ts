import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { useUsersStore } from './users'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const currentUserId = ref<string | null>(null)
  const currentUser = ref<Record<string, unknown> | null>(null)
  const authError = ref('')
  const fieldErrors = ref<Record<string, string[]>>({})
  const loading = ref(false)
  // Reactive role — kept in sync with localStorage on login/logout
  const userRole = ref<string>(localStorage.getItem('userRole') ?? '')

  // --- Getters ---
  const isAuthenticated = computed(() => !!localStorage.getItem('authToken'))

  // --- Actions ---

  /**
   * Hits the backend authentication login endpoint.
   * If the backend is unavailable, it automatically falls back to local mocked credentials.
   */
  async function login(email: string, password: string) {
    loading.value = true
    authError.value = ''
    fieldErrors.value = {}

    try {
      const response = await authApi.login({ email, password })
      // API returns: { message, token, user: { id, name, email, role, ... } }
      const { token, user } = response.data

      // Store token and role locally to maintain user session
      localStorage.setItem('authToken', token || 'default_token')
      localStorage.setItem('userRole', user?.role || 'user')
      userRole.value = user?.role || 'user'
      currentUser.value = user ?? null

      if (user?.id) {
        currentUserId.value = user.id
      }

      loading.value = false
      return true
    } catch (error) {
      loading.value = false
      const axiosError = error as {
        code?: string;
        message?: string;
        response?: {
          status?: number;
          data?: {
            message?: string;
            errors?: Record<string, string[]>;
          };
        };
      };
      const res = axiosError.response

      // FALLBACK: If backend is completely unavailable (connection refused, offline, etc.)
      if (!res || axiosError.code === 'ERR_NETWORK' || axiosError.message?.includes('Network Error')) {
        const usersStore = useUsersStore()
        const user = usersStore.byEmail(email)

        if (user) {
          if (user.password === password) {
            localStorage.setItem('authToken', 'mock-jwt-token-123')
            localStorage.setItem('userRole', user.role)
            userRole.value = user.role
            currentUserId.value = user.id
            return true
          } else {
            fieldErrors.value = { password: ['Password is incorrect.'] }
            authError.value = 'Password is incorrect.'
            return false
          }
        } else {
          fieldErrors.value = { email: ['Email does not exist.'] }
          authError.value = 'Email does not exist.'
          return false
        }
      }

      // Handle server-returned validation / credentials error messages
      if (res?.data?.message) {
        authError.value = res.data.message
      } else {
        authError.value = 'Something went wrong on our end. Please try again.'
      }

      // Handle granular input field validation errors (HTTP 422)
      if (res?.data?.errors) {
        fieldErrors.value = res.data.errors
      } else if (res?.status === 401) {
        // Map general 401 error to password field so it appears under the input
        fieldErrors.value = { password: [authError.value] }
      }

      return false
    }
  }

  /**
   * Clears session storage and redirects to the login route.
   */
  function logout() {
    currentUserId.value = null
    currentUser.value = null
    userRole.value = ''
    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    window.location.href = '/login'
  }

  return { currentUserId, currentUser, authError, fieldErrors, loading, isAuthenticated, userRole, login, logout }
})
