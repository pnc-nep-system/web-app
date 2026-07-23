<!-- Coordinator assignment dropdown -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adviserApi } from '@/api/adviser.api'
import type { User } from '@/types/user'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const coordinators = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await adviserApi.listStaffUsers()
    const body = res.data
    coordinators.value = Array.isArray(body) ? body : (body as any)?.data ?? []
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.response?.status || err.message || 'Failed to load coordinators.'
    console.error('[CoordinatorSelect] Error:', error.value)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Assign to coordinator</label>

    <!-- Error state -->
    <div v-if="error" class="text-red-500 text-[13px] mb-2">
      ⚠ {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center gap-2 text-gray-400 text-[13px] mb-2">
      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Loading…
    </div>

    <!-- Warning when query returns zero results -->
    <div v-else-if="!loading && coordinators.length === 0" class="text-amber-600 text-[13px] mb-2">
      ⚠ No staff users found in the system.
    </div>

    <select
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full border border-gray-200 rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] bg-white transition"
      :disabled="loading"
    >
      <option value="unassigned">Unassigned — leave in shared queue</option>
      <option
        v-for="coordinator in coordinators"
        :key="coordinator.id"
        :value="String(coordinator.id)"
      >
        {{ coordinator.name }}
      </option>
    </select>
  </div>
</template>
