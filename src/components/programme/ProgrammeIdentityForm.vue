<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { BUDGET_BANDS } from '@/constants/programme';
import type { ProgrammeIdentity } from '@/types/programme';

const props = defineProps<{
  modelValue?: ProgrammeIdentity;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProgrammeIdentity): void;
}>();

// Initialize form state with prop data or defaults
const formData = ref<ProgrammeIdentity>({
  name: props.modelValue?.name ?? '',
  startYear: props.modelValue?.startYear ?? null,
  endYear: props.modelValue?.endYear ?? null,
  isOngoing: props.modelValue?.isOngoing ?? false,
  fteStaff: props.modelValue?.fteStaff ?? null,
  budgetBand: props.modelValue?.budgetBand ?? null,
  directBeneficiaries: props.modelValue?.directBeneficiaries ?? null,
  indirectBeneficiaries: props.modelValue?.indirectBeneficiaries ?? null,
});

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
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="border-b border-gray-100 bg-gray-50/50 px-6 py-5">
      <h2 class="text-lg font-semibold text-gray-900">Section 1: Programme Identity</h2>
      <p class="mt-1 text-sm text-gray-500">Provide the core identity details for the new programme.</p>
    </div>

    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        <!-- Programme Name -->
        <div class="md:col-span-2">
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1.5">
            Programme Name <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="e.g. Clean Water Initiative"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
          />
        </div>

        <!-- Start Year -->
        <div>
          <label for="startYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            Start Year
          </label>
          <input
            id="startYear"
            v-model.number="formData.startYear"
            type="number"
            min="1900"
            max="2100"
            placeholder="YYYY"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
          />
        </div>

        <!-- End Year & Ongoing Checkbox -->
        <div>
          <label for="endYear" class="block text-sm font-medium text-gray-700 mb-1.5">
            End Year
          </label>
          <input
            id="endYear"
            v-model.number="formData.endYear"
            type="number"
            min="1900"
            max="2100"
            placeholder="YYYY"
            :disabled="isEndYearDisabled"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
          <div class="mt-2.5 flex items-center">
            <input
              id="ongoing"
              v-model="formData.isOngoing"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors cursor-pointer"
            />
            <label for="ongoing" class="ml-2.5 block text-sm text-gray-600 select-none cursor-pointer">
              Ongoing (no set end year)
            </label>
          </div>
        </div>

        <!-- FTE Staff -->
        <div>
          <label for="fteStaff" class="block text-sm font-medium text-gray-700 mb-1.5">
            FTE Staff
          </label>
          <input
            id="fteStaff"
            v-model.number="formData.fteStaff"
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 5.5"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
          />
        </div>

        <!-- Budget Band -->
        <div>
          <label for="budgetBand" class="block text-sm font-medium text-gray-700 mb-1.5">
            Budget Band
          </label>
          <select
            id="budgetBand"
            v-model="formData.budgetBand"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
            :class="!formData.budgetBand ? 'text-gray-400' : 'text-gray-900'"
          >
            <option :value="null" disabled>Select a budget band</option>
            <option v-for="band in BUDGET_BANDS" :key="band" :value="band" class="text-gray-900">
              {{ band }}
            </option>
          </select>
        </div>

        <!-- Direct Beneficiaries -->
        <div>
          <label for="directBeneficiaries" class="block text-sm font-medium text-gray-700 mb-1.5">
            Direct Beneficiaries
          </label>
          <input
            id="directBeneficiaries"
            v-model.number="formData.directBeneficiaries"
            type="number"
            min="0"
            placeholder="e.g. 1500"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
          />
        </div>

        <!-- Indirect Beneficiaries -->
        <div>
          <label for="indirectBeneficiaries" class="block text-sm font-medium text-gray-700 mb-1.5">
            Indirect Beneficiaries
          </label>
          <input
            id="indirectBeneficiaries"
            v-model.number="formData.indirectBeneficiaries"
            type="number"
            min="0"
            placeholder="e.g. 5000"
            class="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
          />
        </div>
      </div>
    </div>
  </div>
</template>
