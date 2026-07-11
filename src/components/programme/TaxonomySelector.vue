<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { mockTaxonomies } from '../../constants/taxonomy';
import type { TaxonomyItem } from '../../types/taxonomy';
import CategorySelect from './CategorySelect.vue';
import SubCategorySelect from './SubCategorySelect.vue';
import ItemSelector from './ItemSelector.vue';
import SelectedItems from './SelectedItems.vue';

const emit = defineEmits<{
  (e: 'save', selectedIds: number[]): void;
  (e: 'previous'): void;
}>();

// State
const selectedCategoryId = ref<number | null>(null);
const selectedSubCategoryId = ref<number | null>(null);

// Keep full objects to persist across category changes
const selectedItemsData = ref<TaxonomyItem[]>([]);

// Computed Data
const availableSubCategories = computed(() => {
  const category = mockTaxonomies.find(c => c.id === selectedCategoryId.value);
  return category ? category.subCategories : [];
});

const availableItems = computed(() => {
  const subCategory = availableSubCategories.value.find(s => s.id === selectedSubCategoryId.value);
  // We pass all items so the ItemSelector can render inactive ones as visually disabled.
  return subCategory ? subCategory.items : [];
});

const selectedItemIds = computed({
  get: () => selectedItemsData.value.map(item => item.id),
  set: (newIds: number[]) => {
    const addedIds = newIds.filter(id => !selectedItemIds.value.includes(id));
    const removedIds = selectedItemIds.value.filter(id => !newIds.includes(id));
    
    let updated = [...selectedItemsData.value];
    
    // Remove unselected
    updated = updated.filter(item => !removedIds.includes(item.id));
    
    // Add newly selected (looking up from currently available items)
    addedIds.forEach(id => {
      const itemToAdd = availableItems.value.find(i => i.id === id);
      if (itemToAdd) {
        updated.push(itemToAdd);
      }
    });
    
    selectedItemsData.value = updated;
  }
});

// Watchers
watch(selectedCategoryId, () => {
  // Reset sub-category when category changes
  selectedSubCategoryId.value = null;
});

// Handlers
const handleRemoveItem = (itemId: number) => {
  selectedItemsData.value = selectedItemsData.value.filter(item => item.id !== itemId);
};

const handleSave = () => {
  emit('save', selectedItemIds.value);
};

const handlePrevious = () => {
  emit('previous');
};
</script>

<template>
  <div class="w-full">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
        <h2 class="text-lg font-semibold text-slate-800">Taxonomy Selection</h2>
        <p class="text-sm text-slate-500 mt-1">Select activities for this programme phase.</p>
      </div>
      
      <div class="p-6">
        <!-- Form Area -->
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Category Selection -->
            <CategorySelect
              v-model="selectedCategoryId"
              :categories="mockTaxonomies"
            />
            
            <!-- Sub-category Selection -->
            <SubCategorySelect
              v-model="selectedSubCategoryId"
              :sub-categories="availableSubCategories"
              :disabled="!selectedCategoryId"
            />
          </div>

          <!-- Items Selection -->
          <div class="pt-2">
            <ItemSelector
              :items="availableItems"
              :selected-item-ids="selectedItemIds"
              @update:selected-item-ids="selectedItemIds = $event"
            />
          </div>
        </div>

        <!-- Selected Items View -->
        <SelectedItems
          :selected-items="selectedItemsData"
          @remove="handleRemoveItem"
        />
      </div>
      
      <!-- Footer actions -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button 
          type="button" 
          @click="handlePrevious"
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
        >
          Previous
        </button>
        <button 
          type="button" 
          @click="handleSave"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
        >
          Save & Continue
        </button>
      </div>
    </div>
  </div>
</template>
