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
}>()

/** Human-readable role labels */
const ROLE_LABELS: Record<string, string> = {
  nep_admin: 'NEP Admin',
  nep_coordinator: 'Coordinator',
  member_org: 'Member Org',
}

/** Role → BaseBadge-like colour class pairs */
const ROLE_CLASSES: Record<string, string> = {
  nep_admin: 'bg-indigo-100 text-indigo-700',
  nep_coordinator: 'bg-amber-100 text-amber-700',
  member_org: 'bg-teal-100 text-teal-800',
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

function roleClass(role: string): string {
  return ROLE_CLASSES[role] ?? 'bg-gray-100 text-gray-600'
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
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="card overflow-hidden">
    <!-- ─── Loading skeletons ─── -->
    <template v-if="isLoading">
      <div class="divide-y divide-[var(--line-soft)]">
        <div v-for="n in 5" :key="n" class="flex items-center gap-4 px-5 py-4 animate-pulse">
          <div class="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
          <div class="flex-1 space-y-1.5">
            <div class="h-3 bg-gray-200 rounded w-40" />
            <div class="h-2.5 bg-gray-100 rounded w-56" />
          </div>
          <div class="h-5 w-16 bg-gray-100 rounded-full hidden sm:block" />
          <div class="h-5 w-14 bg-gray-100 rounded-full hidden md:block" />
          <div class="h-5 w-24 bg-gray-100 rounded hidden lg:block" />
          <div class="flex gap-2 ml-auto">
            <div class="h-7 w-12 bg-gray-100 rounded-lg" />
            <div class="h-7 w-12 bg-gray-100 rounded-lg" />
            <div class="h-7 w-16 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    </template>

    <!-- ─── Empty state ─── -->
    <EmptyState
      v-else-if="users.length === 0"
      icon="users"
      title="No users found"
      message="Try adjusting your search or create a new user."
    />

    <!-- ─── Table ─── -->
    <template v-else>
      <!-- Header row — hidden on mobile -->
      <div
        class="hidden lg:grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr_1fr_auto] gap-4 items-center
               px-5 py-3 border-b border-[var(--line-soft)]
               text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]"
      >
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
        <span>Status</span>
        <span>Organisation</span>
        <span>Created</span>
        <span class="text-right">Actions</span>
      </div>

      <ul class="divide-y divide-[var(--line-soft)]">
        <li
          v-for="user in users"
          :key="user.id"
          class="group flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4
                 hover:bg-[var(--teal-50)] transition-colors duration-150"
        >
          <!-- Avatar + Name/Email -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div
              class="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-teal-800
                     flex items-center justify-center text-white text-[11px] font-bold shrink-0"
            >
              {{ initials(user.name) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-[var(--ink-900)] truncate">{{ user.name }}</p>
              <p class="text-xs text-[var(--ink-400)] truncate lg:hidden">{{ user.email }}</p>
            </div>
          </div>

          <!-- Email — desktop only column -->
          <div class="hidden lg:block flex-[2] min-w-0">
            <p class="text-xs text-[var(--ink-500)] truncate">{{ user.email }}</p>
          </div>

          <!-- Role badge -->
          <div class="hidden lg:block flex-[1]">
            <span
              class="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              :class="roleClass(user.role)"
            >
              {{ roleLabel(user.role) }}
            </span>
          </div>

          <!-- Status badge -->
          <div class="hidden lg:block flex-[1]">
            <UserStatusBadge :status="user.status" />
          </div>

          <!-- Organisation -->
          <div class="hidden lg:block flex-[1.5] min-w-0 text-xs text-[var(--ink-700)] truncate">
            {{ user.organisation?.name || '—' }}
          </div>

          <!-- Mobile meta row -->
          <div class="flex items-center gap-2 sm:hidden flex-wrap">
            <span
              class="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              :class="roleClass(user.role)"
            >
              {{ roleLabel(user.role) }}
            </span>
            <UserStatusBadge :status="user.status" />
            <span v-if="user.organisation" class="text-xs text-[var(--ink-500)]">
              · {{ user.organisation.name }}
            </span>
          </div>

          <!-- Created date -->
          <div class="hidden lg:block flex-[1] text-xs text-[var(--ink-400)]">
            {{ formatDate(user.created_at) }}
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 sm:ml-auto shrink-0">
            <button
              class="btn btn-secondary btn-sm"
              @click="emit('view', user)"
              title="View details"
            >
              <BaseIcon name="eye" :size="13" />
              View
            </button>
            <button
              class="btn btn-secondary btn-sm"
              @click="emit('edit', user)"
              title="Edit user"
            >
              <BaseIcon name="edit" :size="13" />
              Edit
            </button>
            <button
              v-if="user.status === 'active'"
              class="btn btn-danger-ghost btn-sm"
              @click="emit('deactivate', user)"
              title="Deactivate account"
            >
              <BaseIcon name="lock" :size="13" />
              Deactivate
            </button>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

