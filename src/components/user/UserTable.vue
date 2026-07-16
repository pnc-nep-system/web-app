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

<style scoped>
/* ── Wrapper ── */
.user-table-wrap {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* ── Skeleton Loading ── */
.skeleton-host {
  padding: 4px 0;
}
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line-soft);
}
.skeleton-row:last-child {
  border-bottom: none;
}
.skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(90deg, #eef3f1 25%, #e4eae8 50%, #eef3f1 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  flex-shrink: 0;
}
.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.skeleton-line {
  height: 10px;
  border-radius: 4px;
  background: linear-gradient(90deg, #eef3f1 25%, #e4eae8 50%, #eef3f1 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton-line.short {
  height: 8px;
  opacity: 0.6;
}
.skeleton-pill {
  width: 64px;
  height: 24px;
  border-radius: 12px;
  background: linear-gradient(90deg, #eef3f1 25%, #e4eae8 50%, #eef3f1 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton-pill.narrow {
  width: 52px;
}
.skeleton-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.skeleton-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(90deg, #eef3f1 25%, #e4eae8 50%, #eef3f1 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.w-24 { max-width: 96px; }
.w-28 { max-width: 112px; }
.w-36 { max-width: 144px; }
.w-48 { max-width: 192px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.hidden-mobile {
  display: none;
}
@media (min-width: 768px) {
  .hidden-mobile { display: block; }
}

/* ── Table (desktop) ── */
.u-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  display: none;
}
@media (min-width: 768px) {
  .u-table { display: table; }
}

.u-table thead tr {
  border-bottom: 1px solid var(--line);
}
.u-table th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-400);
  text-align: left;
  white-space: nowrap;
  background: var(--bg);
}
.u-table th:last-child {
  text-align: right;
}

/* Column widths */
.col-user   { width: 28%; }
.col-role   { width: 13%; }
.col-status { width: 11%; }
.col-org    { width: 18%; }
.col-date   { width: 14%; }
.col-actions { width: 16%; }

.u-row {
  border-bottom: 1px solid var(--line-soft);
  transition: background 0.15s ease;
}
.u-row:last-child {
  border-bottom: none;
}
.u-row:hover {
  background: var(--teal-50);
}

.u-table td {
  padding: 14px 16px;
  font-size: 13px;
  color: var(--ink-700);
  vertical-align: middle;
}
.u-table td:last-child {
  text-align: right;
}

/* ── User Cell ── */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--teal-700), var(--teal-900));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(10, 61, 57, 0.18);
}
.avatar.sm {
  width: 34px;
  height: 34px;
  font-size: 11px;
  border-radius: 9px;
}
.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.user-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-email {
  font-size: 12px;
  color: var(--ink-400);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Role Badge ── */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.role-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Organisation ── */
.org-name {
  font-size: 12.5px;
  color: var(--ink-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.org-none {
  font-size: 12.5px;
  color: var(--ink-300);
}

/* ── Date ── */
.col-date {
  font-size: 12.5px;
  color: var(--ink-400);
  white-space: nowrap;
}

/* ── Action Buttons ── */
.action-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-500);
  cursor: pointer;
  transition: all 0.15s ease;
}
.action-btn:hover {
  border-color: var(--teal-600);
  color: var(--teal-700);
  background: var(--teal-50);
  box-shadow: 0 1px 4px rgba(20, 107, 99, 0.1);
}
.action-btn.danger:hover {
  border-color: var(--red-600);
  color: var(--red-600);
  background: var(--red-100);
  box-shadow: 0 1px 4px rgba(220, 38, 38, 0.1);
}

/* ── Mobile Cards ── */
.mobile-cards {
  display: flex;
  flex-direction: column;
}
@media (min-width: 768px) {
  .mobile-cards { display: none; }
}

.mobile-card {
  padding: 16px 18px;
  border-bottom: 1px solid var(--line-soft);
}
.mobile-card:last-child {
  border-bottom: none;
}
.mobile-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mobile-card-header .user-info {
  flex: 1;
  min-width: 0;
}
.mobile-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  padding-left: 44px;
}
.meta-text {
  font-size: 12px;
  color: var(--ink-600);
}
.meta-text.dim {
  color: var(--ink-400);
}
.mobile-card-actions {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  padding-left: 44px;
}
</style>
