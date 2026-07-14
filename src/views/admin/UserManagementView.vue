<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '@/components/AppShell.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import UserTable from '@/components/user/UserTable.vue'
import UserFormModal from '@/components/user/UserFormModal.vue'
import UserViewModal from '@/components/user/UserViewModal.vue'
import ConfirmDeactivateModal from '@/components/user/ConfirmDeactivateModal.vue'
import ToastHost from '@/components/ToastHost.vue'

import { usePermission } from '@/composables/usePermission'
import { useUsers } from '@/composables/useUsers'
import { userService } from '@/api/user.service'

import type { User, CreateUserPayload, UpdateUserPayload } from '@/types/user'

// ─── Auth guard ───────────────────────────────────────────────────────────────

const { isAdmin } = usePermission()
const router = useRouter()

onMounted(async () => {
  if (!isAdmin.value) {
    router.replace({ name: 'forbidden' })
    return
  }
  // Load users and organisation options
  await Promise.all([
    fetchUsers(1),
    fetchOrganisations(),
  ])
})

// ─── Users state ──────────────────────────────────────────────────────────────

const {
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
  fetchOrganisations,
  fetchUsers,
  createUser,
  updateUser,
  deactivateUser,
} = useUsers()

// ─── Debounced Search ─────────────────────────────────────────────────────────

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchUsers(1)
  }, 350)
})

// ─── Modal state ──────────────────────────────────────────────────────────────

const showFormModal = ref(false)
const editTarget = ref<User | null>(null)

const showViewModal = ref(false)
const viewTarget = ref<User | null>(null)

const showDeactivateModal = ref(false)
const deactivateTarget = ref<User | null>(null)

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
  
  // Eagerly fetch up-to-date user details
  try {
    const res = await userService.getUser(user.id)
    // Make sure we only assign if the modal is still open and for the same user
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

// ─── CRUD handlers ────────────────────────────────────────────────────────────

async function handleFormSubmit(payload: CreateUserPayload | UpdateUserPayload) {
  let ok: boolean

  if (editTarget.value) {
    ok = await updateUser(editTarget.value.id, payload as UpdateUserPayload)
  } else {
    ok = await createUser(payload as CreateUserPayload)
  }

  if (ok) showFormModal.value = false
}

async function handleDeactivateConfirm() {
  if (!deactivateTarget.value) return
  const ok = await deactivateUser(deactivateTarget.value.id)
  if (ok) {
    showDeactivateModal.value = false
    deactivateTarget.value = null
  }
}
</script>

<template>
  <AppShell>
    <!-- ── Breadcrumb ─────────────────────────────────────────────────────── -->
    <template #header>
      <span class="text-gray-400">Admin</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">User Management</span>
    </template>

    <!-- ── Page Header ────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-[var(--ink-900)]">User Management</h1>
        <p class="text-xs text-[var(--ink-400)] mt-0.5">
          Manage system accounts, roles and organisation access permissions.
        </p>
      </div>

      <button id="create-user-btn" class="btn btn-primary shrink-0" @click="openCreateModal">
        <BaseIcon name="plus" :size="14" />
        Create User
      </button>
    </div>

    <!-- ── Search & Filter ────────────────────────────────────────────────── -->
    <div class="relative mb-4 max-w-sm">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none">
        <BaseIcon name="search" :size="15" />
      </span>
      <input
        id="user-search"
        v-model="searchQuery"
        type="text"
        placeholder="Search by name or email…"
        class="w-full border border-[var(--line)] rounded-lg pl-9 pr-4 py-2.5
               text-sm text-[var(--ink-900)] bg-white
               focus:outline-none focus:border-[var(--teal-600)] focus:ring-2 focus:ring-[var(--teal-100)]
               transition"
      />
    </div>

    <!-- ── User List Table ────────────────────────────────────────────────── -->
    <div class="space-y-4">
      <UserTable
        :users="users"
        :is-loading="isLoading"
        @view="openViewModal"
        @edit="openEditModal"
        @deactivate="openDeactivateModal"
      />

      <!-- Pagination footer -->
      <div
        v-if="!isLoading && totalItems > 0"
        class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4
               card bg-white"
      >
        <span class="text-xs text-[var(--ink-500)]">
          Showing {{ totalItems > 0 ? (currentPage - 1) * perPage + 1 : 0 }} to
          {{ Math.min(currentPage * perPage, totalItems) }} of {{ totalItems }} users
        </span>
        <div class="flex items-center gap-1.5">
          <button
            class="btn btn-secondary btn-sm"
            :disabled="currentPage === 1"
            @click="fetchUsers(currentPage - 1)"
          >
            Previous
          </button>
          <button
            v-for="p in lastPage"
            :key="p"
            class="btn btn-sm"
            :class="p === currentPage ? 'btn-primary' : 'btn-secondary'"
            @click="fetchUsers(p)"
          >
            {{ p }}
          </button>
          <button
            class="btn btn-secondary btn-sm"
            :disabled="currentPage === lastPage"
            @click="fetchUsers(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modals ─────────────────────────────────────────────────────────── -->
    <UserFormModal
      :open="showFormModal"
      :edit-user="editTarget"
      :is-saving="isSaving"
      :organisations="organisations"
      :backend-errors="fieldErrors"
      @close="showFormModal = false"
      @submit="handleFormSubmit"
    />

    <UserViewModal
      :open="showViewModal"
      :user="viewTarget"
      @close="showViewModal = false"
    />

    <ConfirmDeactivateModal
      :open="showDeactivateModal"
      :user="deactivateTarget"
      :is-loading="isSaving"
      @confirm="handleDeactivateConfirm"
      @cancel="showDeactivateModal = false"
    />
  </AppShell>

  <!-- Toast notifications -->
  <ToastHost />
</template>

