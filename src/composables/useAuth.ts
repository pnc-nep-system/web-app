import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

/**
 * Composable to access authentication state and actions.
 * Wraps useAuthStore with storeToRefs so reactive state is destructurable.
 */
export function useAuth() {
  const authStore = useAuthStore()
  const { currentUser, currentUserId, userRole, isAuthenticated, authError, fieldErrors, loading } =
    storeToRefs(authStore)

  return {
    // state (reactive refs)
    currentUser,
    currentUserId,
    userRole,
    isAuthenticated,
    authError,
    fieldErrors,
    loading,
    // actions
    login: authStore.login,
    logout: authStore.logout,
    fetchCurrentUser: authStore.fetchCurrentUser,
  }
}
