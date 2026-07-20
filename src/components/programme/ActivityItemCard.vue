<script setup lang="ts">
import { computed } from 'vue'
import { useProgrammeActivitiesStore } from '@/stores/programmeActivities'
import EducationLevelSelector from './EducationLevelSelector.vue'
import InclusionForm from './InclusionForm.vue'

const props = defineProps<{
  item: {
    code: string
    label: string
  }
}>()

const store = useProgrammeActivitiesStore()

const isChecked = computed(() => store.selected.includes(props.item.code))
const isPrimary = computed(() => store.primary.includes(props.item.code))
const isCollapsed = computed(() => store.collapsedItems.includes(props.item.code))

function handleCardClick() {
  store.toggleItem(props.item.code)
}

function handleImportance(importance: 'primary' | 'secondary') {
  store.setActivityImportance(props.item.code, importance)
}

function handleToggleCollapse() {
  store.toggleItemCollapse(props.item.code)
}
</script>

<template>
  <div
    class="bg-white rounded-xl border p-4 transition-colors duration-200 cursor-pointer select-none"
    :class="isChecked ? 'border-teal-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/20'"
    @click="handleCardClick"
  >
    <!-- Checkbox / Title Row -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 cursor-pointer flex-grow group">
        <!-- Hidden real checkbox for accessibility -->
        <input
          :id="`item-${item.code}`"
          type="checkbox"
          :checked="isChecked"
          class="sr-only"
          tabindex="-1"
          readonly
        />
        <!-- Custom Checkbox -->
        <div
          class="h-5 w-5 rounded border flex items-center justify-center transition-all duration-200 shrink-0"
          :class="isChecked
            ? 'border-teal-700 bg-teal-700 text-white shadow-sm ring-2 ring-teal-50'
            : 'border-slate-300 bg-white group-hover:border-slate-400'"
        >
          <svg v-if="isChecked" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <!-- Label -->
        <span 
          class="text-[13px] font-medium text-slate-700 transition-colors"
          :class="isChecked ? 'text-slate-900 font-semibold' : 'group-hover:text-slate-900'"
        >
          {{ item.code }} · {{ item.label }}
        </span>
      </div>
      
      <!-- Primary/secondary importance toggle + collapse arrow — only visible when checked -->
      <div v-if="isChecked" class="flex items-center gap-2 animate-fade-in shrink-0 select-none">
        <!-- Primary/secondary importance toggle -->
        <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100" @click.stop>
          <button
            type="button"
            @click.stop.prevent="handleImportance('primary')"
            class="px-3.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
            :class="isPrimary
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'"
          >
            Primary
          </button>
          <button
            type="button"
            @click.stop.prevent="handleImportance('secondary')"
            class="px-3.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
            :class="!isPrimary
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-600'"
          >
            Secondary
          </button>
        </div>

        <!-- Collapse / Expand Arrow Only -->
        <button
          type="button"
          @click.stop.prevent="handleToggleCollapse"
          class="p-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-slate-500 shrink-0"
          title="Toggle Details"
        >
          <svg
            class="w-4 h-4 transform transition-transform duration-200 pointer-events-none"
            :class="isCollapsed ? '' : 'rotate-180'"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Inclusion & Education Levels Sub-form (Only visible if the item is selected and not collapsed) -->
    <div 
      v-if="isChecked && store.inclusions[item.code] && !isCollapsed" 
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
</template>
