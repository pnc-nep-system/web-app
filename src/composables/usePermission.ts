// TODO: This composable is scaffolded for role-based permission checks but is not yet
// imported or used anywhere in the application. Wire it up when fine-grained
// UI-level permission guards are needed (e.g., hiding buttons based on role).
// Planned consumers: action menus, form submit guards, admin-only sections.
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
