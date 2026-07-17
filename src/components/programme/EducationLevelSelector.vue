<script setup lang="ts">
import { EDUCATION_LEVELS } from '@/constants/map'

const props = defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void;
}>();

const toggleLevel = (id: number) => {
  const newValue = [...props.modelValue];
  const index = newValue.indexOf(id);
  
  if (index === -1) {
    newValue.push(id);
  } else {
    newValue.splice(index, 1);
  }
  
  emit('update:modelValue', newValue);
};
</script>

<template>
  <div class="flex flex-wrap gap-2.5 mt-2">
    <div
      v-for="level in EDUCATION_LEVELS"
      :key="level.id"
      class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border cursor-pointer select-none transition-all duration-200 text-xs font-semibold"
      :class="modelValue.includes(level.id)
        ? 'border-teal-700 bg-teal-50/20 text-teal-900 shadow-sm'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'"
      @click.stop.prevent="toggleLevel(level.id)"
    >
      <!-- Custom Checkbox -->
      <div
        class="h-4 w-4 rounded border flex items-center justify-center transition-all duration-200 shrink-0 pointer-events-none"
        :class="modelValue.includes(level.id)
          ? 'border-teal-700 bg-teal-700 text-white'
          : 'border-slate-300 bg-white'"
      >
        <svg v-if="modelValue.includes(level.id)" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span class="pointer-events-none">
        {{ level.name }}
      </span>
    </div>
  </div>
</template>
