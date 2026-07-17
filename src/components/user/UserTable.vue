<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import UserStatusBadge from './UserStatusBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import type { User } from '@/types/user'

defineProps<{
  users: User[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  view: [user: User]
  edit: [user: User]
  deactivate: [user: User]
  reactivate: [user: User]
  resetCredentials: [user: User]
}>()

/** Human-readable role labels */
const ROLE_LABELS: Record<string, string> = {
  nep_admin: 'Admin',
  nep_coordinator: 'Coordinator',
  member_org: 'Member',
}

/** Role → colour tokens */
const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  nep_admin: { bg: '#eef0fb', text: '#4338ca', dot: '#6366f1' },
  nep_coordinator: { bg: '#fef3e2', text: '#b45309', dot: '#f59e0b' },
  member_org: { bg: '#e7f5f3', text: '#0f5c56', dot: '#14b8a6' },
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

function roleColor(role: string) {
  return ROLE_COLORS[role] ?? { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' }
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="user-table-wrap">
    <!-- ─── Loading Skeletons ─── -->
    <div v-if="isLoading" class="skeleton-host">
      <div v-for="n in 6" :key="n" class="skeleton-row">
        <div class="skeleton-avatar" />
        <div class="skeleton-lines">
          <div class="skeleton-line w-36" />
          <div class="skeleton-line w-48 short" />
        </div>
        <div class="skeleton-pill" />
        <div class="skeleton-pill narrow" />
        <div class="skeleton-line w-28 hidden-mobile" />
        <div class="skeleton-line w-24 hidden-mobile" />
        <div class="skeleton-actions">
          <div class="skeleton-btn" />
          <div class="skeleton-btn" />
        </div>
      </div>
    </div>

    <!-- ─── Empty State ─── -->
    <EmptyState
      v-else-if="users.length === 0"
      icon="users"
      title="No users found"
      message="Try adjusting your search or create a new user."
    />

    <!-- ─── Desktop Table ─── -->
    <template v-else>
      <table class="u-table">
        <thead>
          <tr>
            <th class="col-user">User</th>
            <th class="col-role">Role</th>
            <th class="col-status">Status</th>
            <th class="col-org">Organisation</th>
            <th class="col-date">Created</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="u-row">
            <!-- Avatar + Name + Email -->
            <td class="col-user">
              <div class="user-cell">
                <div class="avatar">
                  {{ initials(user.name) }}
                </div>
                <div class="user-info">
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
              </div>
            </td>

            <!-- Role -->
            <td class="col-role">
              <span
                class="role-badge"
                :style="{
                  background: roleColor(user.role).bg,
                  color: roleColor(user.role).text,
                }"
              >
                <span
                  class="role-dot"
                  :style="{ background: roleColor(user.role).dot }"
                />
                {{ roleLabel(user.role) }}
              </span>
            </td>

            <!-- Status -->
            <td class="col-status">
              <UserStatusBadge :status="user.status" />
            </td>

            <!-- Organisation -->
            <td class="col-org">
              <span v-if="user.organisation" class="org-name">
                {{ user.organisation.name }}
              </span>
              <span v-else class="org-none">—</span>
            </td>

            <!-- Created -->
            <td class="col-date">
              {{ formatDate(user.created_at) }}
            </td>

            <!-- Actions -->
            <td class="col-actions">
              <div class="action-group">
                <button class="action-btn" title="View details" @click="emit('view', user)">
                  <BaseIcon name="eye" :size="14" />
                </button>
                <button class="action-btn" title="Edit user" @click="emit('edit', user)">
                  <BaseIcon name="edit" :size="14" />
                </button>
                <button
                  v-if="user.status === 'active'"
                  class="action-btn danger"
                  title="Deactivate account"
                  @click="emit('deactivate', user)"
                >
                  <BaseIcon name="lock" :size="14" />
                </button>
                <button
                  v-else
                  class="action-btn"
                  title="Reactivate account"
                  @click="emit('reactivate', user)"
                >
                  <BaseIcon name="refresh" :size="14" />
                </button>

              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ─── Mobile Cards (< 768px) ─── -->
      <div class="mobile-cards">
        <div v-for="user in users" :key="user.id" class="mobile-card">
          <div class="mobile-card-header">
            <div class="avatar sm">{{ initials(user.name) }}</div>
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <UserStatusBadge :status="user.status" />
          </div>
          <div class="mobile-card-meta">
            <span
              class="role-badge"
              :style="{
                background: roleColor(user.role).bg,
                color: roleColor(user.role).text,
              }"
            >
              <span class="role-dot" :style="{ background: roleColor(user.role).dot }" />
              {{ roleLabel(user.role) }}
            </span>
            <span v-if="user.organisation" class="meta-text">{{ user.organisation.name }}</span>
            <span class="meta-text dim">{{ formatDate(user.created_at) }}</span>
          </div>
          <div class="mobile-card-actions">
            <button class="btn btn-secondary btn-sm" @click="emit('view', user)">
              <BaseIcon name="eye" :size="13" /> View
            </button>
            <button class="btn btn-secondary btn-sm" @click="emit('edit', user)">
              <BaseIcon name="edit" :size="13" /> Edit
            </button>
            <button
              v-if="user.status === 'active'"
              class="btn btn-danger-ghost btn-sm"
              @click="emit('deactivate', user)"
            >
              <BaseIcon name="lock" :size="13" /> Deactivate
            </button>
            <button
              v-else
              class="btn btn-secondary btn-sm"
              @click="emit('reactivate', user)"
            >
              <BaseIcon name="refresh" :size="13" /> Reactivate
            </button>

          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped src="@/assets/styles/UserTable.css"></style>
