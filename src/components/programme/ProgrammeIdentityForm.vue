<script setup lang="ts">
import { watch } from 'vue'
import { BUDGET_BANDS } from '@/constants/programme'
import { useProgrammeIdentityStore } from '@/stores/programmeIdentity'
import type { ProgrammeIdentity } from '@/types/programme'

const props = defineProps<{
  modelValue?: ProgrammeIdentity
  errors?: Record<string, string[]>
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProgrammeIdentity): void
  (e: 'update:valid', isValid: boolean): void
  (e: 'clear-error', field: string): void
}>()

const store = useProgrammeIdentityStore()

// Watch props.modelValue to sync changes down to store (e.g. when loading from API)
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(store.section1Data)) {
      store.initFromPayload(newValue)
    }
  },
  { deep: true, immediate: true }
)

// Watch store.section1Data to emit update back to parent
watch(
  () => store.section1Data,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(props.modelValue)) {
      emit('update:modelValue', newVal)
    }
  },
  { deep: true }
)

// Watch validation status to update:valid
watch(
  () => store.section1Valid,
  (newVal) => {
    emit('update:valid', newVal)
  }
)

// Watchers to clear error and manage rules in real-time
watch(() => store.section1Data.name, () => {
  emit('clear-error', 'programme_name')
  delete store.clientErrors.name
})
watch(() => store.section1Data.startYear, () => {
  emit('clear-error', 'start_year')
  delete store.clientErrors.startYear
  if (store.section1Data.startYear !== null && store.section1Data.endYear !== null && store.section1Data.endYear <= store.section1Data.startYear) {
    store.clientErrors.endYear = 'End year must be greater than start year.'
  } else {
    delete store.clientErrors.endYear
  }
})
watch(() => store.section1Data.endYear, () => {
  emit('clear-error', 'end_year')
  delete store.clientErrors.endYear
  if (store.section1Data.startYear !== null && store.section1Data.endYear !== null && store.section1Data.endYear <= store.section1Data.startYear) {
    store.clientErrors.endYear = 'End year must be greater than start year.'
  } else {
    delete store.clientErrors.endYear
  }
})
watch(() => store.section1Data.isOngoing, (isOngoing) => {
  emit('clear-error', 'ongoing')
  emit('clear-error', 'end_year')
  delete store.clientErrors.endYear
  if (isOngoing) {
    store.section1Data.endYear = null
  }
})
watch(() => store.section1Data.fteStaff, () => {
  emit('clear-error', 'fte_staff')
  delete store.clientErrors.fteStaff
})
watch(() => store.section1Data.budgetBand, () => {
  emit('clear-error', 'budget_band_id')
  delete store.clientErrors.budgetBand
})
watch(() => store.section1Data.directBeneficiaries, () => {
  emit('clear-error', 'direct_beneficiaries')
  delete store.clientErrors.directBeneficiaries
})
watch(() => store.section1Data.indirectBeneficiaries, () => {
  emit('clear-error', 'indirect_beneficiaries')
  delete store.clientErrors.indirectBeneficiaries
})

function validate(): boolean {
  return store.validate()
}

function getData() {
  return store.section1Data
}

defineExpose({ validate, getData })

// Prevent minus sign, 'e' and 'E' on non-negative number inputs
function preventNegativeKey(e: KeyboardEvent) {
  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
    e.preventDefault()
  }
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        <!-- Programme Name (full width) -->
        <div class="md:col-span-2">
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1.5">
            Programme name <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            v-model="store.section1Data.name"
            type="text"
            placeholder="Full name as used by your organisation"
            :class="store.inputClass('name', props.errors)"
            :disabled="props.disabled"
            @blur="store.touch('name')"
          />
          <p v-if="store.fieldError('name', props.errors)" class="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('name', props.errors) }}
          </p>
        </div>

        <!-- Start Year -->
        <div>
          <label for="startYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            Start year <span class="text-red-500">*</span>
          </label>
          <input
            id="startYear"
            v-model.number="store.section1Data.startYear"
            type="number"
            min="1900"
            max="2100"
            placeholder="YYYY"
            :class="store.inputClass('startYear', props.errors)"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @blur="store.touch('startYear')"
          />
          <p
            v-if="store.fieldError('startYear', props.errors)"
            class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('startYear', props.errors) }}
          </p>
        </div>

        <!-- End Year with Ongoing checkbox -->
        <div>
          <label for="endYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            End year <span v-if="!store.section1Data.isOngoing" class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <input
                id="endYear"
                v-model.number="store.section1Data.endYear"
                type="number"
                :min="store.endYearMin"
                max="2100"
                placeholder="YYYY"
                :disabled="store.isEndYearDisabled || props.disabled"
                :class="[
                  store.inputClass('endYear', props.errors),
                  (store.isEndYearDisabled || props.disabled)
                    ? 'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
                    : '',
                ]"
                @keydown="preventNegativeKey"
                @blur="store.touch('endYear')"
              />
              <p
                v-if="!store.isEndYearDisabled && store.fieldError('endYear', props.errors)"
                class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
              >
                <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                {{ store.fieldError('endYear', props.errors) }}
              </p>
            </div>

            <label
              for="ongoing"
              class="flex items-center gap-2 shrink-0 cursor-pointer text-sm text-gray-600 select-none"
            >
              <input
                id="ongoing"
                v-model="store.section1Data.isOngoing"
                type="checkbox"
                :disabled="props.disabled"
                class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded transition-colors cursor-pointer accent-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              Ongoing
            </label>
          </div>
        </div>

        <!-- FTE Staff -->
        <div>
          <label for="fteStaff" class="block text-sm font-medium text-gray-700 mb-1.5">
            Number of staff (FTE) <span class="text-red-500">*</span>
          </label>
          <input
            id="fteStaff"
            v-model.number="store.section1Data.fteStaff"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 12"
            :class="store.inputClass('fteStaff', props.errors)"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="store.clampNonNegative('fteStaff')"
            @blur="store.touch('fteStaff')"
          />
          <p v-if="store.fieldError('fteStaff', props.errors)" class="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('fteStaff', props.errors) }}
          </p>
        </div>

        <!-- Budget Band (Annual) -->
        <div>
          <label for="budgetBand" class="block text-sm font-medium text-gray-700 mb-1.5">
            Annual budget band <span class="text-red-500">*</span>
          </label>
          <select
            id="budgetBand"
            v-model="store.section1Data.budgetBand"
            :disabled="props.disabled"
            :class="[
              store.inputClass('budgetBand', props.errors),
              !store.section1Data.budgetBand ? 'text-gray-400' : 'text-gray-900',
            ]"
            @blur="store.touch('budgetBand')"
            @change="store.touch('budgetBand')"
          >
            <option :value="null" disabled>Select a band</option>
            <option v-for="band in BUDGET_BANDS" :key="band" :value="band" class="text-gray-900">
              {{ band }}
            </option>
          </select>
          <p v-if="store.fieldError('budgetBand', props.errors)" class="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('budgetBand', props.errors) }}
          </p>
        </div>

        <!-- Direct Beneficiaries -->
        <div>
          <label for="directBeneficiaries" class="block text-sm font-medium text-gray-700 mb-1.5">
            Direct beneficiaries per year <span class="text-red-500">*</span>
          </label>
          <input
            id="directBeneficiaries"
            v-model.number="store.section1Data.directBeneficiaries"
            type="number"
            min="0"
            placeholder="Approximate number"
            :class="store.inputClass('directBeneficiaries', props.errors)"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="store.clampNonNegative('directBeneficiaries')"
            @blur="store.touch('directBeneficiaries')"
          />
          <p
            v-if="store.fieldError('directBeneficiaries', props.errors)"
            class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('directBeneficiaries', props.errors) }}
          </p>
          <p v-else class="mt-1.5 text-xs text-amber-600">
            Individuals who <em>directly</em> receive services from this programme.
          </p>
        </div>

        <!-- Indirect Beneficiaries -->
        <div>
          <label for="indirectBeneficiaries" class="block text-sm font-medium text-gray-700 mb-1.5">
            Indirect beneficiaries per year <span class="text-red-500">*</span>
          </label>
          <input
            id="indirectBeneficiaries"
            v-model.number="store.section1Data.indirectBeneficiaries"
            type="number"
            min="0"
            placeholder="Approximate number"
            :class="store.inputClass('indirectBeneficiaries', props.errors)"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="store.clampNonNegative('indirectBeneficiaries')"
            @blur="store.touch('indirectBeneficiaries')"
          />
          <p
            v-if="store.fieldError('indirectBeneficiaries', props.errors)"
            class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ store.fieldError('indirectBeneficiaries', props.errors) }}
          </p>
          <p v-else class="mt-1.5 text-xs text-gray-400">Use your organisation's own definition.</p>
        </div>

      </div>
    </div>
  </div>
</template>