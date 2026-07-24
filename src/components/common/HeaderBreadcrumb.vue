<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Reusable Header Breadcrumb component.
 *
 * Provides a standardized header breadcrumb across all views:
 * - Automatically derives the role prefix (Admin / Coordinator / NEP)
 * - Renders single titles or multi-step breadcrumb arrays
 * - Supports an optional slot for right-aligned header actions (e.g. Export buttons)
 */
const props = defineProps<{
  /** Main page title or item name */
  title?: string
  /** Explicit prefix override (e.g. "NEP", "Admin", "Coordinator") */
  prefix?: string
  /** Optional array of breadcrumb items for multi-level navigation */
  crumbs?: string[]
}>()

const auth = useAuthStore()

/**
 * Computes the role-based prefix according to user role:
 * - nep_admin -> "Admin"
 * - nep_coordinator -> "Coordinator"
 * - member_org / default -> "NEP"
 */
const rolePrefix = computed(() => {
  if (props.prefix) return props.prefix
  const role = auth.userRole
  if (role === 'nep_admin') return 'Admin'
  if (role === 'nep_coordinator') return 'Coordinator'
  return 'NEP'
})
</script>

<template>
  <div class="flex items-center justify-between w-full min-w-0">
    <!-- Breadcrumb items -->
    <div class="flex items-center min-w-0 truncate text-sm">
      <span class="text-slate-400 font-medium select-none shrink-0">{{ rolePrefix }}</span>
      <span class="mx-1.5 text-slate-300 select-none shrink-0">›</span>

      <!-- Multi-level crumbs -->
      <template v-if="crumbs && crumbs.length > 0">
        <template v-for="(crumb, idx) in crumbs" :key="idx">
          <span v-if="idx > 0" class="mx-1.5 text-slate-300 select-none shrink-0">›</span>
          <span
            :class="[
              'truncate',
              idx === crumbs.length - 1
                ? 'text-slate-700 font-medium'
                : 'text-slate-400 font-medium'
            ]"
          >
            {{ crumb }}
          </span>
        </template>
      </template>

      <!-- Single title -->
      <span v-else-if="title" class="text-slate-700 font-medium truncate">
        {{ title }}
      </span>
    </div>

    <!-- Right-aligned header actions (slot) -->
    <div v-if="$slots.default || $slots.actions" class="ml-auto shrink-0 pl-2 flex items-center gap-2">
      <slot name="actions">
        <slot />
      </slot>
    </div>
  </div>
</template>
