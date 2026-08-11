<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { userService } from '@/services/user.service'
import type { Role } from '@/types/role'
import type { User } from '@/types/user'

const props = defineProps<{
  open: boolean
  role: Role | null
}>()

const emit = defineEmits<{
  close: []
  assign: [userId: number]
  remove: [userId: number]
}>()

const allUsers = ref<User[]>([])
const isLoadingUsers = ref(false)
const selectedUserId = ref<number | null>(null)
const pendingIds = ref<Set<number>>(new Set())

const assignedUsers = computed(() => props.role?.users ?? [])
const assignedIds = computed(() => new Set(assignedUsers.value.map((u) => u.id)))
const availableUsers = computed(() => allUsers.value.filter((u) => !assignedIds.value.has(u.id)))

watch(
  () => props.open,
  async (opened) => {
    if (!opened) return
    selectedUserId.value = null
    if (allUsers.value.length === 0) {
      isLoadingUsers.value = true
      try {
        const res = await userService.getUsers(1, '', { per_page: 500 })
        allUsers.value = res.data.data ?? []
      } catch (err) {
        console.error('Failed to load users for role assignment:', err)
      } finally {
        isLoadingUsers.value = false
      }
    }
  },
)

async function handleAssign() {
  if (!selectedUserId.value) return
  const id = selectedUserId.value
  pendingIds.value.add(id)
  await Promise.resolve(emit('assign', id))
  pendingIds.value.delete(id)
  selectedUserId.value = null
}

async function handleRemove(userId: number) {
  pendingIds.value.add(userId)
  await Promise.resolve(emit('remove', userId))
  pendingIds.value.delete(userId)
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="w-full max-w-[460px]">
      <div class="flex items-start justify-between mb-5">
        <div>
          <h2 class="text-base font-bold text-[var(--ink-900)]">Manage Users</h2>
          <p class="text-xs text-[var(--ink-400)] mt-0.5">
            Assign or remove <strong>{{ role?.display_name }}</strong> from user accounts.
          </p>
        </div>
        <button
          class="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--ink-500)] cursor-pointer shrink-0 hover:border-[var(--ink-400)] hover:text-[var(--ink-700)]"
          type="button"
          aria-label="Close modal"
          @click="emit('close')"
        >
          <BaseIcon name="x" :size="16" />
        </button>
      </div>

      <!-- Add user -->
      <div class="flex gap-2 mb-4">
        <select
          v-model="selectedUserId"
          class="flex-1 min-w-0 border border-[var(--line)] rounded-[9px] px-3 py-2.5 text-[13.5px] text-[var(--ink-900)] bg-white focus:outline-none focus:border-[var(--teal-600)] focus:shadow-[0_0_0_3px_var(--teal-100)]"
          :disabled="isLoadingUsers"
        >
          <option :value="null">{{ isLoadingUsers ? 'Loading users…' : 'Select a user to add…' }}</option>
          <option v-for="u in availableUsers" :key="u.id" :value="u.id">{{ u.name }} ({{ u.email }})</option>
        </select>
        <button class="btn btn-primary shrink-0" :disabled="!selectedUserId" @click="handleAssign">
          <BaseIcon name="plus" :size="14" />
        </button>
      </div>

      <!-- Assigned users -->
      <div class="border border-[var(--line)] rounded-[9px] max-h-[300px] overflow-y-auto divide-y divide-[var(--line-soft)]">
        <div v-if="assignedUsers.length === 0" class="p-5 text-center text-[12.5px] text-[var(--ink-400)]">
          No users have this role yet.
        </div>
        <div v-for="u in assignedUsers" :key="u.id" class="flex items-center gap-3 px-3 py-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {{ initials(u.name) }}
          </div>
          <div class="min-w-0 flex-1">
            <span class="block text-[12.5px] font-semibold text-[var(--ink-900)] truncate">{{ u.name }}</span>
            <span class="block text-[11px] text-[var(--ink-400)] truncate">{{ u.email }}</span>
          </div>
          <button
            class="w-8 h-8 rounded-lg border border-[var(--line)] bg-white inline-flex items-center justify-center text-[var(--ink-500)] cursor-pointer shrink-0 hover:border-red-600 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
            title="Remove role from this user"
            :disabled="pendingIds.has(u.id)"
            @click="handleRemove(u.id)"
          >
            <BaseIcon name="x" :size="14" />
          </button>
        </div>
      </div>

      <div class="flex justify-end mt-5 pt-4 border-t border-[var(--line-soft)]">
        <button type="button" class="btn btn-secondary" @click="emit('close')">Close</button>
      </div>
    </div>
  </BaseModal>
</template>
