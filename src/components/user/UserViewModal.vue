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
    <div class="w-full max-w-[460px]">
      <!-- Header -->
      <div class="flex items-start justify-between mb-5">
        <div>
          <h2 class="text-base font-bold text-[var(--ink-900)]">User Details</h2>
          <p class="text-xs text-[var(--ink-400)] mt-0.5">Read-only account information</p>
        </div>
        <button
          class="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-120 shrink-0 hover:border-[var(--ink-400)] hover:text-[var(--ink-700)]"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <!-- Profile Card -->
      <div v-if="user" class="space-y-5">
        <div class="flex items-center gap-3.5 p-4 rounded-xl bg-[var(--bg)] border border-[var(--line-soft)]">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-[0_3px_8px_rgba(10,61,57,0.2)]">
            {{ user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }}
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-[var(--ink-900)] whitespace-nowrap overflow-hidden text-ellipsis">{{ user.name }}</h3>
            <span class="text-[12.5px] text-[var(--ink-400)] block whitespace-nowrap overflow-hidden text-ellipsis">{{ user.email }}</span>
          </div>
        </div>

        <!-- Detail Rows -->
        <div class="flex flex-col">
          <div class="flex items-center justify-between py-3 border-b border-[var(--line-soft)]">
            <span class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-400)]">
              <BaseIcon name="shield" :size="13" />
              Role
            </span>
            <span
              class="inline-flex px-2.5 py-1 rounded-md text-[11.5px] font-bold"
              :style="{
                background: ROLE_COLORS[user.role]?.bg ?? '#f3f4f6',
                color: ROLE_COLORS[user.role]?.text ?? '#6b7280',
              }"
            >
              {{ ROLE_LABELS[user.role] ?? user.role }}
            </span>
          </div>

          <div class="flex items-center justify-between py-3 border-b border-[var(--line-soft)]">
            <span class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-400)]">
              <BaseIcon name="bolt" :size="13" />
              Status
            </span>
            <span
              class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
              :class="user.status === 'active' ? 'text-[var(--green-700)]' : 'text-[var(--ink-400)]'"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="user.status === 'active' ? 'bg-[var(--green-700)] shadow-[0_0_0_3px_var(--green-100)]' : 'bg-[var(--ink-400)] shadow-[0_0_0_3px_var(--line-soft)]'"
              />
              {{ user.status === 'active' ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="flex items-center justify-between py-3 border-b border-[var(--line-soft)]">
            <span class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-400)]">
              <BaseIcon name="building" :size="13" />
              Organisation
            </span>
            <span class="text-xs text-[var(--ink-900)] font-medium">{{ user.organisation?.name || 'None' }}</span>
          </div>

          <div class="flex items-center justify-between py-3 border-b border-[var(--line-soft)]">
            <span class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-400)]">
              <BaseIcon name="bolt" :size="13" />
              Created
            </span>
            <span class="text-xs text-[var(--ink-900)] font-medium">{{ formatDate(user.created_at) }}</span>
          </div>

          <div class="flex items-center justify-between py-3 last:border-b-0">
            <span class="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-400)]">
              <BaseIcon name="refresh" :size="13" />
              Last Updated
            </span>
            <span class="text-xs text-[var(--ink-900)] font-medium">{{ formatDate(user.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end mt-5.5 pt-4 border-t border-[var(--line-soft)]">
        <button type="button" class="btn btn-secondary" @click="emit('close')">
          Close
        </button>
      </div>
    </div>
  </BaseModal>
</template>
