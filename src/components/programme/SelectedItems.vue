<script setup lang="ts">
import type { TaxonomyItem } from '../../types/taxonomy';

const props = defineProps<{
  selectedItems: TaxonomyItem[];
}>();

const emit = defineEmits<{
  (e: 'remove', itemId: number): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-slate-200 pt-6 mt-6">
    <h3 class="text-sm font-medium text-slate-700">Selected Items ({{ selectedItems.length }})</h3>
    <div v-if="selectedItems.length === 0" class="text-sm text-slate-500 italic py-2">
      No items selected yet.
    </div>
    <div v-else class="flex flex-wrap gap-2">
      <div
        v-for="item in selectedItems"
        :key="item.id"
        class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 shadow-sm transition-all hover:bg-indigo-100"
      >
        <span>{{ item.name }}</span>
        <button
          type="button"
          @click="emit('remove', item.id)"
          class="group relative -mr-1 h-4 w-4 rounded-full hover:bg-indigo-200/50 focus:bg-indigo-200/50 focus:outline-none"
          aria-label="Remove item"
        >
          <svg class="h-4 w-4 text-indigo-500 group-hover:text-indigo-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
