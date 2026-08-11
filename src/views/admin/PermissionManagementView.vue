<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import PermissionTable from '@/components/permission/PermissionTable.vue'
import PermissionFormModal from '@/components/permission/PermissionFormModal.vue'
import ConfirmDeletePermissionModal from '@/components/permission/ConfirmDeletePermissionModal.vue'
import ToastHost from '@/components/ToastHost.vue'
import { usePermission } from '@/composables/usePermission'
import { usePermissionsAdminStore } from '@/stores/permissionsAdmin'

const { can } = usePermission()
const router = useRouter()
const store = usePermissionsAdminStore()
const permissions = store.permissionsComposable

onMounted(async () => {
  if (!can('permissions.view')) {
    router.replace({ name: 'forbidden' })
    return
  }
  await permissions.fetchPermissions()
})
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Permission Management" />
    </template>

    <PageHeader title="Permission Management" subtitle="Define the specific actions users can be granted through roles.">
      <button v-if="can('permissions.create')" class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] text-white text-xs font-bold rounded-xl hover:bg-[#0c483d] transition-all shadow-2xs cursor-pointer self-start sm:self-auto" @click="store.openCreateModal">
        <BaseIcon name="plus" :size="15" />
        Create Permission
      </button>
    </PageHeader>

    <div class="flex gap-3 items-center flex-wrap mb-4">
      <div class="relative w-full md:w-[360px]">
        <span class="absolute left-[13px] top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none flex">
          <BaseIcon name="search" :size="15" />
        </span>
        <input
          v-model="permissions.searchQuery"
          type="text"
          placeholder="Search permissions…"
          class="w-full border border-[var(--line)] rounded-xl py-2.5 pl-9.5 pr-3.5 text-xs text-[var(--ink-900)] bg-[var(--card)] focus:outline-none focus:border-[var(--teal-600)] focus:ring-3 focus:ring-[var(--teal-100)] placeholder:text-[var(--ink-300)]"
        />
      </div>
    </div>

    <PermissionTable
      :grouped-permissions="permissions.groupedPermissions"
      :is-loading="permissions.isLoading"
      @edit="store.openEditModal"
      @delete="store.openDeleteModal"
    />

    <PermissionFormModal
      :open="store.showFormModal"
      :edit-permission="store.editTarget"
      :is-saving="permissions.isSaving"
      :grouped-permissions="permissions.groupedPermissions"
      :backend-errors="permissions.fieldErrors"
      @close="store.showFormModal = false"
      @submit="store.handleFormSubmit"
    />

    <ConfirmDeletePermissionModal
      :open="store.showDeleteModal"
      :permission="store.deleteTarget"
      :is-loading="permissions.isSaving"
      @confirm="store.handleDeleteConfirm"
      @cancel="store.showDeleteModal = false"
    />

    <ToastHost />
  </AppShell>
</template>
