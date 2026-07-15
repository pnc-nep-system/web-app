import { ref } from 'vue'
import { userService, type OrganisationOption } from '@/api/user.service'
import { useToast } from '@/utils/toast'
import type { User, CreateUserPayload, UpdateUserPayload } from '@/types/user'

/**
 * Composable that manages users API requests, pagination, search, and validation.
 */
export function useUsers() {
  const toast = useToast()

  const users = ref<User[]>([])
  const organisations = ref<OrganisationOption[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  
  // Search and Pagination State
  const searchQuery = ref('')
  const currentPage = ref(1)
  const lastPage = ref(1)
  const totalItems = ref(0)
  const perPage = ref(50)

  // Validation/Error States
  const fieldErrors = ref<Record<string, string[]>>({})

  /** Clear any validation or field errors. */
  function clearErrors() {
    fieldErrors.value = {}
  }

  /** Fetch available organisations for selection. */
  async function fetchOrganisations(): Promise<void> {
    try {
      const res = await userService.getOrganisations()
      organisations.value = res.data.data ?? []
    } catch (err) {
      console.error('Failed to load organisations:', err)
    }
  }

  /** Fetch the paginated and filtered list of users from backend. */
  async function fetchUsers(page = currentPage.value): Promise<void> {
    isLoading.value = true
    clearErrors()
    try {
      const res = await userService.getUsers(page, searchQuery.value)
      const payload = res.data
      
      users.value = payload.data ?? []
      currentPage.value = payload.current_page ?? 1
      lastPage.value = payload.last_page ?? 1
      totalItems.value = payload.total ?? 0
      perPage.value = payload.per_page ?? 50
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Access denied. Admin only.')
      } else {
        toast.error('Failed to load users. Please try again.')
      }
    } finally {
      isLoading.value = false
    }
  }

  /** Create a new user. Returns true on success. */
  async function createUser(payload: CreateUserPayload): Promise<boolean> {
    isSaving.value = true
    clearErrors()
    try {
      await userService.createUser(payload)
      toast.success('User created successfully.')
      // Refresh user list and reset to page 1 to see the new user
      await fetchUsers(1)
      return true
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        fieldErrors.value = err.response.data.errors
        toast.error(err.response.data.message ?? 'Please correct the errors below.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to create user.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Update an existing user. Returns true on success. */
  async function updateUser(id: number, payload: UpdateUserPayload): Promise<boolean> {
    isSaving.value = true
    clearErrors()
    try {
      await userService.updateUser(id, payload)
      toast.success('User updated successfully.')
      // Refresh current page to preserve page and search results
      await fetchUsers(currentPage.value)
      return true
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        fieldErrors.value = err.response.data.errors
        toast.error(err.response.data.message ?? 'Please correct the errors below.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to update user.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Deactivate a user account. Returns true on success. */
  async function deactivateUser(id: number): Promise<boolean> {
    isSaving.value = true
    try {
      await userService.deactivateUser(id)
      toast.success('User deactivated successfully.')
      // Refresh current page
      await fetchUsers(currentPage.value)
      return true
    } catch (err: any) {
      if (err.response?.status === 422) {
        toast.error(err.response.data?.message ?? 'User is already inactive.')
      } else {
        toast.error(err.response?.data?.message ?? 'Failed to deactivate user.')
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    users,
    organisations,
    isLoading,
    isSaving,
    searchQuery,
    currentPage,
    lastPage,
    totalItems,
    perPage,
    fieldErrors,
    clearErrors,
    fetchOrganisations,
    fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
  }
}

