<!-- Coordinator assignment dropdown -->
<script setup lang="ts">
import type { User } from '@/types/user'

defineProps<{
  modelValue: string
  coordinators: User[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div>
    <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Assign to coordinator</label>
    <select
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="w-full border border-gray-200 rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] bg-white transition"
    >
      <option value="unassigned">Unassigned — leave in shared queue</option>
      <option v-if="loading" disabled value="">Loading coordinators…</option>
      <option
        v-for="coord in coordinators"
        :key="coord.id"
        :value="String(coord.id)"
      >
        {{ coord.name }}
      </option>
    </select>
  </div>
</template>
