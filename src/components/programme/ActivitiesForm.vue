<script setup lang="ts">
import { onMounted, watch } from 'vue'
import EducationLevelSelector from './EducationLevelSelector.vue'
import InclusionForm from './InclusionForm.vue'
import { useProgrammeActivitiesStore } from '@/stores/programmeActivities'
import { useCategoriesStore } from '@/stores/categories'

const props = defineProps<{
  modelValue?: { selected: string[]; primary: string[]; aiText: string; inclusions?: any; educationLevels?: any }
}>()

const store = useProgrammeActivitiesStore()
const accordion = useCategoriesStore()

onMounted(async () => {
  await accordion.loadCategories()
})

watch(() => props.modelValue, (val) => {
  if (val) {
    const current = store.getData()
    if (JSON.stringify(val) !== JSON.stringify(current)) {
      store.initFromPayload(val)
    }
  }
}, { immediate: true, deep: true })

function validate() {
  return store.validate()
}

function getData() {
  return store.getData()
}

defineExpose({ validate, getData })
</script>

<template>
  <div class="space-y-4">

    <!-- Validation error banner -->
    <div
      v-if="store.showError"
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
        v-model="store.aiText"
        rows="3"
        placeholder="e.g. We provide scholarships and mentoring to help girls stay enrolled..."
        class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 placeholder-gray-400"
      />
      <button
        @click="store.suggestActivities"
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
    <div v-if="accordion.isLoading" class="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
      <svg class="animate-spin h-8 w-8 text-teal-800 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span class="text-sm font-medium text-gray-500">Loading activity taxonomy...</span>
    </div>

    <!-- B1–B9 Accordions -->
    <div v-else class="space-y-3">
      <div
        v-for="cat in accordion.categories"
        :key="cat.code"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <!-- Accordion Category Header -->
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors bg-slate-50/50 cursor-pointer select-none"
          @click="accordion.toggleCategory(cat.code)"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-800">{{ cat.code }} · {{ cat.label }}</span>
            <!-- Selection badge -->
            <span
              v-if="accordion.categoryCount(cat.code) > 0"
              class="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-bold bg-teal-800 text-white shadow-sm"
            >
              {{ accordion.categoryCount(cat.code) }}
            </span>
          </div>
          <!-- Chevron -->
          <svg
            class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
            :class="accordion.openCategories.has(cat.code) ? 'rotate-180' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Category Body (Subcategories List) -->
        <div v-if="accordion.openCategories.has(cat.code)" class="border-t border-gray-100 px-5 py-4 space-y-3 bg-slate-50/10 animate-fade-in">
          <div
            v-for="sub in cat.subcategories"
            :key="sub.code"
            class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <!-- Accordion Subcategory Header -->
            <button
              type="button"
              class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50/80 transition-colors bg-slate-50/30 cursor-pointer select-none"
              @click="accordion.toggleSubcategory(sub.code)"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-slate-700">{{ sub.code }} · {{ sub.label }}</span>
                <!-- Selection badge -->
                <span
                  v-if="accordion.subcategoryCount(sub.code) > 0"
                  class="inline-flex items-center justify-center h-4.5 min-w-[1.125rem] px-1 rounded-full text-[9px] font-bold bg-teal-600 text-white shadow-sm"
                >
                  {{ accordion.subcategoryCount(sub.code) }}
                </span>
              </div>
              <svg
                class="w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200"
                :class="accordion.openSubcategories.has(sub.code) ? 'rotate-180' : ''"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Subcategory Body (Items List) -->
            <div v-if="accordion.openSubcategories.has(sub.code)" class="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50/10 animate-fade-in">
              <div
                v-for="item in sub.items"
                :key="item.code"
                class="bg-white rounded-xl border p-4 transition-colors duration-200 cursor-pointer select-none"
                :class="store.selected.has(item.code) ? 'border-teal-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/20'"
                @click="store.toggleItem(item.code)"
              >
                <!-- Checkbox / Title Row -->
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 cursor-pointer flex-grow group">
                    <!-- Hidden real checkbox for accessibility -->
                    <input
                      :id="`item-${item.code}`"
                      type="checkbox"
                      :checked="store.selected.has(item.code)"
                      class="sr-only"
                    />
                    <!-- Custom Checkbox -->
                    <div
                      class="h-5 w-5 rounded border flex items-center justify-center transition-all duration-200 shrink-0"
                      :class="store.selected.has(item.code)
                        ? 'border-teal-700 bg-teal-700 text-white shadow-sm ring-2 ring-teal-50'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'"
                    >
                      <svg v-if="store.selected.has(item.code)" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <!-- Label -->
                    <span 
                      class="text-[13px] font-medium text-slate-700 transition-colors"
                      :class="store.selected.has(item.code) ? 'text-slate-900 font-semibold' : 'group-hover:text-slate-900'"
                    >
                      {{ item.code }} · {{ item.label }}
                    </span>
                  </div>
                  
                  <!-- Primary/secondary importance toggle + collapse arrow — only visible when checked -->
                  <div v-if="store.selected.has(item.code)" class="flex items-center gap-2 animate-fade-in shrink-0 select-none">
                    <!-- Primary/secondary importance toggle -->
                    <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                      <button
                        type="button"
                        @click.stop.prevent="store.setActivityImportance(item.code, 'primary')"
                        class="px-3.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
                        :class="store.primary.has(item.code)
                          ? 'bg-teal-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'"
                      >
                        Primary
                      </button>
                      <button
                        type="button"
                        @click.stop.prevent="store.setActivityImportance(item.code, 'secondary')"
                        class="px-3.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
                        :class="!store.primary.has(item.code)
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'"
                      >
                        Secondary
                      </button>
                    </div>

                    <!-- Collapse / Expand Arrow -->
                    <button
                      type="button"
                      @click.stop.prevent="store.toggleItemCollapse(item.code)"
                      class="p-1 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-slate-500"
                      title="Toggle Configuration Form"
                    >
                      <svg
                        class="w-4 h-4 transform transition-transform duration-200 pointer-events-none"
                        :class="store.collapsedItems.has(item.code) ? '' : 'rotate-180'"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Inclusion & Education Levels Sub-form (Only visible if the item is selected and not collapsed) -->
                <div 
                  v-if="store.selected.has(item.code) && store.inclusions[item.code] && !store.collapsedItems.has(item.code)" 
                  class="mt-4 p-5 rounded-xl border border-slate-200 bg-white space-y-5 animate-fade-in"
                  @click.stop
                >
                  <!-- Education Levels -->
                  <div>
                    <span class="text-xs font-bold text-slate-800 block mb-2">Education Levels</span>
                    <EducationLevelSelector
                      :model-value="store.educationLevels[item.code] || []"
                      @update:model-value="(val) => store.setEducationLevels(item.code, val)"
                    />
                  </div>

                  <!-- Inclusion Focus -->
                  <InclusionForm :item-code="item.code" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
