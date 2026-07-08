import { computed } from 'vue'
import { useAuth } from './useAuth'

type Role = 'admin' | 'coordinator' | 'member' | string

/**
 * Composable for role-based permission checks.
 */
export function usePermission() {
  const { userRole, isAuthenticated } = useAuth()

  const isAdmin = computed(() => userRole.value === 'admin')
  const isCoordinator = computed(() => userRole.value === 'coordinator')
  const isMember = computed(() => userRole.value === 'member')

  /**
   * Returns true if the current user's role matches any of the provided roles.
   */
  function hasRole(...roles: Role[]): boolean {
    return roles.includes(userRole.value)
  }

  return {
    isAuthenticated,
    isAdmin,
    isCoordinator,
    isMember,
    hasRole,
    userRole,
  }
}
