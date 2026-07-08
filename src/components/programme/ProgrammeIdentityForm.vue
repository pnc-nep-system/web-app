<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { BUDGET_BANDS } from '@/constants/programme';
import type { ProgrammeIdentity } from '@/types/programme';

const props = defineProps<{
  modelValue?: ProgrammeIdentity;
  errors?: Record<string, string[]>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProgrammeIdentity): void;
  (e: 'clear-error', field: string): void;
}>();

// Initialize form state with prop data or defaults
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
});

// Watch props.modelValue to sync changes down to formData
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      if (newValue.id !== formData.value.id) formData.value.id = newValue.id;
      if (newValue.name !== formData.value.name) formData.value.name = newValue.name;
      if (newValue.startYear !== formData.value.startYear) formData.value.startYear = newValue.startYear;
      if (newValue.endYear !== formData.value.endYear) formData.value.endYear = newValue.endYear;
      if (newValue.isOngoing !== formData.value.isOngoing) formData.value.isOngoing = newValue.isOngoing;
      if (newValue.fteStaff !== formData.value.fteStaff) formData.value.fteStaff = newValue.fteStaff;
      if (newValue.budgetBand !== formData.value.budgetBand) formData.value.budgetBand = newValue.budgetBand;
      if (newValue.directBeneficiaries !== formData.value.directBeneficiaries) formData.value.directBeneficiaries = newValue.directBeneficiaries;
      if (newValue.indirectBeneficiaries !== formData.value.indirectBeneficiaries) formData.value.indirectBeneficiaries = newValue.indirectBeneficiaries;
      if (newValue.method !== formData.value.method) formData.value.method = newValue.method || '';
      if (newValue.verifiedDate !== formData.value.verifiedDate) formData.value.verifiedDate = newValue.verifiedDate || '';
    }
  },
  { deep: true }
);

// Computed property to determine if End Year should be disabled
const isEndYearDisabled = computed(() => formData.value.isOngoing);

// Watcher to clear End Year if Ongoing is checked
watch(
  () => formData.value.isOngoing,
  (isOngoing) => {
    if (isOngoing) {
      formData.value.endYear = null;
    }
  }
);

// Watcher to emit updates back to the parent component
watch(
  formData,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
  { deep: true }
);

// Watch individual fields to clear errors when edited
watch(() => formData.value.name, () => emit('clear-error', 'programme_name'));
watch(() => formData.value.startYear, () => emit('clear-error', 'start_year'));
watch(() => formData.value.endYear, () => emit('clear-error', 'end_year'));
watch(() => formData.value.isOngoing, () => {
  emit('clear-error', 'ongoing');
  emit('clear-error', 'end_year');
});
watch(() => formData.value.fteStaff, () => emit('clear-error', 'fte_staff'));
watch(() => formData.value.budgetBand, () => emit('clear-error', 'budget_band_id'));
watch(() => formData.value.directBeneficiaries, () => emit('clear-error', 'direct_beneficiaries'));
watch(() => formData.value.indirectBeneficiaries, () => emit('clear-error', 'indirect_beneficiaries'));
watch(() => formData.value.method, () => emit('clear-error', 'method'));
watch(() => formData.value.verifiedDate, () => emit('clear-error', 'verified_date'));
</script>


<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">

        <!-- Programme Name (full width) -->
        <div class="md:col-span-2">
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1.5">
            Programme name
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Full name as used by your organisation"
            class="block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm"
            :class="errors?.programme_name
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'"
          />
          <p v-if="errors?.programme_name" class="mt-1.5 text-xs text-red-600">
            {{ errors.programme_name[0] }}
          </p>
        </div>

        <!-- Start Year -->
        <div>
          <label for="startYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            Start year
          </label>
          <input
            id="startYear"
            v-model.number="formData.startYear"
            type="number"
            min="1900"
            max="2100"
            placeholder="YYYY"
            class="block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm"
            :class="errors?.start_year
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'"
          />
          <p v-if="errors?.start_year" class="mt-1.5 text-xs text-red-600">
            {{ errors.start_year[0] }}
          </p>
        </div>

        <!-- End Year with Ongoing checkbox -->
        <div>
          <label for="endYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            End year
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
                :disabled="isEndYearDisabled"
                class="block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                :class="errors?.end_year
                  ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'"
              />
            </div>
            <label for="ongoing" class="flex items-center gap-2 shrink-0 cursor-pointer text-sm text-gray-600 select-none">
              <input
                id="ongoing"
                v-model="formData.isOngoing"
                type="checkbox"
                class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded transition-colors cursor-pointer accent-teal-700"
              />
              Ongoing
            </label>
          </div>
          <p v-if="errors?.end_year" class="mt-1.5 text-xs text-red-600">
            {{ errors.end_year[0] }}
          </p>
        </div>

        <!-- FTE Staff -->
        <div>
          <label for="fteStaff" class="block text-sm font-medium text-gray-700 mb-1.5">
            Number of staff (FTE)
          </label>
          <input
            id="fteStaff"
            v-model.number="formData.fteStaff"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 12"
            class="block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm"
            :class="errors?.fte_staff
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'"
          />
          <p v-if="errors?.fte_staff" class="mt-1.5 text-xs text-red-600">
            {{ errors.fte_staff[0] }}
          </p>
        </div>

        <!-- Budget Band (Annual) -->
        <div>
          <label for="budgetBand" class="block text-sm font-medium text-gray-700 mb-1.5">
            Annual budget band
          </label>
          <select
            id="budgetBand"
            v-model="formData.budgetBand"
            class="block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm"
            :class="[
              errors?.budget_band_id
                ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
              !formData.budgetBand ? 'text-gray-400' : 'text-gray-900'
            ]"
          >
            <option :value="null" disabled>Select a band</option>
            <option v-for="band in BUDGET_BANDS" :key="band" :value="band" class="text-gray-900">
              {{ band }}
            </option>
          </select>
          <p v-if="errors?.budget_band_id" class="mt-1.5 text-xs text-red-600">
            {{ errors.budget_band_id[0] }}
          </p>
        </div>

        <!-- Direct Beneficiaries -->
        <div>
          <label for="directBeneficiaries" class="block text-sm font-medium text-gray-700 mb-1.5">
            Direct beneficiaries per year
          </label>
          <input
            id="directBeneficiaries"
            v-model.number="formData.directBeneficiaries"
            type="number"
            min="0"
            placeholder="Approximate number"
            class="block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm"
            :class="errors?.direct_beneficiaries
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'"
          />
          <p v-if="errors?.direct_beneficiaries" class="mt-1.5 text-xs text-red-600">
            {{ errors.direct_beneficiaries[0] }}
          </p>
          <p v-else class="mt-1.5 text-xs text-amber-600">
            Individuals who <em>directly</em> receive services from this programme.
          </p>
        </div>

        <!-- Indirect Beneficiaries -->
        <div>
          <label for="indirectBeneficiaries" class="block text-sm font-medium text-gray-700 mb-1.5">
            Indirect beneficiaries per year
          </label>
          <input
            id="indirectBeneficiaries"
            v-model.number="formData.indirectBeneficiaries"
            type="number"
            min="0"
            placeholder="Approximate number"
            class="block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm"
            :class="errors?.indirect_beneficiaries
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'"
          />
          <p v-if="errors?.indirect_beneficiaries" class="mt-1.5 text-xs text-red-600">
            {{ errors.indirect_beneficiaries[0] }}
          </p>
          <p v-else class="mt-1.5 text-xs text-gray-400">
            Use your organisation's own definition.
          </p>
        </div>

        <!-- Verified Date -->
        <div>
          <label for="verifiedDate" class="block text-sm font-medium text-gray-700 mb-1.5">
            Verified date
          </label>
          <input
            id="verifiedDate"
            v-model="formData.verifiedDate"
            type="date"
            class="block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm"
            :class="errors?.verified_date
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'"
          />
          <p v-if="errors?.verified_date" class="mt-1.5 text-xs text-red-600">
            {{ errors.verified_date[0] }}
          </p>
        </div>

        <!-- Methodology (full width) -->
        <div class="md:col-span-2">
          <label for="method" class="block text-sm font-medium text-gray-700 mb-1.5">
            Methodology / Method
          </label>
          <textarea
            id="method"
            v-model="formData.method"
            rows="3"
            placeholder="Describe the methodologies and peer mentoring approaches used in this programme..."
            class="block w-full px-4 py-2.5 bg-white border rounded-lg shadow-sm focus:outline-none transition-colors sm:text-sm"
            :class="errors?.method
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'"
          />
          <p v-if="errors?.method" class="mt-1.5 text-xs text-red-600">
            {{ errors.method[0] }}
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

