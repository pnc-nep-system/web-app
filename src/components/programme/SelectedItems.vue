<script setup lang="ts">
import type { SelectedActivity } from '../../types/taxonomy';
import EducationLevelSelector from './EducationLevelSelector.vue';

const props = defineProps<{
  selectedItems: SelectedActivity[];
}>();

const emit = defineEmits<{
  (e: 'remove', itemId: number): void;
  (e: 'update:educationLevels', itemId: number, levels: number[]): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-4 border-t border-slate-200 pt-6 mt-6">
    <h3 class="text-sm font-medium text-slate-700">Selected Activities ({{ selectedItems.length }})</h3>
    <div v-if="selectedItems.length === 0" class="text-sm text-slate-500 italic py-2">
      No activities selected yet.
    </div>
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="item in selectedItems"
        :key="item.id"
        class="bg-white border border-slate-200 rounded-lg shadow-sm p-4 relative hover:border-indigo-100 transition-colors"
      >
        <div class="flex justify-between items-start mb-2">
          <h4 class="text-base font-semibold text-slate-900">{{ item.name }}</h4>
          <button
            type="button"
            @click="emit('remove', item.id)"
            class="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
            aria-label="Remove activity"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Education Levels</p>
          <EducationLevelSelector
            :model-value="item.educationLevelIds || []"
            @update:model-value="emit('update:educationLevels', item.id, $event)"
          />
        </div>
        
        <p v-if="!item.educationLevelIds || item.educationLevelIds.length === 0" class="mt-3 text-sm text-red-500 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Please select at least one education level.
        </p>
      </div>
    </div>
  </div>
</template>
