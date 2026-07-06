import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUsersStore } from './users'

export const useAuthStore = defineStore('auth', () => {
  const usersStore = useUsersStore()
  const currentUserId = ref<string | null>(null)
  const authError = ref('')
  const loading = ref(false)

  const isAuthenticated = computed(() => !!currentUserId.value)

  async function login(email: string, password: string) {
    loading.value = true
    authError.value = ''
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 650))
    
    const user = usersStore.byEmail(email)
    
    if (!user) {
      authError.value = 'No account found with that email address.'
    } else if (user.password !== password) {
      authError.value = 'Incorrect password. Please try again.'
    } else {
      currentUserId.value = user.id
    }
    
    loading.value = false
    return !authError.value
  }

  function logout() {
    currentUserId.value = null
  }

  return { currentUserId, authError, loading, isAuthenticated, login, logout }
})
