<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ProgrammeIdentityForm from '@/components/programme/ProgrammeIdentityForm.vue';
import type { ProgrammeIdentity } from '@/types/programme';

const router = useRouter();

// Centralize the state for Section 1 (Identity)
// In a full multi-step form, we might use a Pinia store to persist state between steps
const identityData = ref<ProgrammeIdentity>({
  name: '',
  startYear: null,
  endYear: null,
  isOngoing: false,
  fteStaff: null,
  budgetBand: null,
  directBeneficiaries: null,
  indirectBeneficiaries: null,
});

const handleNext = () => {
  // Logic to validate Section 1 and proceed to Section 2
  // We can safely pass this data to a global store or API once validated
  console.log('Proceeding to Section 2 with data:', identityData.value);
  // Example for future steps:
  // store.setIdentityData(identityData.value);
  // router.push('/member/programmes/new/section-2');
};

const handleCancel = () => {
  router.push('/member/programmes');
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Create New Programme</h1>
        <p class="mt-2 text-sm text-gray-600">
          Enter the details of your new programme. This information helps us track impact and allocate resources effectively.
        </p>
      </div>

      <!-- Section 1 Form Component -->
      <ProgrammeIdentityForm v-model="identityData" />

      <!-- Form Navigation Actions -->
      <div class="mt-8 flex justify-end items-center space-x-4">
        <button
          type="button"
          @click="handleCancel"
          class="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleNext"
          class="px-6 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
        >
          Next Step
        </button>
      </div>

    </div>
  </div>
</template>
