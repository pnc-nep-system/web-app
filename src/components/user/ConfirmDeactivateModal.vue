<script setup lang="ts">
import BaseModal from '@/components/common/BaseModal.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
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
  <BaseModal :open="open" @close="emit('cancel')">
    <div class="deactivate-modal">
      <!-- Warning Icon -->
      <div class="warning-icon-wrap">
        <BaseIcon name="alert" :size="22" />
      </div>

      <!-- Content -->
      <h3>Deactivate Account</h3>
      <p>
        Are you sure you want to deactivate
        <strong>{{ user?.name ?? 'this account' }}</strong>?
        They will no longer be able to log in.
      </p>

      <!-- Actions -->
      <div class="deactivate-actions">
        <button
          class="btn btn-secondary"
          @click="emit('cancel')"
          :disabled="isLoading"
        >
          Cancel
        </button>
        <button
          class="btn btn-danger"
          @click="emit('confirm')"
          :disabled="isLoading"
        >
          <svg
            v-if="isLoading"
            class="spin-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ isLoading ? 'Deactivating…' : 'Deactivate' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.deactivate-modal {
  text-align: center;
  max-width: 380px;
}

.warning-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--red-100);
  color: var(--red-600);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.deactivate-modal h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 8px;
}

.deactivate-modal p {
  font-size: 13.5px;
  color: var(--ink-500);
  line-height: 1.6;
}
.deactivate-modal p strong {
  color: var(--ink-900);
  font-weight: 600;
}

.deactivate-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 22px;
}

.spin-icon {
  width: 14px;
  height: 14px;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}
.opacity-25 { opacity: 0.25; }
.opacity-75 { opacity: 0.75; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
