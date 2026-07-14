<script setup lang="ts">
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import type { User } from '@/types/user'

defineProps<{
  open: boolean
  user: User | null
  isLoading: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <ConfirmDialog
    :open="open"
    title="Deactivate Account"
    :message="`Are you sure you want to deactivate ${user?.name ?? 'this account'}? They will no longer be able to log in.`"
    confirm-label="Deactivate"
    :danger="true"
    :loading="isLoading"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
  />
</template>
