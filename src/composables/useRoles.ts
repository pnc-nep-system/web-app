import { ref } from 'vue'
import { roleService } from '@/services/role.service'
import { useToast } from '@/utils/toast'
import type { Role, CreateRolePayload, UpdateRolePayload } from '@/types/role'

/**
 * Composable that manages Role Management API requests, search, and validation.
 * Mirrors the shape of useUsers() so RoleManagementView follows the same pattern
 * as UserManagementView.
 */
export function useRoles() {
  const toast = useToast()

  const roles = ref<Role[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const searchQuery = ref('')
  const fieldErrors = ref<Record<string, string[]>>({})

  function clearErrors() {
    fieldErrors.value = {}
  }

  let _fetchPromise: Promise<void> | null = null

  async function fetchRoles(): Promise<void> {
    if (_fetchPromise) return _fetchPromise
    _fetchPromise = (async () => {
      isLoading.value = true
      try {
        const res = await roleService.getRoles(searchQuery.value)
        roles.value = res.data ?? []
      } catch (err: any) {
        if (err.response?.status === 403) {
          toast.error('Access denied. You do not have permission to view roles.')
        } else {
          toast.error('Failed to load roles. Please try again.')
        }
      } finally {
        isLoading.value = false
        _fetchPromise = null
      }
    })()
    return _fetchPromise
  }

  async function createRole(payload: CreateRolePayload): Promise<boolean> {
    isSaving.value = true
    clearErrors()
    try {
      await roleService.createRole(payload)
      toast.success('Role created successfully.')
      await fetchRoles()
      return true
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        fieldErrors.value = err.response.data.errors
        toast.error(err.response.data.message ?? 'Please correct the errors below.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to create role.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function updateRole(id: number, payload: UpdateRolePayload): Promise<boolean> {
    isSaving.value = true
    clearErrors()
    try {
      await roleService.updateRole(id, payload)
      toast.success('Role updated successfully.')
      await fetchRoles()
      return true
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        fieldErrors.value = err.response.data.errors
        toast.error(err.response.data.message ?? 'Please correct the errors below.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to update role. System roles cannot be modified.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function deleteRole(id: number): Promise<boolean> {
    isSaving.value = true
    try {
      const res = await roleService.deleteRole(id)
      toast.success(res.data.message ?? 'Role deleted successfully.')
      await fetchRoles()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to delete role. System roles cannot be deleted.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function assignToUser(roleId: number, userId: number): Promise<boolean> {
    try {
      const res = await roleService.assignToUser(roleId, userId)
      toast.success(res.data.message ?? 'Role assigned successfully.')
      await fetchRoles()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to assign role.')
      return false
    }
  }

  async function removeFromUser(roleId: number, userId: number): Promise<boolean> {
    try {
      const res = await roleService.removeFromUser(roleId, userId)
      toast.success(res.data.message ?? 'Role removed successfully.')
      await fetchRoles()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to remove role.')
      return false
    }
  }

  return {
    roles,
    isLoading,
    isSaving,
    searchQuery,
    fieldErrors,
    clearErrors,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    assignToUser,
    removeFromUser,
  }
}
