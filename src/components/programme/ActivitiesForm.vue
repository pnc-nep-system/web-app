<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { ActivityInclusion, InclusionGroup } from '../../types/taxonomy'
import EducationLevelSelector from './EducationLevelSelector.vue'
import { memberApi } from '../../api/member.api'

const props = defineProps<{
  modelValue?: { selected: string[]; primary: string[]; aiText: string; inclusions?: Record<string, ActivityInclusion>; educationLevels?: Record<string, number[]> }
}>()

// ── State ─────────────────────────────────────────────────────────────────────
const aiText         = ref('')
const openCategories = ref<Set<string>>(new Set())
const openSubcategories = ref<Set<string>>(new Set())
const selected       = ref<Set<string>>(new Set())   // item codes ticked (e.g. B1.1.01)
const primary        = ref<Set<string>>(new Set())   // item codes marked primary
const inclusions     = ref<Record<string, ActivityInclusion>>({})
const educationLevels = ref<Record<string, number[]>>({})
const categories     = ref<any[]>([])
const isLoading      = ref(true)
const collapsedItems = ref<Set<string>>(new Set())   // item codes that are collapsed

watch(() => props.modelValue, (val) => {
  selected.value = new Set()
  primary.value = new Set()
  aiText.value = ''
  inclusions.value = {}
  educationLevels.value = {}
  collapsedItems.value = new Set()

  if (val) {
    if (Array.isArray(val.selected)) {
      selected.value = new Set(val.selected)
    }
    if (Array.isArray(val.primary)) {
      primary.value = new Set(val.primary)
    }
    if (typeof val.aiText === 'string') {
      aiText.value = val.aiText
    }
    
    if (val.inclusions && typeof val.inclusions === 'object') {
      inclusions.value = { ...val.inclusions }
    }
    if (val.educationLevels && typeof val.educationLevels === 'object') {
      educationLevels.value = { ...val.educationLevels }
    }
    selected.value.forEach(code => {
      if (!inclusions.value[code]) {
        inclusions.value[code] = { hasInclusion: false, dimensions: [] }
      }
      if (!educationLevels.value[code]) {
        educationLevels.value[code] = []
      }
    })
  }
}, { immediate: true })

const emit = defineEmits<{
  (e: 'update:valid', isValid: boolean): void
}>()

onMounted(async () => {
  try {
    categories.value = await memberApi.getTaxonomyCategories()
  } catch (err) {
    console.error('Failed to load categories', err)
  } finally {
    isLoading.value = false
  }
})

const groupsConfig = [
  { name: 'Disability', allowsA: true },
  { name: 'Gender', allowsA: true },
  { name: 'LGBTIQ+', allowsA: false },
  { name: 'Ethnicity/language', allowsA: true },
  { name: 'Displacement', allowsA: false },
  { name: 'Migrant families', allowsA: false },
  { name: 'Statelessness', allowsA: false },
  { name: 'Other', allowsA: true }
] as const;

const isGroupSelected = (itemCode: string, groupName: InclusionGroup): boolean => {
  const inc = inclusions.value[itemCode];
  if (!inc?.dimensions) return false;
  return inc.dimensions.some(d => d.group === groupName);
};

const getGroupType = (itemCode: string, groupName: InclusionGroup): 'A' | 'B' => {
  const inc = inclusions.value[itemCode];
  if (!inc?.dimensions) return 'B';
  const dim = inc.dimensions.find(d => d.group === groupName);
  return dim?.type || 'B';
};

const getGroupOtherText = (itemCode: string): string => {
  const inc = inclusions.value[itemCode];
  if (!inc?.dimensions) return '';
  const dim = inc.dimensions.find(d => d.group === 'Other');
  return dim?.otherText || '';
};

const toggleGroupSelection = (itemCode: string, groupName: InclusionGroup) => {
  const inc = inclusions.value[itemCode];
  if (!inc) return;
  
  const dimensions = [...inc.dimensions];
  const idx = dimensions.findIndex(d => d.group === groupName);
  
  if (idx === -1) {
    const allowsA = ['Disability', 'Gender', 'Ethnicity/language', 'Other'].includes(groupName);
    dimensions.push({
      group: groupName,
      type: allowsA ? 'A' : 'B',
      otherText: groupName === 'Other' ? '' : undefined
    });
  } else {
    dimensions.splice(idx, 1);
  }
  
  inclusions.value[itemCode] = {
    ...inc,
    dimensions
  };
};

const setGroupType = (itemCode: string, groupName: InclusionGroup, type: 'A' | 'B') => {
  const inc = inclusions.value[itemCode];
  if (!inc) return;
  
  const dimensions = [...inc.dimensions];
  const idx = dimensions.findIndex(d => d.group === groupName);
  
  if (idx !== -1) {
    const dim = dimensions[idx];
    if (dim) {
      dimensions[idx] = {
        ...dim,
        type
      };
    }
  }
  
  inclusions.value[itemCode] = {
    ...inc,
    dimensions
  };
};

const setGroupOtherText = (itemCode: string, otherText: string) => {
  const inc = inclusions.value[itemCode];
  if (!inc) return;
  
  const dimensions = [...inc.dimensions];
  const idx = dimensions.findIndex(d => d.group === 'Other');
  
  if (idx !== -1) {
    const dim = dimensions[idx];
    if (dim) {
      dimensions[idx] = {
        ...dim,
        otherText
      };
    }
  }
  
  inclusions.value[itemCode] = {
    ...inc,
    dimensions
  };
};

const updateInclusionToggle = (itemCode: string, hasInclusion: boolean) => {
  const inc = inclusions.value[itemCode];
  if (!inc) return;
  
  inclusions.value[itemCode] = {
    hasInclusion,
    dimensions: hasInclusion ? (inc.dimensions || []) : []
  };
};

function toggleCategory(code: string) {
  if (openCategories.value.has(code)) {
    openCategories.value.delete(code)
  } else {
    openCategories.value.add(code)
  }
}

function toggleSubcategory(code: string) {
  if (openSubcategories.value.has(code)) {
    openSubcategories.value.delete(code)
  } else {
    openSubcategories.value.add(code)
  }
}

function toggleItem(code: string) {
  if (selected.value.has(code)) {
    selected.value.delete(code)
    primary.value.delete(code)
    delete inclusions.value[code]
    delete educationLevels.value[code]
    collapsedItems.value.delete(code)
  } else {
    selected.value.add(code)
    inclusions.value[code] = { hasInclusion: false, dimensions: [] }
    educationLevels.value[code] = []
    collapsedItems.value.delete(code)
  }
}

function toggleItemCollapse(code: string) {
  if (collapsedItems.value.has(code)) {
    collapsedItems.value.delete(code)
  } else {
    collapsedItems.value.add(code)
  }
}

// Emits validation check
watch(selected, () => {
  emit('update:valid', selected.value.size > 0)
}, { deep: true })

function setActivityImportance(code: string, importance: 'primary' | 'secondary') {
  if (!selected.value.has(code)) return
  if (importance === 'primary') {
    primary.value.add(code)
  } else {
    primary.value.delete(code)
  }
}

function suggestActivities() {
  // Placeholder — future AI integration
}

const showError = ref(false)

function validate(): boolean {
  const isValid = selected.value.size > 0
  showError.value = !isValid
  emit('update:valid', isValid)
  return isValid
}

defineExpose({ validate, getData })
function getData() {
  return {
    selected: Array.from(selected.value),
    primary: Array.from(primary.value),
    aiText: aiText.value,
    inclusions: inclusions.value,
    educationLevels: educationLevels.value,
  }
}

function categoryCount(code: string): number {
  const cat = categories.value.find(c => c.code === code)
  if (!cat) return 0
  let count = 0
  cat.subcategories?.forEach((sub: any) => {
    sub.items?.forEach((i: any) => {
      if (selected.value.has(i.code)) {
        count++
      }
    })
  })
  return count
}

function subcategoryCount(code: string): number {
  let sub: any = null
  for (const cat of categories.value) {
    const found = cat.subcategories?.find((s: any) => s.code === code)
    if (found) {
      sub = found
      break
    }
  }
  if (!sub) return 0
  return sub.items?.filter((i: any) => selected.value.has(i.code)).length || 0
}
</script>

<template>
  <div class="space-y-4">

    <!-- Validation error banner -->
    <div
      v-if="showError"
      class="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
    >
      <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Please select at least one activity before continuing.
    </div>

    <!-- AI-assisted completion panel -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center gap-2 mb-3">
        <!-- Lightning bolt icon -->
        <svg class="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span class="text-sm font-semibold text-gray-800">AI-assisted completion</span>
      </div>
      <p class="text-sm text-gray-500 mb-3 leading-relaxed hidden sm:block">
        Paste a description of your programme (or the text of a proposal document) and the system will suggest activity tags below.
        You confirm, edit, or reject each one — <span class="text-gray-700 font-medium">nothing saves automatically</span>.
      </p>
      <textarea
        v-model="aiText"
        rows="3"
        placeholder="e.g. We provide scholarships and mentoring to help girls stay enrolled..."
        class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 placeholder-gray-400"
      />
      <button
        @click="suggestActivities"
        class="mt-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Suggest activities
      </button>
    </div>

    <!-- Instruction -->
    <p class="text-sm text-gray-500 px-1 hidden sm:block">
      Select every activity item this programme delivers.
      Mark your most important activities as <strong class="text-gray-700">primary</strong> — NEP's coordination matching prioritises these.
    </p>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
      <svg class="animate-spin h-8 w-8 text-teal-800 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span class="text-sm font-medium text-gray-500">Loading activity taxonomy...</span>
    </div>

    <!-- B1–B9 Accordions -->
    <div v-else class="space-y-3">
      <div
        v-for="cat in categories"
        :key="cat.code"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <!-- Accordion Category Header -->
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors bg-slate-50/50 cursor-pointer select-none"
          @click="toggleCategory(cat.code)"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-800">{{ cat.code }} · {{ cat.label }}</span>
            <!-- Selection badge -->
            <span
              v-if="categoryCount(cat.code) > 0"
              class="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-bold bg-teal-800 text-white shadow-sm"
            >
              {{ categoryCount(cat.code) }}
            </span>
          </div>
          <!-- Chevron -->
          <svg
            class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
            :class="openCategories.has(cat.code) ? 'rotate-180' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Category Body (Subcategories List) -->
        <div v-if="openCategories.has(cat.code)" class="border-t border-gray-100 px-5 py-4 space-y-3 bg-slate-50/10 animate-fade-in">
          <div
            v-for="sub in cat.subcategories"
            :key="sub.code"
            class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <!-- Accordion Subcategory Header -->
            <button
              type="button"
              class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50/80 transition-colors bg-slate-50/30 cursor-pointer select-none"
              @click="toggleSubcategory(sub.code)"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-slate-700">{{ sub.code }} · {{ sub.label }}</span>
                <!-- Selection badge -->
                <span
                  v-if="subcategoryCount(sub.code) > 0"
                  class="inline-flex items-center justify-center h-4.5 min-w-[1.125rem] px-1 rounded-full text-[9px] font-bold bg-teal-600 text-white shadow-sm"
                >
                  {{ subcategoryCount(sub.code) }}
                </span>
              </div>
              <svg
                class="w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200"
                :class="openSubcategories.has(sub.code) ? 'rotate-180' : ''"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Subcategory Body (Items List) -->
            <div v-if="openSubcategories.has(sub.code)" class="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50/10 animate-fade-in">
              <div
                v-for="item in sub.items"
                :key="item.code"
                class="bg-white rounded-xl border p-4 transition-all duration-300"
                :class="selected.has(item.code) ? 'border-teal-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/20'"
              >
                <!-- Checkbox / Title Row -->
                <div class="flex items-center justify-between gap-3">
                  <div 
                    @click="toggleItem(item.code)" 
                    class="flex items-center gap-3 cursor-pointer flex-grow select-none group"
                  >
                    <!-- Hidden real checkbox for accessibility -->
                    <input
                      :id="`item-${item.code}`"
                      type="checkbox"
                      :checked="selected.has(item.code)"
                      class="sr-only"
                    />
                    <!-- Custom Checkbox -->
                    <div
                      class="h-5 w-5 rounded border flex items-center justify-center transition-all duration-200 shrink-0"
                      :class="selected.has(item.code)
                        ? 'border-teal-700 bg-teal-700 text-white shadow-sm ring-2 ring-teal-50'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'"
                    >
                      <svg v-if="selected.has(item.code)" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <!-- Label -->
                    <span 
                      class="text-[13px] font-medium text-slate-700 transition-colors"
                      :class="selected.has(item.code) ? 'text-slate-900 font-semibold' : 'group-hover:text-slate-900'"
                    >
                      {{ item.code }} · {{ item.label }}
                    </span>
                  </div>
                  
                  <!-- Primary/secondary importance toggle + collapse arrow — only visible when checked -->
                  <div v-if="selected.has(item.code)" class="flex items-center gap-2 animate-fade-in shrink-0 select-none">
                    <!-- Primary/secondary importance toggle -->
                    <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                      <button
                        type="button"
                        @click.stop.prevent="setActivityImportance(item.code, 'primary')"
                        class="px-3.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
                        :class="primary.has(item.code)
                          ? 'bg-teal-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'"
                      >
                        Primary
                      </button>
                      <button
                        type="button"
                        @click.stop.prevent="setActivityImportance(item.code, 'secondary')"
                        class="px-3.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
                        :class="!primary.has(item.code)
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'"
                      >
                        Secondary
                      </button>
                    </div>

                    <!-- Collapse / Expand Arrow -->
                    <button
                      type="button"
                      @click.stop.prevent="toggleItemCollapse(item.code)"
                      class="p-1 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-slate-500"
                      title="Toggle Configuration Form"
                    >
                      <svg
                        class="w-4 h-4 transform transition-transform duration-200"
                        :class="collapsedItems.has(item.code) ? '' : 'rotate-180'"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Inclusion & Education Levels Sub-form (Only visible if the item is selected and not collapsed) -->
                <div 
                  v-if="selected.has(item.code) && inclusions[item.code] && !collapsedItems.has(item.code)" 
                  class="mt-4 p-5 rounded-xl border border-slate-200 bg-white space-y-5 animate-fade-in"
                >
                  <!-- Education Levels -->
                  <div>
                    <span class="text-xs font-bold text-slate-800 block mb-2">Education Levels</span>
                    <EducationLevelSelector
                      :model-value="educationLevels[item.code] || []"
                      @update:model-value="(val) => educationLevels[item.code] = val"
                    />
                  </div>

                  <!-- Yes/No Toggle -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <span class="text-xs font-bold text-slate-800">Specific inclusion focus?</span>
                    <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                      <button
                        type="button"
                        @click="updateInclusionToggle(item.code, true)"
                        class="px-4 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                        :class="inclusions[item.code]?.hasInclusion ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        @click="updateInclusionToggle(item.code, false)"
                        class="px-4 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer"
                        :class="!inclusions[item.code]?.hasInclusion ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <!-- Group & Type Selection (conditionally visible when toggled "yes") -->
                  <div v-if="inclusions[item.code]?.hasInclusion" class="space-y-3 border-t border-slate-100 pt-4 animate-fade-in">
                    <span class="text-[11px] font-bold text-slate-500 block">Target Groups & Inclusion Types (Type A: Inclusive design | Type B: Targeted programme)</span>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div 
                        v-for="group in groupsConfig" 
                        :key="group.name"
                        class="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50 flex flex-col gap-1.5"
                      >
                        <!-- Group Checkbox -->
                        <div 
                          @click="toggleGroupSelection(item.code, group.name)" 
                          class="inline-flex items-center text-xs font-bold text-slate-700 cursor-pointer select-none group/groupitem"
                        >
                          <input
                            type="checkbox"
                            :checked="isGroupSelected(item.code, group.name)"
                            class="sr-only"
                          />
                          <!-- Custom Checkbox -->
                          <div
                            class="h-4 w-4 rounded border flex items-center justify-center transition-all duration-200 mr-2 shrink-0"
                            :class="isGroupSelected(item.code, group.name)
                              ? 'border-teal-700 bg-teal-700 text-white'
                              : 'border-slate-300 bg-white group-hover/groupitem:border-slate-400'"
                          >
                            <svg v-if="isGroupSelected(item.code, group.name)" class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          {{ group.name }}
                        </div>

                        <!-- Type Selection (Visible only when Group Checkbox is checked) -->
                        <div v-if="isGroupSelected(item.code, group.name)" class="pl-5 flex flex-col gap-1.5 border-l-2 border-teal-100 ml-1.5 animate-fade-in">
                          <!-- Type A / Type B options -->
                          <div class="flex gap-4">
                            <label 
                              v-if="group.allowsA" 
                              class="inline-flex items-center text-[11px] font-semibold text-gray-600 cursor-pointer select-none"
                            >
                              <input
                                type="radio"
                                :name="`type-${item.code}-${group.name}`"
                                value="A"
                                :checked="getGroupType(item.code, group.name) === 'A'"
                                @change="setGroupType(item.code, group.name, 'A')"
                                class="h-3 w-3 border-gray-300 text-teal-600 focus:ring-teal-500 accent-teal-700 mr-1.5 cursor-pointer"
                              />
                              Type A (Inclusive design)
                            </label>
                            
                            <label 
                              class="inline-flex items-center text-[11px] font-semibold text-gray-600 cursor-pointer select-none"
                            >
                              <input
                                type="radio"
                                :name="`type-${item.code}-${group.name}`"
                                value="B"
                                :checked="getGroupType(item.code, group.name) === 'B'"
                                @change="setGroupType(item.code, group.name, 'B')"
                                class="h-3 w-3 border-gray-300 text-teal-600 focus:ring-teal-500 accent-teal-700 mr-1.5 cursor-pointer"
                              />
                              Type B (Targeted programme)
                            </label>
                          </div>

                          <!-- Text input for 'Other' -->
                          <div v-if="group.name === 'Other'" class="mt-1">
                            <input
                              type="text"
                              placeholder="Specify other focus..."
                              :value="getGroupOtherText(item.code)"
                              @input="setGroupOtherText(item.code, ($event.target as HTMLInputElement).value)"
                              class="w-full px-2 py-1 text-[11px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-gray-800 placeholder-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

