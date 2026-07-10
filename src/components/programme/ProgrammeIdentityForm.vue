<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { BUDGET_BANDS } from '@/constants/programme'
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

// ── Form state ────────────────────────────────────────────────────────────────
const formData = ref<ProgrammeIdentity>({
  id: props.modelValue?.id ?? null,
  name: props.modelValue?.name ?? '',
  startYear: props.modelValue?.startYear ?? null,
  endYear: props.modelValue?.endYear ?? null,
  isOngoing: props.modelValue?.isOngoing ?? false,
  fteStaff: props.modelValue?.fteStaff ?? null,
  budgetBand: props.modelValue?.budgetBand ?? null,
  directBeneficiaries: props.modelValue?.directBeneficiaries ?? null,
  indirectBeneficiaries: props.modelValue?.indirectBeneficiaries ?? null,
  method: props.modelValue?.method ?? '',
  verifiedDate: props.modelValue?.verifiedDate ?? '',
})

// Watch props.modelValue to sync changes down to formData (e.g. when loading from API)
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      if (newValue.id !== formData.value.id) formData.value.id = newValue.id
      if (newValue.name !== formData.value.name) formData.value.name = newValue.name
      if (newValue.startYear !== formData.value.startYear) formData.value.startYear = newValue.startYear
      if (newValue.endYear !== formData.value.endYear) formData.value.endYear = newValue.endYear
      if (newValue.isOngoing !== formData.value.isOngoing) formData.value.isOngoing = newValue.isOngoing
      if (newValue.fteStaff !== formData.value.fteStaff) formData.value.fteStaff = newValue.fteStaff
      if (newValue.budgetBand !== formData.value.budgetBand) formData.value.budgetBand = newValue.budgetBand
      if (newValue.directBeneficiaries !== formData.value.directBeneficiaries) formData.value.directBeneficiaries = newValue.directBeneficiaries
      if (newValue.indirectBeneficiaries !== formData.value.indirectBeneficiaries) formData.value.indirectBeneficiaries = newValue.indirectBeneficiaries
    }
  },
  { deep: true },
)
// Add watches for new fields
watch(() => props.modelValue?.method, (val) => {
  if (val !== undefined && val !== formData.value.method) formData.value.method = val
})
watch(() => props.modelValue?.verifiedDate, (val) => {
  if (val !== undefined && val !== formData.value.verifiedDate) formData.value.verifiedDate = val
})
// ── Client-side validation ────────────────────────────────────────────────────
const clientErrors = ref<Record<string, string>>({})
const touched = ref<Record<string, boolean>>({})

const YEAR_MIN = 1900
const YEAR_MAX = 2100

function validate(): boolean {
  // Mark every field as touched so errors are visible on submit
  touched.value = {
    name: true,
    startYear: true,
    endYear: true,
    fteStaff: true,
    budgetBand: true,
    directBeneficiaries: true,
    indirectBeneficiaries: true,
  }

  const e: Record<string, string> = {}
  const d = formData.value

  // Programme name
  if (!d.name.trim()) {
    e.name = 'Programme name is required.'
    clientErrors.value = e
    emit('update:valid', false)
    return false
  }

  // Start year
  if (d.startYear === null || d.startYear === undefined || (d.startYear as any) === '') {
    e.startYear = 'Start year is required.'
    clientErrors.value = e
    emit('update:valid', false)
    return false
  } else if (d.startYear < YEAR_MIN || d.startYear > YEAR_MAX) {
    e.startYear = `Start year must be between ${YEAR_MIN} and ${YEAR_MAX}.`
    clientErrors.value = e
    emit('update:valid', false)
    return false
  }

  // End year (skip when Ongoing)
  if (!d.isOngoing) {
    if (d.endYear === null || d.endYear === undefined || (d.endYear as any) === '') {
      e.endYear = 'End year is required, or check "Ongoing".'
      clientErrors.value = e
      emit('update:valid', false)
      return false
    } else if (d.endYear < YEAR_MIN || d.endYear > YEAR_MAX) {
      e.endYear = `End year must be between ${YEAR_MIN} and ${YEAR_MAX}.`
      clientErrors.value = e
      emit('update:valid', false)
      return false
    } else if (d.startYear !== null && d.endYear < d.startYear) {
      e.endYear = 'End year must not be before start year.'
      clientErrors.value = e
      emit('update:valid', false)
      return false
    }
  }

  // FTE Staff
  if (d.fteStaff === null || d.fteStaff === undefined || (d.fteStaff as any) === '') {
    e.fteStaff = 'Number of staff is required.'
    clientErrors.value = e
    emit('update:valid', false)
    return false
  } else if (d.fteStaff < 0) {
    e.fteStaff = 'Number of staff cannot be negative.'
    clientErrors.value = e
    emit('update:valid', false)
    return false
  }

  // Budget band
  if (!d.budgetBand) {
    e.budgetBand = 'Please select a budget band.'
    clientErrors.value = e
    emit('update:valid', false)
    return false
  }

  // Direct beneficiaries
  if (
    d.directBeneficiaries === null ||
    d.directBeneficiaries === undefined ||
    (d.directBeneficiaries as any) === ''
  ) {
    e.directBeneficiaries = 'Direct beneficiaries count is required.'
    clientErrors.value = e
    emit('update:valid', false)
    return false
  } else if (d.directBeneficiaries < 0) {
    e.directBeneficiaries = 'Direct beneficiaries cannot be negative.'
    clientErrors.value = e
    emit('update:valid', false)
    return false
  }

  // Indirect beneficiaries
  if (
    d.indirectBeneficiaries === null ||
    d.indirectBeneficiaries === undefined ||
    (d.indirectBeneficiaries as any) === ''
  ) {
    e.indirectBeneficiaries = 'Indirect beneficiaries count is required.'
    clientErrors.value = e
    emit('update:valid', false)
    return false
  } else if (d.indirectBeneficiaries < 0) {
    e.indirectBeneficiaries = 'Indirect beneficiaries cannot be negative.'
    clientErrors.value = e
    emit('update:valid', false)
    return false
  }

  clientErrors.value = {}
  emit('update:valid', true)
  return true
}
// Expose validate() so parent views can trigger it via template ref
function getData() {
  return formData.value
}
defineExpose({ validate, getData })
// ── Per-field blur handler ────────────────────────────────────────────────────
function touch(field: string) {
  touched.value[field] = true
  // validate() is intentionally not called here.
  // Validation should only run when the user explicitly clicks Continue or Save.
}
// Helper: show server error first, then client error (only when touched)
function fieldError(field: string): string {
  // Server-side errors take priority (mapped from snake_case keys in parent)
  const serverKey = fieldToServerKey(field)
  if (props.errors?.[serverKey]?.length) {
    return props.errors[serverKey][0] ?? ''
  }
  return touched.value[field] ? (clientErrors.value[field] ?? '') : ''
}
// Map camelCase field names to snake_case API keys
function fieldToServerKey(field: string): string {
  const map: Record<string, string> = {
    name: 'programme_name',
    startYear: 'start_year',
    endYear: 'end_year',
    isOngoing: 'ongoing',
    fteStaff: 'fte_staff',
    budgetBand: 'budget_band_id',
    directBeneficiaries: 'direct_beneficiaries',
    indirectBeneficiaries: 'indirect_beneficiaries',
  }
  return map[field] || field
}

// Prevent minus sign, 'e' and 'E' on non-negative number inputs
function preventNegativeKey(e: KeyboardEvent) {
  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
    e.preventDefault()
  }
}

// Clamp pasted/programmatic negatives to 0 (number fields)
function clampNonNegative(field: 'fteStaff' | 'directBeneficiaries' | 'indirectBeneficiaries') {
  const val = formData.value[field]
  if (val !== null && val < 0) {
    ;(formData.value as any)[field] = 0
  }
}

// Clamp year fields — disallow values below YEAR_MIN
function clampYear(field: 'startYear' | 'endYear') {
  const val = formData.value[field]
  if (val !== null && val < YEAR_MIN) {
    ;(formData.value as any)[field] = YEAR_MIN
  }
}

// ── Computed helpers ──────────────────────────────────────────────────────────
const isEndYearDisabled = computed(() => formData.value.isOngoing)

function inputClass(field: string): string {
  const base =
    'block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-colors sm:text-sm'
  const hasError = (touched.value[field] && clientErrors.value[field]) || props.errors?.[fieldToServerKey(field)]?.length
  return hasError
    ? `${base} border-red-400 focus:ring-red-300 focus:border-red-400`
    : `${base} border-gray-300 focus:ring-teal-500 focus:border-teal-500`
}

// ── Watchers ──────────────────────────────────────────────────────────────────
// Clear end year when Ongoing is checked
watch(
  () => formData.value.isOngoing,
  (isOngoing) => {
    if (isOngoing) {
      formData.value.endYear = null
    }
  },
)

// Emit model updates to parent
watch(
  formData,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true },
)
// Watch individual fields to clear server-side AND client-side errors when edited
watch(() => formData.value.name, () => {
  emit('clear-error', 'programme_name')
  delete clientErrors.value.name
})
watch(() => formData.value.startYear, () => {
  emit('clear-error', 'start_year')
  delete clientErrors.value.startYear
})
watch(() => formData.value.endYear, () => {
  emit('clear-error', 'end_year')
  delete clientErrors.value.endYear
})
watch(() => formData.value.isOngoing, () => {
  emit('clear-error', 'ongoing')
  emit('clear-error', 'end_year')
  delete clientErrors.value.endYear
})
watch(() => formData.value.fteStaff, () => {
  emit('clear-error', 'fte_staff')
  delete clientErrors.value.fteStaff
})
watch(() => formData.value.budgetBand, () => {
  emit('clear-error', 'budget_band_id')
  delete clientErrors.value.budgetBand
})
watch(() => formData.value.directBeneficiaries, () => {
  emit('clear-error', 'direct_beneficiaries')
  delete clientErrors.value.directBeneficiaries
})
watch(() => formData.value.indirectBeneficiaries, () => {
  emit('clear-error', 'indirect_beneficiaries')
  delete clientErrors.value.indirectBeneficiaries
})
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
            v-model="formData.name"
            type="text"
            placeholder="Full name as used by your organisation"
            :class="inputClass('name')"
            :disabled="props.disabled"
            @blur="touch('name')"
          />
          <p v-if="fieldError('name')" class="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ fieldError('name') }}
          </p>
        </div>

        <!-- Start Year -->
        <div>
          <label for="startYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            Start year <span class="text-red-500">*</span>
          </label>
          <input
            id="startYear"
            v-model.number="formData.startYear"
            type="number"
            min="1900"
            max="2100"
            placeholder="YYYY"
            :class="inputClass('startYear')"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="clampYear('startYear')"
            @blur="touch('startYear')"
          />
          <p
            v-if="fieldError('startYear')"
            class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ fieldError('startYear') }}
          </p>
        </div>

        <!-- End Year with Ongoing checkbox -->
        <div>
          <label for="endYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            End year <span v-if="!formData.isOngoing" class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <input
                id="endYear"
                v-model.number="formData.endYear"
                type="number"
                min="1900"
                max="2100"
                placeholder="YYYY"
                :disabled="isEndYearDisabled || props.disabled"
                :class="[
                  inputClass('endYear'),
                  (isEndYearDisabled || props.disabled)
                    ? 'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
                    : '',
                ]"
                @keydown="preventNegativeKey"
                @input="clampYear('endYear')"
                @blur="touch('endYear')"
              />
              <p
                v-if="!isEndYearDisabled && fieldError('endYear')"
                class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
              >
                <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                {{ fieldError('endYear') }}
              </p>
            </div>

            <label
              for="ongoing"
              class="flex items-center gap-2 shrink-0 cursor-pointer text-sm text-gray-600 select-none"
            >
              <input
                id="ongoing"
                v-model="formData.isOngoing"
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
            v-model.number="formData.fteStaff"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 12"
            :class="inputClass('fteStaff')"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="clampNonNegative('fteStaff')"
            @blur="touch('fteStaff')"
          />
          <p v-if="fieldError('fteStaff')" class="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ fieldError('fteStaff') }}
          </p>
        </div>

        <!-- Budget Band (Annual) -->
        <div>
          <label for="budgetBand" class="block text-sm font-medium text-gray-700 mb-1.5">
            Annual budget band <span class="text-red-500">*</span>
          </label>
          <select
            id="budgetBand"
            v-model="formData.budgetBand"
            :disabled="props.disabled"
            :class="[
              inputClass('budgetBand'),
              !formData.budgetBand ? 'text-gray-400' : 'text-gray-900',
            ]"
            @blur="touch('budgetBand')"
            @change="touch('budgetBand')"
          >
            <option :value="null" disabled>Select a band</option>
            <option v-for="band in BUDGET_BANDS" :key="band" :value="band" class="text-gray-900">
              {{ band }}
            </option>
          </select>
          <p v-if="fieldError('budgetBand')" class="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ fieldError('budgetBand') }}
          </p>
        </div>

        <!-- Direct Beneficiaries -->
        <div>
          <label for="directBeneficiaries" class="block text-sm font-medium text-gray-700 mb-1.5">
            Direct beneficiaries per year <span class="text-red-500">*</span>
          </label>
          <input
            id="directBeneficiaries"
            v-model.number="formData.directBeneficiaries"
            type="number"
            min="0"
            placeholder="Approximate number"
            :class="inputClass('directBeneficiaries')"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="clampNonNegative('directBeneficiaries')"
            @blur="touch('directBeneficiaries')"
          />
          <p
            v-if="fieldError('directBeneficiaries')"
            class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ fieldError('directBeneficiaries') }}
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
            v-model.number="formData.indirectBeneficiaries"
            type="number"
            min="0"
            placeholder="Approximate number"
            :class="inputClass('indirectBeneficiaries')"
            :disabled="props.disabled"
            @keydown="preventNegativeKey"
            @input="clampNonNegative('indirectBeneficiaries')"
            @blur="touch('indirectBeneficiaries')"
          />
          <p
            v-if="fieldError('indirectBeneficiaries')"
            class="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ fieldError('indirectBeneficiaries') }}
          </p>
          <p v-else class="mt-1.5 text-xs text-gray-400">Use your organisation's own definition.</p>
        </div>

      </div>
    </div>
  </div>
</template>