import { ref } from 'vue'
import { permissionService } from '@/services/permission.service'
import { useToast } from '@/utils/toast'
import type { GroupedPermissions, CreatePermissionPayload, UpdatePermissionPayload } from '@/types/role'

/**
 * Composable that manages Permission Management API requests, search, and validation.
 */
export function usePermissions() {
  const toast = useToast()

  const groupedPermissions = ref<GroupedPermissions>({})
  const isLoading = ref(false)
  const isSaving = ref(false)
  const searchQuery = ref('')
  const fieldErrors = ref<Record<string, string[]>>({})

  function clearErrors() {
    fieldErrors.value = {}
  }

  let _fetchPromise: Promise<void> | null = null

  async function fetchPermissions(): Promise<void> {
    if (_fetchPromise) return _fetchPromise
    _fetchPromise = (async () => {
      isLoading.value = true
      try {
        const res = await permissionService.getPermissions(searchQuery.value)
        groupedPermissions.value = res.data ?? {}
      } catch (err: any) {
        if (err.response?.status === 403) {
          toast.error('Access denied. You do not have permission to view permissions.')
        } else {
          toast.error('Failed to load permissions. Please try again.')
        }
      } finally {
        isLoading.value = false
        _fetchPromise = null
      }
    })()
    return _fetchPromise
  }

  async function createPermission(payload: CreatePermissionPayload): Promise<boolean> {
    isSaving.value = true
    clearErrors()
    try {
      await permissionService.createPermission(payload)
      toast.success('Permission created successfully.')
      await fetchPermissions()
      return true
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        fieldErrors.value = err.response.data.errors
        toast.error(err.response.data.message ?? 'Please correct the errors below.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to create permission.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function updatePermission(id: number, payload: UpdatePermissionPayload): Promise<boolean> {
    isSaving.value = true
    clearErrors()
    try {
      await permissionService.updatePermission(id, payload)
      toast.success('Permission updated successfully.')
      await fetchPermissions()
      return true
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        fieldErrors.value = err.response.data.errors
        toast.error(err.response.data.message ?? 'Please correct the errors below.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to update permission.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function deletePermission(id: number): Promise<boolean> {
    isSaving.value = true
    try {
      const res = await permissionService.deletePermission(id)
      toast.success(res.data.message ?? 'Permission deleted successfully.')
      await fetchPermissions()
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to delete permission.')
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    groupedPermissions,
    isLoading,
    isSaving,
    searchQuery,
    fieldErrors,
    clearErrors,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
  }
}
