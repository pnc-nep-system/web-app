<script setup lang="ts">
import type { SelectedTaxonomyItem, ActivityInclusion } from '../../types/taxonomy';

defineProps<{
  selectedItems: SelectedTaxonomyItem[];
}>();

const emit = defineEmits<{
  (e: 'remove', itemId: number): void;
  (e: 'updateInclusion', itemId: number, inclusion: ActivityInclusion): void;
}>();

const updateInclusionToggle = (itemId: number, currentInclusion: ActivityInclusion | undefined, hasInclusion: boolean) => {
  emit('updateInclusion', itemId, {
    hasInclusion,
    group: hasInclusion ? (currentInclusion?.group || '') : undefined,
    type: hasInclusion ? (currentInclusion?.type || undefined) : undefined
  });
};

const updateInclusionGroup = (itemId: number, currentInclusion: ActivityInclusion | undefined, group: string) => {
  emit('updateInclusion', itemId, {
    hasInclusion: currentInclusion?.hasInclusion ?? true,
    group,
    type: currentInclusion?.type
  });
};

const updateInclusionType = (itemId: number, currentInclusion: ActivityInclusion | undefined, type: 'A' | 'B') => {
  emit('updateInclusion', itemId, {
    hasInclusion: currentInclusion?.hasInclusion ?? true,
    group: currentInclusion?.group,
    type
  });
};
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-slate-200 pt-6 mt-6">
    <h3 class="text-sm font-semibold text-slate-700">Selected Items ({{ selectedItems.length }})</h3>
    <div v-if="selectedItems.length === 0" class="text-sm text-slate-500 italic py-2">
      No items selected yet.
    </div>
    
    <div v-else class="grid grid-cols-1 gap-4">
      <div
        v-for="item in selectedItems"
        :key="item.id"
        class="bg-slate-50 rounded-xl p-5 border border-slate-200 relative group transition-all hover:shadow-sm"
      >
        <!-- Card Header: Title and Remove Button -->
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-semibold text-slate-800 text-sm">{{ item.name }}</h4>
            <span class="text-xs text-slate-500 font-normal">ID: {{ item.id }}</span>
          </div>
          <button
            type="button"
            @click="emit('remove', item.id)"
            class="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-slate-200/50"
            aria-label="Remove item"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <!-- Inclusion Sub-form -->
        <div class="border-t border-slate-200/60 pt-4 mt-3 space-y-4">
          <!-- Inclusion Yes/No Toggle -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span class="text-xs font-semibold text-slate-700">Specific inclusion focus?</span>
            <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-200">
              <button
                type="button"
                @click="updateInclusionToggle(item.id, item.inclusion, true)"
                class="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                :class="item.inclusion?.hasInclusion ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              >
                Yes
              </button>
              <button
                type="button"
                @click="updateInclusionToggle(item.id, item.inclusion, false)"
                class="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                :class="!item.inclusion?.hasInclusion ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              >
                No
              </button>
            </div>
          </div>

          <!-- Group & Type Selection (conditionally visible when toggled "yes") -->
          <div v-if="item.inclusion?.hasInclusion" class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-slate-100 shadow-inner mt-2">
            <!-- Group Selection -->
            <div class="flex flex-col gap-1.5">
              <label :for="`group-${item.id}`" class="text-xs font-medium text-slate-600">Target Group</label>
              <select
                :id="`group-${item.id}`"
                :value="item.inclusion?.group || ''"
                @change="updateInclusionGroup(item.id, item.inclusion, ($event.target as HTMLSelectElement).value)"
                class="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="" disabled>Select target group...</option>
                <option value="Disability">Disability</option>
                <option value="Gender / Girls">Gender / Girls</option>
                <option value="Ethnic Minorities">Ethnic Minorities</option>
                <option value="Low-Income / Rural">Low-Income / Rural</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Type Selection (Radio buttons) -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-medium text-slate-600">Inclusion Type</span>
              <div class="flex flex-col gap-1.5">
                <label class="inline-flex items-center text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    :name="`type-${item.id}`"
                    value="A"
                    :checked="item.inclusion?.type === 'A'"
                    @change="updateInclusionType(item.id, item.inclusion, 'A')"
                    class="h-3.5 w-3.5 border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-2 cursor-pointer"
                  />
                  Type A (Inclusive design)
                </label>
                <label class="inline-flex items-center text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    :name="`type-${item.id}`"
                    value="B"
                    :checked="item.inclusion?.type === 'B'"
                    @change="updateInclusionType(item.id, item.inclusion, 'B')"
                    class="h-3.5 w-3.5 border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-2 cursor-pointer"
                  />
                  Type B (Targeted programme)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
