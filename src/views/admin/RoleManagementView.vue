<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import RoleTable from '@/components/role/RoleTable.vue'
import RoleFormModal from '@/components/role/RoleFormModal.vue'
import ConfirmDeleteRoleModal from '@/components/role/ConfirmDeleteRoleModal.vue'
import RoleUsersModal from '@/components/role/RoleUsersModal.vue'
import ToastHost from '@/components/ToastHost.vue'
import { usePermission } from '@/composables/usePermission'
import { useRolesAdminStore } from '@/stores/rolesAdmin'

const { can } = usePermission()
const router = useRouter()
const store = useRolesAdminStore()
const roles = store.rolesComposable
const permissions = store.permissionsComposable

onMounted(async () => {
  if (!can('roles.view')) {
    router.replace({ name: 'forbidden' })
    return
  }
  await Promise.all([roles.fetchRoles(), permissions.fetchPermissions()])
})
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Role Management" />
    </template>

    <PageHeader title="Role Management" subtitle="Define roles and control which permissions they grant.">
      <button v-if="can('roles.create')" class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] text-white text-xs font-bold rounded-xl hover:bg-[#0c483d] transition-all shadow-2xs cursor-pointer self-start sm:self-auto" @click="store.openCreateModal">
        <BaseIcon name="plus" :size="15" />
        Create Role
      </button>
    </PageHeader>

    <!-- Search -->
    <div class="flex gap-3 items-center flex-wrap mb-4">
      <div class="relative w-full md:w-[360px]">
        <span class="absolute left-[13px] top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none flex">
          <BaseIcon name="search" :size="15" />
        </span>
        <input
          v-model="roles.searchQuery"
          type="text"
          placeholder="Search roles…"
          class="w-full border border-[var(--line)] rounded-xl py-2.5 pl-9.5 pr-3.5 text-xs text-[var(--ink-900)] bg-[var(--card)] focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)] placeholder:text-[var(--ink-300)]"
        />
      </div>
    </div>

    <RoleTable
      :roles="roles.roles"
      :is-loading="roles.isLoading"
      @edit="store.openEditModal"
      @delete="store.openDeleteModal"
      @manage-users="store.openUsersModal"
    />

    <RoleFormModal
      :open="store.showFormModal"
      :edit-role="store.editTarget"
      :is-saving="roles.isSaving"
      :grouped-permissions="permissions.groupedPermissions"
      :backend-errors="roles.fieldErrors"
      @close="store.showFormModal = false"
      @submit="store.handleFormSubmit"
    />

    <ConfirmDeleteRoleModal
      :open="store.showDeleteModal"
      :role="store.deleteTarget"
      :is-loading="roles.isSaving"
      @confirm="store.handleDeleteConfirm"
      @cancel="store.showDeleteModal = false"
    />

    <RoleUsersModal
      :open="store.showUsersModal"
      :role="store.usersTarget"
      @close="store.showUsersModal = false"
      @assign="store.handleAssignUser"
      @remove="store.handleRemoveUser"
    />

    <ToastHost />
  </AppShell>
</template>
