import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useRoles } from '@/composables/useRoles'
import { usePermissions } from '@/composables/usePermissions'
import type { Role, CreateRolePayload, UpdateRolePayload } from '@/types/role'

export const useRolesAdminStore = defineStore('rolesAdmin', () => {
  const rolesComposable = useRoles()
  const permissionsComposable = usePermissions()

  // Create/Edit modal
  const showFormModal = ref(false)
  const editTarget = ref<Role | null>(null)

  // Delete confirmation modal
  const showDeleteModal = ref(false)
  const deleteTarget = ref<Role | null>(null)

  // Manage users (assign/remove) modal
  const showUsersModal = ref(false)
  const usersTarget = ref<Role | null>(null)

  let searchTimeout: ReturnType<typeof setTimeout>
  watch(rolesComposable.searchQuery, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      rolesComposable.fetchRoles()
    }, 350)
  })

  function openCreateModal() {
    editTarget.value = null
    showFormModal.value = true
  }

  function openEditModal(role: Role) {
    editTarget.value = role
    showFormModal.value = true
  }

  function openDeleteModal(role: Role) {
    deleteTarget.value = role
    showDeleteModal.value = true
  }

  function openUsersModal(role: Role) {
    usersTarget.value = role
    showUsersModal.value = true
  }

  async function handleFormSubmit(payload: CreateRolePayload | UpdateRolePayload) {
    let ok: boolean
    if (editTarget.value) {
      ok = await rolesComposable.updateRole(editTarget.value.id, payload as UpdateRolePayload)
    } else {
      ok = await rolesComposable.createRole(payload as CreateRolePayload)
    }
    if (ok) showFormModal.value = false
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget.value) return
    const ok = await rolesComposable.deleteRole(deleteTarget.value.id)
    if (ok) {
      showDeleteModal.value = false
      deleteTarget.value = null
    }
  }

  async function handleAssignUser(userId: number) {
    if (!usersTarget.value) return
    const ok = await rolesComposable.assignToUser(usersTarget.value.id, userId)
    if (ok) {
      // Keep the modal's target in sync with the freshly-refetched role list.
      usersTarget.value = rolesComposable.roles.value.find((r) => r.id === usersTarget.value?.id) ?? usersTarget.value
    }
  }

  async function handleRemoveUser(userId: number) {
    if (!usersTarget.value) return
    const ok = await rolesComposable.removeFromUser(usersTarget.value.id, userId)
    if (ok) {
      usersTarget.value = rolesComposable.roles.value.find((r) => r.id === usersTarget.value?.id) ?? usersTarget.value
    }
  }

  return {
    rolesComposable,
    permissionsComposable,
    showFormModal,
    editTarget,
    showDeleteModal,
    deleteTarget,
    showUsersModal,
    usersTarget,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    openUsersModal,
    handleFormSubmit,
    handleDeleteConfirm,
    handleAssignUser,
    handleRemoveUser,
  }
})
