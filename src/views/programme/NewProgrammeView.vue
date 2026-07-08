<script setup lang="ts">
import { ref, computed, watch, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import ProgrammeIdentityForm from '@/components/programme/ProgrammeIdentityForm.vue'
import ActivitiesForm from '@/components/programme/ActivitiesForm.vue'
import type { ProgrammeIdentity } from '@/types/programme'
import { useToast } from '@/utils/toast'

const router = useRouter()
const toast = useToast()

// --- Step Definition ---
const steps = [
  { number: 1, title: '1 · Programme identity', subtitle: 'Name, dates, scale' },
  { number: 2, title: '2 · Activities', subtitle: 'Taxonomy B1–B9' },
  { number: 3, title: '3 · Geographic coverage', subtitle: 'Provinces & districts' },
  { number: 4, title: '4 · Government agreements', subtitle: 'Counterparts & status' },
  { number: 5, title: '5 · Keywords', subtitle: 'Up to 5 tags' },
]

const currentStep = ref(1)

// --- Section 1 Form Data ---
const section1Data = ref<ProgrammeIdentity>({
  name: '',
  startYear: new Date().getFullYear(),
  endYear: null,
  isOngoing: false,
  fteStaff: null,
  budgetBand: null,
  directBeneficiaries: null,
  indirectBeneficiaries: null,
})

const section1Valid = ref(false)
const identityFormRef = useTemplateRef<InstanceType<typeof ProgrammeIdentityForm>>('identityForm')
const activitiesFormRef = useTemplateRef<InstanceType<typeof ActivitiesForm>>('activitiesForm')

// --- Dynamic page title ---
const pageTitle = computed(() => section1Data.value.name.trim() || 'New programme entry')

// --- Completed steps set ---
const completedSteps = ref<Set<number>>(new Set())

// --- Navigation labels ---
const progressPercent = computed(() => (currentStep.value / steps.length) * 100)
const nextStepLabel = computed(() => {
  const next = steps[currentStep.value]
  return next ? `Continue: ${next.title.replace(/^\d+ · /, '')} →` : 'Finish →'
})
const backStepLabel = computed(() => {
  const prev = steps[currentStep.value - 2]
  return prev ? `← Back: ${prev.title.replace(/^\d+ · /, '')}` : ''
})

function saveAndExit() {
  router.push('/dashboard')
}

function goBack() {
  if (currentStep.value > 1) {
    completedSteps.value.delete(currentStep.value - 1)
    currentStep.value--
  }
}

function continueToNext() {
  // Step 1 validation
  if (currentStep.value === 1) {
    const isValid = identityFormRef.value?.validate()
    if (!isValid) return
  }

  // Step 2 validation (activities)
  if (currentStep.value === 2) {
    const isValid = activitiesFormRef.value?.validate?.()
    if (!isValid) {
      // Required behaviour: block navigation + show message.
      toast.error('Imcomplete is not yet')
      return
    }
  }

  completedSteps.value.add(currentStep.value)
  if (currentStep.value < steps.length) {
    currentStep.value++
  }
}
</script>

<template>
  <AppShell>
    <template #header>
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">New programme entry</span>

      <div class="ml-auto">
        <button
          @click="() => router.push('/entries/new')"
          class="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span class="text-lg leading-none">+</span> New programme entry
        </button>
      </div>
    </template>

    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">Section {{ currentStep }} of {{ steps.length }}</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="saveAndExit"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Save &amp; exit
        </button>
        <button
          @click="continueToNext"
          class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors"
        >
          Continue <span class="text-base">→</span>
        </button>
      </div>
    </div>

    <div class="flex gap-6 items-start">
      <aside class="w-64 shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
        <ul class="divide-y divide-gray-100">
          <li
            v-for="step in steps"
            :key="step.number"
            class="flex items-start gap-3 px-4 py-3.5 transition-colors"
            :class="step.number === currentStep ? 'bg-teal-50' : 'hover:bg-gray-50'"
          >
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
              :class="completedSteps.has(step.number)
                ? 'bg-green-600 text-white'
                : step.number === currentStep
                  ? 'bg-teal-800 text-white'
                  : 'bg-gray-100 text-gray-500'"
            >
              <svg
                v-if="completedSteps.has(step.number)"
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <template v-else>{{ step.number }}</template>
            </span>

            <div>
              <p class="text-sm font-semibold" :class="step.number === currentStep ? 'text-teal-900' : 'text-gray-600'">
                {{ step.title }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">{{ step.subtitle }}</p>
            </div>
          </li>
        </ul>

        <div class="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Section progress</span>
            <span class="font-semibold text-gray-700">{{ currentStep }} of {{ steps.length }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-1.5">
            <div class="bg-teal-600 h-1.5 rounded-full transition-all duration-500" :style="{ width: progressPercent + '%' }" />
          </div>
        </div>
      </aside>

      <div class="flex-1 min-w-0">
        <ProgrammeIdentityForm
          v-if="currentStep === 1"
          ref="identityForm"
          v-model="section1Data"
          v-model:valid="section1Valid"
        />

        <ActivitiesForm v-else-if="currentStep === 2" ref="activitiesForm" />

        <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          Section {{ currentStep }} is coming soon.
        </div>

        <div class="mt-6 flex items-center justify-end gap-2">
          <button
            v-if="currentStep > 1"
            type="button"
            @click="goBack"
            class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {{ backStepLabel }}
          </button>

          <button
            type="button"
            @click="continueToNext"
            class="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors"
          >
            {{ nextStepLabel }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>

