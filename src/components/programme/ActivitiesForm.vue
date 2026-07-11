<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ActivityInclusion, InclusionGroup } from '../../types/taxonomy'

const props = defineProps<{
  modelValue?: { selected: string[]; primary: string[]; aiText: string; inclusions?: Record<string, ActivityInclusion> }
}>()

watch(() => props.modelValue, (val) => {
  if (val) {
    selected.value = new Set(val.selected)
    primary.value = new Set(val.primary)
    aiText.value = val.aiText
    
    // Initialize inclusions
    inclusions.value = {}
    if (val.inclusions) {
      inclusions.value = { ...val.inclusions }
    }
    val.selected.forEach(id => {
      if (!inclusions.value[id]) {
        inclusions.value[id] = { hasInclusion: false, dimensions: [] }
      }
    })
  }
}, { immediate: true })


const emit = defineEmits<{
  (e: 'update:valid', isValid: boolean): void
}>()

// ── Activity taxonomy B1–B9 ───────────────────────────────────────────────────
const categories = [
  {
    code: 'B1',
    label: 'Support to Learners',
    items: [
      { id: 'B1.1', label: 'Scholarships / bursaries' },
      { id: 'B1.2', label: 'School feeding / nutrition' },
      { id: 'B1.3', label: 'Remedial / catch-up learning' },
      { id: 'B1.4', label: 'Psychosocial support' },
      { id: 'B1.5', label: 'Mentoring / tutoring' },
    ],
  },
  {
    code: 'B2',
    label: 'Support to Teachers',
    items: [
      { id: 'B2.1', label: 'Pre-service teacher training' },
      { id: 'B2.2', label: 'In-service / CPD training' },
      { id: 'B2.3', label: 'Teacher recruitment & deployment' },
      { id: 'B2.4', label: 'Teacher incentives & well-being' },
    ],
  },
  {
    code: 'B3',
    label: 'Support to Schools as Institutions',
    items: [
      { id: 'B3.1', label: 'School construction / rehabilitation' },
      { id: 'B3.2', label: 'Learning materials & textbooks' },
      { id: 'B3.3', label: 'School-based management' },
      { id: 'B3.4', label: 'WASH facilities' },
    ],
  },
  {
    code: 'B4',
    label: 'Support to Education System and Governance',
    items: [
      { id: 'B4.1', label: 'Curriculum development' },
      { id: 'B4.2', label: 'Assessment & examination systems' },
      { id: 'B4.3', label: 'Education management information systems (EMIS)' },
      { id: 'B4.4', label: 'Policy dialogue & reform' },
    ],
  },
  {
    code: 'B5',
    label: 'Direct Education Provision',
    items: [
      { id: 'B5.1', label: 'Running schools / learning centres' },
      { id: 'B5.2', label: 'Non-formal education' },
      { id: 'B5.3', label: 'Distance / e-learning delivery' },
    ],
  },
  {
    code: 'B6',
    label: 'Early Childhood Care and Education (ECCE)',
    items: [
      { id: 'B6.1', label: 'Pre-primary programmes' },
      { id: 'B6.2', label: 'Parenting / caregiver support' },
      { id: 'B6.3', label: 'Child development centres' },
    ],
  },
  {
    code: 'B7',
    label: 'Technical and Vocational Education and Training (TVET)',
    items: [
      { id: 'B7.1', label: 'Skills / vocational training' },
      { id: 'B7.2', label: 'Apprenticeships & work-based learning' },
      { id: 'B7.3', label: 'TVET governance & quality assurance' },
    ],
  },
  {
    code: 'B8',
    label: 'Higher Education',
    items: [
      { id: 'B8.1', label: 'University / tertiary institution support' },
      { id: 'B8.2', label: 'Research capacity building' },
      { id: 'B8.3', label: 'Graduate scholarships' },
    ],
  },
  {
    code: 'B9',
    label: 'Cross-cutting Education Themes',
    items: [
      { id: 'B9.1', label: 'Inclusive education (disability, gender, ethnicity)' },
      { id: 'B9.2', label: 'Conflict-sensitive / peace education' },
      { id: 'B9.3', label: 'Environmental / climate education' },
      { id: 'B9.4', label: 'Digital literacy & EdTech' },
    ],
  },
]

// ── State ─────────────────────────────────────────────────────────────────────
const aiText         = ref('')
const openCategories = ref<Set<string>>(new Set())
const selected       = ref<Set<string>>(new Set())   // item IDs ticked
const primary        = ref<Set<string>>(new Set())   // item IDs marked primary
const inclusions     = ref<Record<string, ActivityInclusion>>({})

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

const isGroupSelected = (itemId: string, groupName: InclusionGroup): boolean => {
  const inc = inclusions.value[itemId];
  if (!inc?.dimensions) return false;
  return inc.dimensions.some(d => d.group === groupName);
};

const getGroupType = (itemId: string, groupName: InclusionGroup): 'A' | 'B' => {
  const inc = inclusions.value[itemId];
  if (!inc?.dimensions) return 'B';
  const dim = inc.dimensions.find(d => d.group === groupName);
  return dim?.type || 'B';
};

const getGroupOtherText = (itemId: string): string => {
  const inc = inclusions.value[itemId];
  if (!inc?.dimensions) return '';
  const dim = inc.dimensions.find(d => d.group === 'Other');
  return dim?.otherText || '';
};

const toggleGroupSelection = (itemId: string, groupName: InclusionGroup) => {
  const inc = inclusions.value[itemId];
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
  
  inclusions.value[itemId] = {
    ...inc,
    dimensions
  };
};

const setGroupType = (itemId: string, groupName: InclusionGroup, type: 'A' | 'B') => {
  const inc = inclusions.value[itemId];
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
  
  inclusions.value[itemId] = {
    ...inc,
    dimensions
  };
};

const setGroupOtherText = (itemId: string, otherText: string) => {
  const inc = inclusions.value[itemId];
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
  
  inclusions.value[itemId] = {
    ...inc,
    dimensions
  };
};

const updateInclusionToggle = (itemId: string, hasInclusion: boolean) => {
  const inc = inclusions.value[itemId];
  if (!inc) return;
  
  inclusions.value[itemId] = {
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

function toggleItem(id: string) {
  if (selected.value.has(id)) {
    selected.value.delete(id)
    primary.value.delete(id)
    delete inclusions.value[id]
  } else {
    selected.value.add(id)
    inclusions.value[id] = { hasInclusion: false, dimensions: [] }
  }
}

function setActivityImportance(id: string, importance: 'primary' | 'secondary') {
  if (!selected.value.has(id)) return
  if (importance === 'primary') {
    primary.value.add(id)
  } else {
    primary.value.delete(id)
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
  }
}


// Count how many items are selected per category (for badge)
function categoryCount(code: string): number {
  const cat = categories.find(c => c.code === code)
  if (!cat) return 0
  return cat.items.filter(i => selected.value.has(i.id)).length
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
      <p class="text-sm text-gray-500 mb-3 leading-relaxed">
        Paste a description of your programme (or the text of a proposal document) and the system will suggest activity tags below.
        You confirm, edit, or reject each one — <span class="text-gray-700 font-medium">nothing saves automatically</span>.
      </p>
      <textarea
        v-model="aiText"
        rows="3"
        placeholder="e.g. We provide scholarships and mentoring to help girls stay enrolled through lower secondary school in rural Kampong Cham..."
        class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 placeholder-gray-400"
      />
      <button
        @click="suggestActivities"
        class="mt-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Suggest activities
      </button>
    </div>

    <!-- Instruction -->
    <p class="text-sm text-gray-500 px-1">
      Select every activity item this programme delivers.
      Mark your most important activities as <strong class="text-gray-700">primary</strong> — NEP's coordination matching prioritises these.
    </p>

    <!-- B1–B9 Accordions -->
    <div class="space-y-2">
      <div
        v-for="cat in categories"
        :key="cat.code"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <!-- Accordion header -->
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          @click="toggleCategory(cat.code)"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-gray-800">{{ cat.code }} {{ cat.label }}</span>
            <!-- Selection badge -->
            <span
              v-if="categoryCount(cat.code) > 0"
              class="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-bold bg-teal-700 text-white"
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

        <!-- Accordion body -->
        <div v-if="openCategories.has(cat.code)" class="border-t border-gray-100 px-5 py-3 space-y-3">
          <div
            v-for="item in cat.items"
            :key="item.id"
            class="flex flex-col gap-2 p-2 rounded-lg border border-transparent hover:border-gray-50 hover:bg-gray-50/30 transition-all"
          >
            <!-- Checkbox Row -->
            <div class="flex items-center justify-between gap-3">
              <label :for="`item-${item.id}`" class="flex items-center gap-3 cursor-pointer flex-grow select-none">
                <input
                  :id="`item-${item.id}`"
                  type="checkbox"
                  :checked="selected.has(item.id)"
                  @change="toggleItem(item.id)"
                  class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 accent-teal-700 cursor-pointer"
                />
                <span class="text-sm text-gray-700 font-medium">{{ item.id }} · {{ item.label }}</span>
              </label>
              
              <!-- Primary/secondary importance toggle — only visible when checked -->
              <div v-if="selected.has(item.id)" class="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-100 shrink-0 select-none">
                <button
                  type="button"
                  @click.stop.prevent="setActivityImportance(item.id, 'primary')"
                  class="px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                  :class="primary.has(item.id)
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-700'"
                >
                  Primary
                </button>
                <button
                  type="button"
                  @click.stop.prevent="setActivityImportance(item.id, 'secondary')"
                  class="px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                  :class="!primary.has(item.id)
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-400 hover:text-gray-700'"
                >
                  Secondary
                </button>
              </div>
            </div>

            <!-- Inclusion Sub-form (Only visible if the item is selected) -->
            <div 
              v-if="selected.has(item.id) && inclusions[item.id]" 
              class="ml-7 mt-1.5 p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-4"
            >
              <!-- Yes/No Toggle -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <span class="text-xs font-bold text-gray-700">Specific inclusion focus?</span>
                <div class="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-100">
                  <button
                    type="button"
                    @click="updateInclusionToggle(item.id, true)"
                    class="px-3 py-1 rounded-md text-[11px] font-bold transition-all"
                    :class="inclusions[item.id]?.hasInclusion ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    @click="updateInclusionToggle(item.id, false)"
                    class="px-3 py-1 rounded-md text-[11px] font-bold transition-all"
                    :class="!inclusions[item.id]?.hasInclusion ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'"
                  >
                    No
                  </button>
                </div>
              </div>

              <!-- Group & Type Selection (conditionally visible when toggled "yes") -->
              <div v-if="inclusions[item.id]?.hasInclusion" class="space-y-3">
                <span class="text-[11px] font-bold text-gray-500 block">Target Groups & Inclusion Types (Type A: Inclusive design | Type B: Targeted programme)</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div 
                    v-for="group in groupsConfig" 
                    :key="group.name"
                    class="border border-gray-100 rounded-lg p-2.5 bg-gray-50/50 flex flex-col gap-1.5"
                  >
                    <!-- Group Checkbox -->
                    <label class="inline-flex items-center text-xs font-bold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        :checked="isGroupSelected(item.id, group.name)"
                        @change="toggleGroupSelection(item.id, group.name)"
                        class="h-3.5 w-3.5 border-gray-300 text-teal-600 focus:ring-teal-500 accent-teal-700 mr-2 rounded cursor-pointer"
                      />
                      {{ group.name }}
                    </label>

                    <!-- Type Selection (Visible only when Group Checkbox is checked) -->
                    <div v-if="isGroupSelected(item.id, group.name)" class="pl-5 flex flex-col gap-1.5 border-l-2 border-teal-100 ml-1.5">
                      <!-- Type A / Type B options -->
                      <div class="flex gap-4">
                        <label 
                          v-if="group.allowsA" 
                          class="inline-flex items-center text-[11px] font-semibold text-gray-600 cursor-pointer select-none"
                        >
                          <input
                            type="radio"
                            :name="`type-${item.id}-${group.name}`"
                            value="A"
                            :checked="getGroupType(item.id, group.name) === 'A'"
                            @change="setGroupType(item.id, group.name, 'A')"
                            class="h-3 w-3 border-gray-300 text-teal-600 focus:ring-teal-500 accent-teal-700 mr-1.5 cursor-pointer"
                          />
                          Type A (Inclusive design)
                        </label>
                        
                        <label 
                          class="inline-flex items-center text-[11px] font-semibold text-gray-600 cursor-pointer select-none"
                        >
                          <input
                            type="radio"
                            :name="`type-${item.id}-${group.name}`"
                            value="B"
                            :checked="getGroupType(item.id, group.name) === 'B'"
                            @change="setGroupType(item.id, group.name, 'B')"
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
                          :value="getGroupOtherText(item.id)"
                          @input="setGroupOtherText(item.id, ($event.target as HTMLInputElement).value)"
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
</template>
