<script setup lang="ts">
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { User } from '@/types/user'

defineProps<{
  open: boolean
  user: User | null
}>()

const emit = defineEmits<{
  close: []
}>()

/** Human-readable role labels */
const ROLE_LABELS: Record<string, string> = {
  nep_admin: 'NEP Admin',
  nep_coordinator: 'Coordinator',
  member_org: 'Member Organisation',
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  nep_admin: { bg: '#eef0fb', text: '#4338ca' },
  nep_coordinator: { bg: '#fef3e2', text: '#b45309' },
  member_org: { bg: '#e7f5f3', text: '#0f5c56' },
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="view-modal">
      <!-- Header -->
      <div class="view-header">
        <div>
          <h2>User Details</h2>
          <p>Read-only account information</p>
        </div>
        <button
          class="close-btn"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <!-- Profile Card -->
      <div v-if="user" class="view-body">
        <div class="profile-card">
          <div class="profile-avatar">
            {{ user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }}
          </div>
          <div class="profile-info">
            <h3>{{ user.name }}</h3>
            <span class="profile-email">{{ user.email }}</span>
          </div>
        </div>

        <!-- Detail Rows -->
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">
              <BaseIcon name="shield" :size="13" />
              Role
            </span>
            <span
              class="detail-role-badge"
              :style="{
                background: ROLE_COLORS[user.role]?.bg ?? '#f3f4f6',
                color: ROLE_COLORS[user.role]?.text ?? '#6b7280',
              }"
            >
              {{ ROLE_LABELS[user.role] ?? user.role }}
            </span>
          </div>

          <div class="detail-row">
            <span class="detail-label">
              <BaseIcon name="bolt" :size="13" />
              Status
            </span>
            <span class="detail-status" :class="user.status">
              <span class="status-dot" />
              {{ user.status === 'active' ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="detail-row">
            <span class="detail-label">
              <BaseIcon name="building" :size="13" />
              Organisation
            </span>
            <span class="detail-value">{{ user.organisation?.name || 'None' }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">
              <BaseIcon name="bolt" :size="13" />
              Created
            </span>
            <span class="detail-value">{{ formatDate(user.created_at) }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">
              <BaseIcon name="refresh" :size="13" />
              Last Updated
            </span>
            <span class="detail-value">{{ formatDate(user.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="view-footer">
        <button type="button" class="btn btn-secondary" @click="emit('close')">
          Close
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.view-modal {
  width: 100%;
  max-width: 460px;
}

/* Header */
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.view-header h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
}
.view-header p {
  font-size: 12px;
  color: var(--ink-400);
  margin-top: 2px;
}
.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-500);
  cursor: pointer;
  transition: all 0.12s;
  flex-shrink: 0;
}
.close-btn:hover {
  border-color: var(--ink-400);
  color: var(--ink-700);
}

/* Profile Card */
.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 12px;
  background: var(--bg);
  border: 1px solid var(--line-soft);
  margin-bottom: 20px;
}
.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--teal-700), var(--teal-900));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(10, 61, 57, 0.2);
}
.profile-info {
  min-width: 0;
}
.profile-info h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-email {
  font-size: 12.5px;
  color: var(--ink-400);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Detail Grid */
.detail-grid {
  display: flex;
  flex-direction: column;
}
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--line-soft);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-400);
}
.detail-value {
  font-size: 13px;
  color: var(--ink-900);
  font-weight: 500;
}

/* Role Badge */
.detail-role-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
}

/* Status */
.detail-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
}
.detail-status.active {
  color: var(--green-700);
}
.detail-status.inactive {
  color: var(--ink-400);
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.detail-status.active .status-dot {
  background: var(--green-700);
  box-shadow: 0 0 0 3px var(--green-100);
}
.detail-status.inactive .status-dot {
  background: var(--ink-400);
  box-shadow: 0 0 0 3px var(--line-soft);
}

/* Footer */
.view-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--line-soft);
}
</style>
