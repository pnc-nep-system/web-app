<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import UserTable from '@/components/user/UserTable.vue'
import UserFormModal from '@/components/user/UserFormModal.vue'
import UserViewModal from '@/components/user/UserViewModal.vue'
import ConfirmDeactivateModal from '@/components/user/ConfirmDeactivateModal.vue'
import ToastHost from '@/components/ToastHost.vue'
import { useUsersAdminStore } from '@/stores/usersAdmin'

const store = useUsersAdminStore()
const usersComposable = store.usersComposable
</script>

<template>
  <!-- ── Page Header ── -->
  <div class="page-header">
    <div class="page-header-text">
      <h1>User Management</h1>
      <p>Manage system accounts, roles and organisation access.</p>
    </div>

    <button id="create-user-btn" class="btn btn-primary" @click="store.openCreateModal">
      <BaseIcon name="plus" :size="14" />
      Create User
    </button>
  </div>

  <!-- ── Stats Row ── -->
  <div v-if="!usersComposable.isLoading && usersComposable.totalItems > 0" class="stats-row">
    <div class="stat-chip">
      <BaseIcon name="users" :size="14" />
      <span><strong>{{ usersComposable.totalItems }}</strong> total users</span>
    </div>
    <div class="stat-chip">
      <BaseIcon name="check" :size="14" />
      <span><strong>{{ usersComposable.users.filter(u => u.status === 'active').length }}</strong> active</span>
    </div>
  </div>

  <!-- ── Search + Filters ── -->
  <div class="toolbar-row">
    <div class="search-container">
      <span class="search-icon">
        <BaseIcon name="search" :size="15" />
      </span>
      <input
        id="user-search"
        v-model="usersComposable.searchQuery"
        type="text"
        placeholder="Search by name or email…"
        class="search-input"
      />
    </div>

    <div class="filter-group">
      <select id="user-role-filter" v-model="usersComposable.roleFilter" class="filter-select">
        <option value="">All roles</option>
        <option value="nep_admin">NEP Admin</option>
        <option value="nep_coordinator">Coordinator</option>
        <option value="member_org">Member Organisation</option>
      </select>

      <select id="user-status-filter" v-model="usersComposable.statusFilter" class="filter-select">
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <select id="user-per-page-filter" v-model.number="usersComposable.perPage" class="filter-select">
        <option :value="10">10 per page</option>
        <option :value="25">25 per page</option>
        <option :value="50">50 per page</option>
        <option :value="100">100 per page</option>
      </select>
    </div>
  </div>

  <!-- ── User List Table ── -->
  <div class="table-section">
    <UserTable
      :users="usersComposable.users"
      :is-loading="usersComposable.isLoading"
      @view="store.openViewModal"
      @edit="store.openEditModal"
      @deactivate="store.openDeactivateModal"
      @reactivate="store.handleReactivateUser"
      @resetCredentials="store.handleResetCredentials"
    />

    <!-- Pagination footer -->
    <div
      v-if="!usersComposable.isLoading && usersComposable.totalItems > usersComposable.perPage"
      class="pagination-bar"
    >
      <span class="pagination-info">
        Showing {{ (usersComposable.currentPage - 1) * usersComposable.perPage + 1 }}–{{ Math.min(usersComposable.currentPage * usersComposable.perPage, usersComposable.totalItems) }}
        of {{ usersComposable.totalItems }}
      </span>
      <div class="pagination-btns">
        <button
          class="pg-btn"
          :disabled="usersComposable.currentPage === 1"
          @click="usersComposable.fetchUsers(usersComposable.currentPage - 1)"
        >
          ‹ Prev
        </button>
        <template v-for="(p, idx) in store.paginationPages" :key="p">
          <span v-if="idx > 0 && p - (store.paginationPages[idx - 1] ?? p) > 1" class="pg-ellipsis">…</span>
          <button
            class="pg-btn"
            :class="{ active: p === usersComposable.currentPage }"
            @click="usersComposable.fetchUsers(p)"
          >
            {{ p }}
          </button>
        </template>
        <button
          class="pg-btn"
          :disabled="usersComposable.currentPage === usersComposable.lastPage"
          @click="usersComposable.fetchUsers(usersComposable.currentPage + 1)"
        >
          Next ›
        </button>
      </div>
    </div>
  </div>

  <!-- ── Modals ── -->
  <UserFormModal
    :open="store.showFormModal"
    :edit-user="store.editTarget"
    :is-saving="usersComposable.isSaving"
    :organisations="usersComposable.organisations"
    :backend-errors="usersComposable.fieldErrors"
    @close="store.showFormModal = false"
    @submit="store.handleFormSubmit"
  />

  <UserViewModal
    :open="store.showViewModal"
    :user="store.viewTarget"
    @close="store.showViewModal = false"
  />

  <ConfirmDeactivateModal
    :open="store.showDeactivateModal"
    :user="store.deactivateTarget"
    :is-loading="usersComposable.isSaving"
    @confirm="store.handleDeactivateConfirm"
    @cancel="store.showDeactivateModal = false"
  />

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
