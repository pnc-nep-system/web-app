<script setup lang="ts">
import { useProgrammeFormStore } from '@/stores/programmeForm'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BackButton from '@/components/common/BackButton.vue'

const store = useProgrammeFormStore()
const authStore = useAuthStore()

const emit = defineEmits<{
  (e: 'save-and-exit'): void
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
        {{ store.pageTitle }}
        <StatusBadge v-if="store.section1Data.isUnverified" label="Unverified" variant="warning" />
      </h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Section {{ store.currentStep }} of {{ store.steps.length }} ·
        <span :class="store.saveStatus === 'saved' ? 'text-green-600' : 'text-gray-400'">
          {{ store.saveLabel }}
        </span>
      </p>
    </div>

    <div class="flex items-center justify-end gap-2 w-full sm:w-auto">
      <BackButton />
      <button
        v-if="!authStore.isCoordinatorOrAdmin"
        @click="emit('save-and-exit')"
        :disabled="store.isSaving"
        class="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="store.isSaving" class="animate-spin -ml-1 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {{ store.isSaving ? 'Saving...' : 'Save draft & exit' }}
      </button>
    </div>
  </div>
</template>
