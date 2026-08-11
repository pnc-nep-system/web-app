import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import type { Permission, CreatePermissionPayload, UpdatePermissionPayload } from '@/types/role'

export const usePermissionsAdminStore = defineStore('permissionsAdmin', () => {
  const permissionsComposable = usePermissions()

  const showFormModal = ref(false)
  const editTarget = ref<Permission | null>(null)

  const showDeleteModal = ref(false)
  const deleteTarget = ref<Permission | null>(null)

  let searchTimeout: ReturnType<typeof setTimeout>
  watch(permissionsComposable.searchQuery, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      permissionsComposable.fetchPermissions()
    }, 350)
  })

  function openCreateModal() {
    editTarget.value = null
    showFormModal.value = true
  }

  function openEditModal(permission: Permission) {
    editTarget.value = permission
    showFormModal.value = true
  }

  function openDeleteModal(permission: Permission) {
    deleteTarget.value = permission
    showDeleteModal.value = true
  }

  async function handleFormSubmit(payload: CreatePermissionPayload | UpdatePermissionPayload) {
    let ok: boolean
    if (editTarget.value) {
      ok = await permissionsComposable.updatePermission(editTarget.value.id, payload as UpdatePermissionPayload)
    } else {
      ok = await permissionsComposable.createPermission(payload as CreatePermissionPayload)
    }
    if (ok) showFormModal.value = false
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget.value) return
    const ok = await permissionsComposable.deletePermission(deleteTarget.value.id)
    if (ok) {
      showDeleteModal.value = false
      deleteTarget.value = null
    }
  }

  return {
    permissionsComposable,
    showFormModal,
    editTarget,
    showDeleteModal,
    deleteTarget,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    handleFormSubmit,
    handleDeleteConfirm,
  }
})
