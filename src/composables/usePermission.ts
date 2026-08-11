// Dynamic, permission-driven authorization for the frontend.
//
// `can()`/`hasPermission()` is the primary mechanism — it reads the effective
// permissions the backend computed for the logged-in user (from ALL of their
// assigned roles) and never hard-codes a role name. New code (route guards,
// sidebar items, buttons) should use `can()`, not `isAdmin`/`hasRole`.
//
// The role-name helpers below (`isAdmin`, `isCoordinator`, `isMember`,
// `hasRole`) are kept only as thin backward-compatible wrappers for existing
// call sites that predate the permission system — they are NOT the
// recommended way to gate anything new, since a custom role wouldn't match
// any of them. Remember: this is UX only — the backend `permission:`
// middleware is the real security boundary regardless of what this composable
// decides to show.
import { computed } from 'vue'
import { useAuth } from './useAuth'

type Role = 'nep_admin' | 'nep_coordinator' | 'member_org' | string

/**
 * Composable for permission-based (and legacy role-based) access checks.
 */
export function usePermission() {
  const { userRole, permissions, isAuthenticated, hasPermission, hasAnyPermission } = useAuth()

  const isAdmin = computed(() => userRole.value === 'nep_admin')
  const isCoordinator = computed(() => userRole.value === 'nep_coordinator')
  const isMember = computed(() => userRole.value === 'member_org')

  /** Returns true if the current user's role matches any of the provided roles. */
  function hasRole(...roles: Role[]): boolean {
    return roles.includes(userRole.value)
  }

  /** Primary authorization check — does the user hold this permission? */
  function can(permission: string): boolean {
    return hasPermission(permission)
  }

  /** True if the user holds at least one of the given permissions. */
  function canAny(perms: string[]): boolean {
    return hasAnyPermission(perms)
  }

  /** True only if the user holds every one of the given permissions. */
  function canAll(perms: string[]): boolean {
    return perms.every((p) => hasPermission(p))
  }

  return {
    isAuthenticated,
    isAdmin,
    isCoordinator,
    isMember,
    hasRole,
    userRole,
    permissions,
    can,
    canAny,
    canAll,
    hasPermission,
    hasAnyPermission,
  }
}
