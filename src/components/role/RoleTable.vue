<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { usePermission } from '@/composables/usePermission'
import type { Role } from '@/types/role'

defineProps<{
  roles: Role[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  edit: [role: Role]
  delete: [role: Role]
  manageUsers: [role: Role]
}>()

const { can } = usePermission()

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm overflow-hidden">
    <!-- Loading Skeletons -->
    <div v-if="isLoading" class="py-1">
      <div v-for="n in 4" :key="n" class="flex items-center gap-3.5 px-5 py-3.5 border-b border-[var(--line-soft)] last:border-b-0">
        <div class="flex flex-col gap-1.5 flex-1">
          <div class="h-2.5 rounded bg-gray-100 animate-pulse w-40" />
          <div class="h-2 rounded bg-gray-100 animate-pulse w-56 opacity-60" />
        </div>
        <div class="w-16 h-6 rounded-full bg-gray-100 animate-pulse" />
        <div class="w-20 h-6 rounded-full bg-gray-100 animate-pulse" />
        <div class="flex gap-1.5 ml-auto">
          <div class="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
          <div class="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="roles.length === 0"
      icon="shield"
      title="No roles found"
      message="Try adjusting your search or create a new role."
    />

    <template v-else>
      <table class="w-full border-collapse table-fixed hidden md:table">
        <thead>
          <tr class="border-b border-[var(--line)]">
            <th class="w-[26%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Role</th>
            <th class="w-[28%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Description</th>
            <th class="w-[12%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Users</th>
            <th class="w-[14%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Permissions</th>
            <th class="w-[10%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] text-left whitespace-nowrap bg-[var(--bg)]">Created</th>
            <th class="w-[10%] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-400)] whitespace-nowrap bg-[var(--bg)] text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in roles" :key="role.id" class="border-b border-[var(--line-soft)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--teal-50)]">
            <td class="px-4 py-3.5 align-middle">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-[13.5px] font-semibold text-[var(--ink-900)] whitespace-nowrap overflow-hidden text-ellipsis">{{ role.display_name }}</span>
                <span
                  v-if="role.is_system"
                  class="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700"
                  title="System role — cannot be modified or deleted"
                >
                  <BaseIcon name="lock" :size="10" /> System
                </span>
              </div>
              <span class="text-xs text-[var(--ink-400)] font-mono">{{ role.name }}</span>
            </td>
            <td class="px-4 py-3.5 text-[12.5px] text-[var(--ink-500)] align-middle">
              {{ role.description || '—' }}
            </td>
            <td class="px-4 py-3.5 align-middle">
              <button
                v-if="can('roles.assign')"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold text-[var(--teal-700)] bg-[var(--teal-50)] hover:bg-[var(--teal-100)] transition-colors cursor-pointer"
                @click="emit('manageUsers', role)"
              >
                <BaseIcon name="users" :size="12" />
                {{ role.users_count ?? 0 }}
              </button>
              <span v-else class="text-[12px] text-[var(--ink-500)]">{{ role.users_count ?? 0 }}</span>
            </td>
            <td class="px-4 py-3.5 text-[12.5px] text-[var(--ink-500)] align-middle">
              {{ role.permissions.length }} granted
            </td>
            <td class="px-4 py-3.5 text-[12.5px] text-[var(--ink-400)] align-middle whitespace-nowrap">
              {{ formatDate(role.created_at) }}
            </td>
            <td class="px-4 py-3.5 align-middle text-right">
              <div class="inline-flex items-center gap-1">
                <button
                  v-if="can('roles.update')"
                  class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)]"
                  :title="role.is_system ? 'System roles cannot be modified' : 'Edit role'"
                  :disabled="role.is_system"
                  :class="{ 'opacity-35 cursor-not-allowed hover:!border-[var(--line)] hover:!text-[var(--ink-500)] hover:!bg-white': role.is_system }"
                  @click="!role.is_system && emit('edit', role)"
                >
                  <BaseIcon name="edit" :size="14" />
                </button>
                <button
                  v-if="can('roles.delete')"
                  class="w-[34px] h-[34px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50"
                  :title="role.is_system ? 'System roles cannot be deleted' : 'Delete role'"
                  :disabled="role.is_system"
                  :class="{ 'opacity-35 cursor-not-allowed hover:!border-[var(--line)] hover:!text-[var(--ink-500)] hover:!bg-white': role.is_system }"
                  @click="!role.is_system && emit('delete', role)"
                >
                  <BaseIcon name="trash" :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Cards -->
      <div class="flex flex-col md:hidden">
        <div v-for="role in roles" :key="role.id" class="py-4 px-[18px] border-b border-[var(--line-soft)] last:border-b-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[13.5px] font-semibold text-[var(--ink-900)]">{{ role.display_name }}</span>
            <span v-if="role.is_system" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
              <BaseIcon name="lock" :size="10" /> System
            </span>
          </div>
          <p class="text-xs text-[var(--ink-400)] mt-1">{{ role.description || 'No description' }}</p>
          <div class="flex items-center gap-3 mt-2.5 text-xs text-[var(--ink-500)]">
            <span>{{ role.users_count ?? 0 }} users</span>
            <span>{{ role.permissions.length }} permissions</span>
          </div>
          <div class="flex gap-1.5 mt-3">
            <button v-if="can('roles.assign')" class="btn btn-secondary btn-sm" @click="emit('manageUsers', role)">
              <BaseIcon name="users" :size="13" /> Users
            </button>
            <button v-if="can('roles.update')" class="btn btn-secondary btn-sm" :disabled="role.is_system" @click="emit('edit', role)">
              <BaseIcon name="edit" :size="13" /> Edit
            </button>
            <button v-if="can('roles.delete')" class="btn btn-danger-ghost btn-sm" :disabled="role.is_system" @click="emit('delete', role)">
              <BaseIcon name="trash" :size="13" /> Delete
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
