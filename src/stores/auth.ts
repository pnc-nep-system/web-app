import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const currentUserId = ref<string | null>(null)
  const authError = ref('')
  const fieldErrors = ref<Record<string, string[]>>({})
  const loading = ref(false)

  // --- Getters ---
  const isAuthenticated = computed(() => !!localStorage.getItem('authToken'))

  // --- Actions ---
  
  /**
   * Hits the backend authentication login endpoint.
   * Saves the auth token and role to local storage upon successful sign-in.
   */
  async function login(email: string, password: string) {
    loading.value = true
    authError.value = ''
    fieldErrors.value = {}
    
    try {
      const response = await authApi.login({ email, password })
      const { token, role, id } = response.data
      
      // Store token and role locally to maintain user session
      localStorage.setItem('authToken', token || 'default_token')
      localStorage.setItem('userRole', role || 'user')
      
      if (id) {
        currentUserId.value = id
      }
      
      loading.value = false
      return true
    } catch (error: any) {
      loading.value = false
      const res = error.response
      
      // Handle server-returned validation / credentials error messages
      if (res?.data?.message) {
        authError.value = res.data.message
      } else {
        authError.value = 'Something went wrong on our end. Please try again.'
      }
      
      // Handle granular input field validation errors (HTTP 422)
      if (res?.data?.errors) {
        fieldErrors.value = res.data.errors
      }
      
      return false
    }
  }

  /**
   * Clears session storage and redirects to the login route.
   */
  function logout() {
    currentUserId.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    window.location.href = '/login'
  }

  return { currentUserId, authError, fieldErrors, loading, isAuthenticated, login, logout }
})
