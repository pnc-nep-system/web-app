<script setup lang="ts">
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Role } from '@/types/role'

defineProps<{
  open: boolean
  role: Role | null
  isLoading: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <BaseModal :open="open" @close="emit('cancel')">
    <div class="text-center max-w-[380px] mx-auto">
      <div class="w-12 h-12 rounded-xl bg-[var(--red-100)] text-[var(--red-600)] flex items-center justify-center mx-auto mb-4">
        <BaseIcon name="alert" :size="22" />
      </div>

      <h3 class="text-base font-bold text-[var(--ink-900)] mb-2">Delete Role</h3>
      <p class="text-[13.5px] text-[var(--ink-500)] leading-relaxed">
        Are you sure you want to delete
        <strong class="text-[var(--ink-900)] font-semibold">{{ role?.display_name ?? 'this role' }}</strong>?
        <span v-if="role?.users_count"> {{ role.users_count }} user(s) currently hold this role and will lose the permissions it grants.</span>
        This cannot be undone.
      </p>

      <div class="flex justify-center gap-2.5 mt-5.5">
        <button class="btn btn-secondary" :disabled="isLoading" @click="emit('cancel')">Cancel</button>
        <button class="btn btn-danger" :disabled="isLoading" @click="emit('confirm')">
          {{ isLoading ? 'Deleting…' : 'Delete' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>
