<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProgrammeIdentityForm from './ProgrammeIdentityForm.vue'
import ActivitiesForm from './ActivitiesForm.vue'
import AgreementsForm from './AgreementsForm.vue'
import ProgrammeKeywordsView from './ProgrammeKeywordsView.vue'
import ProgrammeGeographic from './ProgrammeGeographic.vue'
import ProgrammeFormHeader from './ProgrammeFormHeader.vue'
import ProgrammeStepperMobile from './ProgrammeStepperMobile.vue'
import ProgrammeStepperDesktop from './ProgrammeStepperDesktop.vue'
import ProgrammeNavigationGuide from './ProgrammeNavigationGuide.vue'
import ProgrammeFormFooter from './ProgrammeFormFooter.vue'
import { useProgrammeFormStore } from '@/stores/programmeForm'

const route = useRoute()
const store = useProgrammeFormStore()

// Re-initialize store when route query ID changes (e.g. from editing to creating new entry)
watch(
  () => route.query.id,
  async (newId) => {
    await store.initializeForm(newId ? String(newId) : null)
  }
)

onMounted(async () => {
  const entryId = route.query.id ? String(route.query.id) : null
  await store.initializeForm(entryId)
})
</script>

<template>
  <!-- Page Header -->
  <ProgrammeFormHeader @save-and-exit="store.saveAndExit" />

  <!-- Submission Result Banner -->
  <div v-if="store.submissionResult"
    class="mb-6 px-5 py-3.5 rounded-lg border flex items-center gap-3 text-sm font-medium transition-all" :class="store.submissionResult.type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-red-50 border-red-200 text-red-800'">
    <svg v-if="store.submissionResult.type === 'success'" class="w-5 h-5 shrink-0 text-green-600" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <svg v-else class="w-5 h-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"
      stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span class="flex-1">{{ store.submissionResult.message }}</span>
    <button @click="store.clearSubmissionResult" class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      :class="store.submissionResult.type === 'success' ? 'text-green-800' : 'text-red-800'">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Two-column layout: Step Sidebar + Form -->
  <div class="flex flex-col lg:flex-row gap-6 items-start w-full">
    <!-- Mobile Horizontal Stepper -->
    <ProgrammeStepperMobile @go-to-step="store.goToStep" />

    <!-- Desktop Step Sidebar -->
    <div class="hidden lg:flex flex-col gap-4 w-64 shrink-0 sticky top-24 select-none">
      <ProgrammeStepperDesktop @go-to-step="store.goToStep" />
      <ProgrammeNavigationGuide />
    </div>

    <!-- Form Content Container -->
    <div class="flex-1 min-w-0">
      <!-- Step 1: Programme Identity -->
      <ProgrammeIdentityForm v-if="store.currentStep === 1" :ref="el => { store.identityFormRef = el }" v-model="store.section1Data"
        v-model:valid="store.section1Valid" :errors="store.errors" :disabled="store.isSaving" @clear-error="store.clearError" />

      <!-- Step 2: Activities -->
      <ActivitiesForm v-else-if="store.currentStep === 2" :ref="el => { store.activitiesFormRef = el }" :model-value="store.section2Data" />

      <!-- Step 3: Geographic Coverage -->
      <ProgrammeGeographic
        v-else-if="store.currentStep === 3"
        :ref="el => { store.geographicFormRef = el }"
        v-model="store.section3Data"
      />

      <!-- Step 4: Government Agreements -->
      <AgreementsForm v-else-if="store.currentStep === 4" :ref="el => { store.agreementsFormRef = el }" v-model="store.section4Data" />

      <!-- Step 5: Keywords Form -->
      <div v-else-if="store.currentStep === 5">
        <ProgrammeKeywordsView v-model="store.keywordsData" />
        <div v-if="store.keywordsError"
          class="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <svg class="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ store.keywordsError }}</span>
        </div>
      </div>

      <!-- Bottom Navigation -->
      <ProgrammeFormFooter @go-back="store.goBack" @continue="store.continueToNext" />
    </div>
  </div>
</template>
