<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { mockTaxonomies } from '../../constants/taxonomy';
import type { SelectedActivity, ActivityInclusion } from '../../types/taxonomy';
import CategorySelect from './CategorySelect.vue';
import SubCategorySelect from './SubCategorySelect.vue';
import ItemSelector from './ItemSelector.vue';
import SelectedItems from './SelectedItems.vue';

const props = defineProps<{
  serverErrors?: Record<string, string[]>
}>();

const emit = defineEmits<{
  (e: 'save', payload: { activities: { activity_id: number; education_level_ids: number[]; inclusion?: ActivityInclusion }[] }): void;
  (e: 'previous'): void;
}>();

// State
const selectedCategoryId = ref<number | null>(null);
const selectedSubCategoryId = ref<number | null>(null);

// Keep full objects to persist across category changes
const selectedItemsData = ref<SelectedActivity[]>([]);

// Computed Data
const availableSubCategories = computed(() => {
  const category = mockTaxonomies.find(c => c.id === selectedCategoryId.value);
  return category ? category.subCategories : [];
});

const availableItems = computed(() => {
  const subCategory = availableSubCategories.value.find(s => s.id === selectedSubCategoryId.value);
  return subCategory ? subCategory.items.filter(item => item.is_active !== false) : [];
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
        updated.push({
          ...itemToAdd,
          educationLevelIds: [],
          inclusion: { hasInclusion: false, dimensions: [] }
        });
      }
    });
    
    selectedItemsData.value = updated;
  }
});

// Watchers
watch(selectedCategoryId, () => {
  selectedSubCategoryId.value = null;
});

const errors = ref({
  activities: {} as Record<number, any>,
  general: ''
});

watch(() => props.serverErrors, (newErrors) => {
  if (newErrors) {
    Object.keys(newErrors).forEach(key => {
      const match = key.match(/^activities\.(\d+)\.(.+)$/);
      if (match) {
        const index = parseInt(match[1] as string, 10);
        const field = match[2] as string;
        if (!errors.value.activities[index]) {
          errors.value.activities[index] = {};
        }
        if (field.includes('education_level_ids')) {
          errors.value.activities[index].educationLevels = newErrors[key]?.[0] || '';
        } else if (field.includes('group')) {
          errors.value.activities[index].inclusionGroup = newErrors[key]?.[0] || '';
        } else if (field.includes('type')) {
          errors.value.activities[index].inclusionType = newErrors[key]?.[0] || '';
        }
      } else if (key === 'activities') {
        errors.value.general = newErrors[key]?.[0] || '';
      }
    });
  }
}, { deep: true, immediate: true });

const validateForm = () => {
  errors.value.activities = {};
  errors.value.general = '';
  let isValid = true;

  if (selectedItemsData.value.length === 0) {
    errors.value.general = 'At least one activity must be selected.';
    isValid = false;
  }

  selectedItemsData.value.forEach((item, index) => {
    const itemErrors: any = {};

    if (!item.educationLevelIds || item.educationLevelIds.length === 0) {
      itemErrors.educationLevels = 'Please select at least one education level.';
      isValid = false;
    }

    if (item.inclusion?.hasInclusion) {
      if (!item.inclusion.dimensions || item.inclusion.dimensions.length === 0) {
        itemErrors.inclusionGroup = 'Please select a group.';
        isValid = false;
      } else {
        item.inclusion.dimensions.forEach(dim => {
          if (!dim.type) {
            itemErrors.inclusionType = 'Please select an inclusion type.';
            isValid = false;
          }
        });
      }
    }

    if (Object.keys(itemErrors).length > 0) {
      errors.value.activities[index] = itemErrors;
    }
  });

  return isValid;
};

// Handlers
const handleRemoveItem = (itemId: number) => {
  selectedItemsData.value = selectedItemsData.value.filter(item => item.id !== itemId);
};

const handleUpdateEducationLevels = (itemId: number, levels: number[]) => {
  const index = selectedItemsData.value.findIndex(i => i.id === itemId);
  if (index !== -1 && selectedItemsData.value[index]) {
    selectedItemsData.value[index].educationLevelIds = levels;
    if (levels.length > 0 && errors.value.activities[index]?.educationLevels) {
      delete errors.value.activities[index].educationLevels;
    }
  }
};

const handleUpdateInclusion = (itemId: number, inclusion: ActivityInclusion) => {
  const index = selectedItemsData.value.findIndex(i => i.id === itemId);
  if (index !== -1 && selectedItemsData.value[index]) {
    selectedItemsData.value[index].inclusion = inclusion;
    if (errors.value.activities[index]) {
      if (!inclusion.hasInclusion || (inclusion.dimensions && inclusion.dimensions.length > 0)) {
        delete errors.value.activities[index].inclusionGroup;
      }
      if (inclusion.dimensions?.every(d => d.type)) {
        delete errors.value.activities[index].inclusionType;
      }
    }
  }
};

const canSave = computed(() => {
  return selectedItemsData.value.length > 0 && selectedItemsData.value.every(item => item.educationLevelIds && item.educationLevelIds.length > 0);
});

const handleSave = () => {
  if (!validateForm()) return;
  
  const payload = {
    activities: selectedItemsData.value.map(item => ({
      activity_id: item.id,
      education_level_ids: item.educationLevelIds,
      inclusion: item.inclusion
    }))
  };
  
  emit('save', payload);
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
          :errors="errors.activities"
          @remove="handleRemoveItem"
          @update:education-levels="handleUpdateEducationLevels"
          @updateInclusion="handleUpdateInclusion"
        />
      </div>
      
      <!-- Footer actions -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div>
          <p v-if="errors.general" class="text-sm font-medium text-red-600 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ errors.general }}
          </p>
        </div>
        <div class="flex gap-3">
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
            class="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
