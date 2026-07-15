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
  roleFilter,
  statusFilter,
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
  reactivateUser,
  resetCredentials,
} = useUsers()

// ─── Debounced Search ─────────────────────────────────────────────────────────

let searchTimeout: ReturnType<typeof setTimeout>
watch([searchQuery, roleFilter, statusFilter, perPage], () => {
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

async function handleReactivateUser(user: User) {
  await reactivateUser(user.id)
}

async function handleResetCredentials(user: User) {
  await resetCredentials(user.id)
}

// ─── Pagination helpers ───────────────────────────────────────────────────────

/** Generate a smart page range (max 5 buttons, with ellipsis-like gaps) */
function pageRange(): number[] {
  if (lastPage.value <= 5) {
    return Array.from({ length: lastPage.value }, (_, i) => i + 1)
  }

  const pages = new Set<number>()
  pages.add(1)
  pages.add(lastPage.value)

  for (let i = Math.max(2, currentPage.value - 1); i <= Math.min(lastPage.value - 1, currentPage.value + 1); i++) {
    pages.add(i)
  }

  return [...pages].sort((a, b) => a - b)
}

const paginationPages = (): number[] => pageRange()
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
    <div class="page-header">
      <div class="page-header-text">
        <h1>User Management</h1>
        <p>Manage system accounts, roles and organisation access.</p>
      </div>

      <button id="create-user-btn" class="btn btn-primary" @click="openCreateModal">
        <BaseIcon name="plus" :size="14" />
        Create User
      </button>
    </div>

    <!-- ── Stats Row ──────────────────────────────────────────────────────── -->
    <div v-if="!isLoading && totalItems > 0" class="stats-row">
      <div class="stat-chip">
        <BaseIcon name="users" :size="14" />
        <span><strong>{{ totalItems }}</strong> total users</span>
      </div>
      <div class="stat-chip">
        <BaseIcon name="check" :size="14" />
        <span><strong>{{ users.filter(u => u.status === 'active').length }}</strong> active</span>
      </div>
    </div>

    <!-- ── Search + Filters ───────────────────────────────────────────────── -->
    <div class="toolbar-row">
      <div class="search-container">
        <span class="search-icon">
          <BaseIcon name="search" :size="15" />
        </span>
        <input
          id="user-search"
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or email…"
          class="search-input"
        />
      </div>

      <div class="filter-group">
        <select id="user-role-filter" v-model="roleFilter" class="filter-select">
          <option value="">All roles</option>
          <option value="nep_admin">NEP Admin</option>
          <option value="nep_coordinator">Coordinator</option>
          <option value="member_org">Member Organisation</option>
        </select>

        <select id="user-status-filter" v-model="statusFilter" class="filter-select">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select id="user-per-page-filter" v-model.number="perPage" class="filter-select">
          <option :value="10">10 per page</option>
          <option :value="25">25 per page</option>
          <option :value="50">50 per page</option>
          <option :value="100">100 per page</option>
        </select>
      </div>
    </div>

    <!-- ── User List Table ────────────────────────────────────────────────── -->
    <div class="table-section">
      <UserTable
        :users="users"
        :is-loading="isLoading"
        @view="openViewModal"
        @edit="openEditModal"
        @deactivate="openDeactivateModal"
        @reactivate="handleReactivateUser"
        @resetCredentials="handleResetCredentials"
      />

      <!-- Pagination footer -->
      <div
        v-if="!isLoading && totalItems > perPage"
        class="pagination-bar"
      >
        <span class="pagination-info">
          Showing {{ (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, totalItems) }}
          of {{ totalItems }}
        </span>
        <div class="pagination-btns">
          <button
            class="pg-btn"
            :disabled="currentPage === 1"
            @click="fetchUsers(currentPage - 1)"
          >
            ‹ Prev
          </button>
          <template v-for="(p, idx) in paginationPages()" :key="p">
            <span v-if="idx > 0 && p - (paginationPages()[idx - 1] ?? p) > 1" class="pg-ellipsis">…</span>
            <button
              class="pg-btn"
              :class="{ active: p === currentPage }"
              @click="fetchUsers(p)"
            >
              {{ p }}
            </button>
          </template>
          <button
            class="pg-btn"
            :disabled="currentPage === lastPage"
            @click="fetchUsers(currentPage + 1)"
          >
            Next ›
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

<style scoped>
/* ── Page Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
  }
}
.page-header-text h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.02em;
}
.page-header-text p {
  font-size: 13px;
  color: var(--ink-400);
  margin-top: 4px;
}

/* ── Stats ── */
.stats-row {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 9px;
  font-size: 12.5px;
  color: var(--ink-500);
}
.stat-chip strong {
  color: var(--ink-900);
  font-weight: 700;
}

/* ── Search + Filters ── */
.toolbar-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.search-container {
  position: relative;
  max-width: 360px;
  flex: 1 1 280px;
}
.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-400);
  pointer-events: none;
  display: flex;
}
 .search-input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 14px 10px 38px;
  font-size: 13px;
  color: var(--ink-900);
  background: var(--card);
  transition: all 0.15s ease;
}
.filter-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.filter-select {
  min-width: 150px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  padding: 10px 12px;
  font-size: 13px;
  color: var(--ink-700);
}
.search-input:focus {
  outline: none;
  border-color: var(--teal-600);
  box-shadow: 0 0 0 3px var(--teal-100);
}
.search-input::placeholder {
  color: var(--ink-300);
}

/* ── Table Section ── */
.table-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Pagination ── */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  background: var(--card);
  border: 1px solid var(--line);
  border-top: none;
  border-radius: 0 0 var(--radius) var(--radius);
}
@media (max-width: 640px) {
  .pagination-bar {
    flex-direction: column;
    gap: 10px;
  }
}
.pagination-info {
  font-size: 12px;
  color: var(--ink-400);
}
.pagination-btns {
  display: flex;
  align-items: center;
  gap: 3px;
}
.pg-btn {
  min-width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--card);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-600);
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
}
.pg-btn:hover:not(:disabled) {
  border-color: var(--teal-600);
  color: var(--teal-700);
  background: var(--teal-50);
}
.pg-btn.active {
  background: var(--teal-800);
  border-color: var(--teal-800);
  color: #fff;
}
.pg-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.pg-ellipsis {
  display: inline-flex;
  width: 28px;
  justify-content: center;
  font-size: 12px;
  color: var(--ink-400);
}
</style>
