<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { usePermission } from '@/composables/usePermission'
import type { GroupedPermissions, Permission } from '@/types/role'

defineProps<{
  groupedPermissions: GroupedPermissions
  isLoading: boolean
}>()

const emit = defineEmits<{
  edit: [permission: Permission]
  delete: [permission: Permission]
}>()

const { can } = usePermission()
</script>

<template>
  <div class="bg-[var(--card)] border border-[var(--line)] rounded-[var(--radius)] shadow-sm overflow-hidden">
    <div v-if="isLoading" class="py-1">
      <div v-for="n in 4" :key="n" class="flex items-center gap-3.5 px-5 py-3.5 border-b border-[var(--line-soft)] last:border-b-0">
        <div class="h-2.5 rounded bg-gray-100 animate-pulse w-40" />
      </div>
    </div>

    <EmptyState
      v-else-if="Object.keys(groupedPermissions).length === 0"
      icon="lock"
      title="No permissions found"
      message="Try adjusting your search or create a new permission."
    />

    <div v-else class="divide-y divide-[var(--line-soft)]">
      <div v-for="(perms, group) in groupedPermissions" :key="group">
        <div class="px-5 py-2.5 bg-[var(--bg)] text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">
          {{ group }}
        </div>
        <div class="divide-y divide-[var(--line-soft)]">
          <div v-for="perm in perms" :key="perm.id" class="flex items-center gap-3 px-5 py-3">
            <div class="min-w-0 flex-1">
              <span class="block text-[13px] font-semibold text-[var(--ink-900)]">{{ perm.display_name }}</span>
              <span class="block text-[11.5px] text-[var(--ink-400)] font-mono">{{ perm.name }}</span>
              <span v-if="perm.description" class="block text-[12px] text-[var(--ink-500)] mt-0.5">{{ perm.description }}</span>
            </div>
            <div class="inline-flex items-center gap-1 shrink-0">
              <button
                v-if="can('permissions.update')"
                class="w-[32px] h-[32px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-[var(--teal-600)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)]"
                title="Edit permission"
                @click="emit('edit', perm)"
              >
                <BaseIcon name="edit" :size="13" />
              </button>
              <button
                v-if="can('permissions.delete')"
                class="w-[32px] h-[32px] rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer transition-all duration-150 hover:border-red-600 hover:text-red-600 hover:bg-red-50"
                title="Delete permission"
                @click="emit('delete', perm)"
              >
                <BaseIcon name="trash" :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
