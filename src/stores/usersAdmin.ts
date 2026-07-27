import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { useUsers } from '@/composables/useUsers'
import { userService } from '@/services/user.service'
import type { User, CreateUserPayload, UpdateUserPayload } from '@/types/user'

export const useUsersAdminStore = defineStore('usersAdmin', () => {
  const usersComposable = useUsers()

  // Modal visibility and target states
  const showFormModal = ref(false)
  const editTarget = ref<User | null>(null)

  const showViewModal = ref(false)
  const viewTarget = ref<User | null>(null)

  const showDeactivateModal = ref(false)
  const deactivateTarget = ref<User | null>(null)

  // Debounced search watch logic
  let searchTimeout: ReturnType<typeof setTimeout>
  watch([
    usersComposable.searchQuery,
    usersComposable.roleFilter,
    usersComposable.statusFilter,
    usersComposable.perPage
  ], () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      usersComposable.fetchUsers(1)
    }, 350)
  })

  function openCreateModal() {
    editTarget.value = null
    showFormModal.value = true
  }

  function openEditModal(user: User) {
    editTarget.value = user
    showFormModal.value = true
  }

  async function openViewModal(user: User) {
    viewTarget.value = user
    showViewModal.value = true

    try {
      const res = await userService.getUser(user.id)
      if (showViewModal.value && viewTarget.value?.id === user.id) {
        viewTarget.value = res.data
      }
    } catch (err) {
      console.error('Failed to load fresh user details:', err)
    }
  }

  function openDeactivateModal(user: User) {
    deactivateTarget.value = user
    showDeactivateModal.value = true
  }

  async function handleFormSubmit(payload: CreateUserPayload | UpdateUserPayload) {
    let ok: boolean
    if (editTarget.value) {
      ok = await usersComposable.updateUser(editTarget.value.id, payload as UpdateUserPayload)
    } else {
      ok = await usersComposable.createUser(payload as CreateUserPayload)
    }
    if (ok) showFormModal.value = false
  }

  async function handleDeactivateConfirm() {
    if (!deactivateTarget.value) return
    const ok = await usersComposable.deactivateUser(deactivateTarget.value.id)
    if (ok) {
      showDeactivateModal.value = false
      deactivateTarget.value = null
    }
  }

  const paginationPages = computed(() => {
    const lastPage = usersComposable.lastPage.value
    const currentPage = usersComposable.currentPage.value

    if (lastPage <= 5) {
      return Array.from({ length: lastPage }, (_, i) => i + 1)
    }

    const pages = new Set<number>()
    pages.add(1)
    pages.add(lastPage)

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
      pages.add(i)
    }

    return [...pages].sort((a, b) => a - b)
  })

  async function handleReactivateUser(user: User) {
    await usersComposable.reactivateUser(user.id)
  }

  async function handleResetCredentials(user: User) {
    await usersComposable.resetCredentials(user.id)
  }

  return {
    // Composable delegates
    usersComposable,
    // Modal states
    showFormModal,
    editTarget,
    showViewModal,
    viewTarget,
    showDeactivateModal,
    deactivateTarget,
    // Actions
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeactivateModal,
    handleFormSubmit,
    handleDeactivateConfirm,
    handleReactivateUser,
    handleResetCredentials,
    paginationPages,
  }
})
