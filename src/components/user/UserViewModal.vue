<script setup lang="ts">
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import UserStatusBadge from './UserStatusBadge.vue'
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
    <div class="w-full" style="max-width: 480px">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-base font-semibold text-[var(--ink-900)]">User Details</h2>
          <p class="text-xs text-[var(--ink-400)] mt-0.5">Read-only profile information.</p>
        </div>
        <button
          class="icon-btn"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <!-- User Profile Content -->
      <div v-if="user" class="space-y-4">
        <!-- Initials Avatar & Name Block -->
        <div class="flex items-center gap-4 p-4 rounded-lg bg-[var(--bg)] border border-[var(--line-soft)]">
          <div
            class="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-teal-800
                   flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
          >
            {{ user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }}
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-[var(--ink-900)] truncate">{{ user.name }}</h3>
            <p class="text-xs text-[var(--ink-500)] truncate">{{ user.email }}</p>
          </div>
        </div>

        <!-- Detail Fields -->
        <div class="divide-y divide-[var(--line-soft)] text-xs">
          <!-- Role -->
          <div class="py-3 flex justify-between items-center">
            <span class="text-[var(--ink-500)] font-medium">System Role</span>
            <span class="font-semibold text-[var(--ink-900)]">
              {{ ROLE_LABELS[user.role] ?? user.role }}
            </span>
          </div>

          <!-- Status -->
          <div class="py-3 flex justify-between items-center">
            <span class="text-[var(--ink-500)] font-medium">Status</span>
            <UserStatusBadge :status="user.status" />
          </div>

          <!-- Organisation -->
          <div class="py-3 flex justify-between items-center">
            <span class="text-[var(--ink-500)] font-medium">Organisation</span>
            <span class="font-semibold text-[var(--ink-900)]">
              {{ user.organisation?.name || 'None' }}
            </span>
          </div>

          <!-- Created At -->
          <div class="py-3 flex justify-between items-center">
            <span class="text-[var(--ink-500)] font-medium">Created Date</span>
            <span class="text-[var(--ink-900)]">{{ formatDate(user.created_at) }}</span>
          </div>

          <!-- Updated At -->
          <div class="py-3 flex justify-between items-center">
            <span class="text-[var(--ink-500)] font-medium">Last Updated</span>
            <span class="text-[var(--ink-900)]">{{ formatDate(user.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end mt-6">
        <button type="button" class="btn btn-secondary" @click="emit('close')">
          Close Details
        </button>
      </div>
    </div>
  </BaseModal>
</template>
