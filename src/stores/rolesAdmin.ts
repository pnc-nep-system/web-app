import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userService } from '@/services/user.service'
import { useToast } from '@/utils/toast'
import type { Permission, Role } from '@/types/user'

/**
 * Extract the backend error message from an unknown error.
 */
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response
    return res?.data?.message ?? fallback
  }
  return fallback
}

/**
 * Admin store for the Roles & Permissions settings page.
 */
export const useRolesAdminStore = defineStore('rolesAdmin', () => {
  const toast = useToast()

  const roles = ref<Role[]>([])
  const allPermissions = ref<Permission[]>([])
  const isLoading = ref(false)
  const savingRoleId = ref<number | null>(null)

  /** Load roles (with permissions) and the flat permission list once. */
  async function fetchAll(): Promise<void> {
    if (roles.value.length > 0 && allPermissions.value.length > 0) return

    isLoading.value = true
    try {
      const [rolesRes, permsRes] = await Promise.all([
        userService.getRoles(),
        userService.getPermissions(),
      ])
      roles.value = rolesRes.data
      // The backend groups permissions by category; flatten for a flat, ungrouped list.
      allPermissions.value = Object.values(permsRes.data).flat()
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to load roles and permissions.'))
    } finally {
      isLoading.value = false
    }
  }

  /** Persist a role's permission set and update it in place on success. */
  async function savePermissions(role: Role, permissionIds: number[]): Promise<boolean> {
    savingRoleId.value = role.id
    try {
      const res = await userService.updateRolePermissions(role.id, permissionIds)
      const idx = roles.value.findIndex((r) => r.id === role.id)
      if (idx >= 0) roles.value[idx] = res.data
      toast.success(`${role.display_name || role.name} permissions saved.`)
      return true
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save permissions.'))
      return false
    } finally {
      savingRoleId.value = null
    }
  }

  return {
    roles,
    allPermissions,
    isLoading,
    savingRoleId,
    fetchAll,
    savePermissions,
  }
})
