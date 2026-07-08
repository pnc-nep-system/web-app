<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import ProgrammeIdentityForm from '@/components/programme/ProgrammeIdentityForm.vue'
import ProgrammeKeywordsView from '@/components/programme/ProgrammeKeywordsView.vue'
import type { ProgrammeIdentity } from '@/types/programme'

const router = useRouter()

// --- Step Definition ---
const steps = [
  { number: 1, title: '1 · Programme identity', subtitle: 'Name, dates, scale' },
  { number: 2, title: '2 · Activities', subtitle: 'Taxonomy B1–B9' },
  { number: 3, title: '3 · Geographic coverage', subtitle: 'Provinces & districts' },
  { number: 4, title: '4 · Government agreements', subtitle: 'Counterparts & status' },
  { number: 5, title: '5 · Keywords', subtitle: 'Up to 5 tags' },
]

const currentStep = ref(1)
const isSaved = ref(false)

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

// --- Section 5 Form Data (Keywords) ---
const keywordsData = ref<string[]>([])

// Count how many fields in section 1 have been filled
const section1Progress = computed(() => {
  const d = section1Data.value
  const fields = [
    !!d.name,
    !!d.startYear,
    d.isOngoing || !!d.endYear,
    !!d.fteStaff,
    !!d.budgetBand,
    !!d.directBeneficiaries,
    !!d.indirectBeneficiaries,
  ]
  return fields.filter(Boolean).length
})

const totalSection1Fields = 7

// Dynamic section progress based on the current step
const sectionProgress = computed(() => {
  if (currentStep.value === 1) {
    return { current: section1Progress.value, total: totalSection1Fields }
  } else if (currentStep.value === 5) {
    return { current: keywordsData.value.length, total: 5 }
  }
  return { current: 0, total: 0 }
})

// Dynamic Continue button text based on the current step
const continueButtonText = computed(() => {
  if (currentStep.value === 1) return 'Continue: Activities'
  if (currentStep.value === 2) return 'Continue: Geographic coverage'
  if (currentStep.value === 3) return 'Continue: Government agreements'
  if (currentStep.value === 4) return 'Continue: Keywords'
  return 'Finish & save'
})

function saveAndExit() {
  isSaved.value = true
  router.push('/dashboard')
}

function continueToNext() {
  if (currentStep.value < steps.length) {
    currentStep.value++
  } else {
    saveAndExit()
  }
}
</script>

<template>
  <AppShell>
    <!-- Breadcrumb slot -->
    <template #header>
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">New programme entry</span>

      <!-- Top-right action button -->
      <div class="ml-auto">
        <button
          @click="() => router.push('/entries/new')"
          class="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span class="text-lg leading-none">+</span> New programme entry
        </button>
      </div>
    </template>

    <!-- Page Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">New programme entry</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Section {{ currentStep }} of {{ steps.length }} ·
          <span :class="isSaved ? 'text-green-600' : 'text-gray-400'">
            {{ isSaved ? 'Saved' : 'Not yet saved' }}
          </span>
        </p>
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
          {{ currentStep === 5 ? 'Finish & save' : 'Continue' }} <span class="text-base">→</span>
        </button>
      </div>
    </div>

    <!-- Two-column layout: Step Sidebar + Form -->
    <div class="flex gap-6 items-start">
      <!-- Step Sidebar -->
      <aside
        class="w-64 shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24"
      >
        <ul class="divide-y divide-gray-100">
          <li
            v-for="step in steps"
            :key="step.number"
            class="flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer select-none"
            :class="step.number === currentStep ? 'bg-teal-50' : 'hover:bg-gray-50'"
            @click="currentStep = step.number"
          >
            <!-- Step number bubble -->
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 animate-duration-150"
              :class="
                step.number === currentStep ? 'bg-teal-800 text-white' : 'bg-gray-100 text-gray-500'
              "
            >
              {{ step.number }}
            </span>

            <div>
              <p
                class="text-sm font-semibold"
                :class="step.number === currentStep ? 'text-teal-900' : 'text-gray-600'"
              >
                {{ step.title }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">{{ step.subtitle }}</p>
            </div>
          </li>
        </ul>

        <!-- Section Progress -->
        <div
          v-if="sectionProgress.total > 0"
          class="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 select-none animate-fade-in"
        >
          <span>Section progress</span>
          <span class="font-semibold text-gray-700"
            >{{ sectionProgress.current }} of {{ sectionProgress.total }}</span
          >
        </div>
      </aside>

      <!-- Form Content Container -->
      <div class="flex-1 min-w-0">
        <!-- Step 1: Programme Identity Form -->
        <ProgrammeIdentityForm v-if="currentStep === 1" v-model="section1Data" />

        <!-- Step 2 Placeholder -->
        <div
          v-else-if="currentStep === 2"
          class="p-8 bg-white rounded-xl shadow-sm border border-gray-100 select-none"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Section 2: Activities</h3>
          <p class="text-sm text-gray-500">
            Activities form (Taxonomy B1–B9) is currently in development. You can navigate to other
            steps via the sidebar or by clicking continue.
          </p>
        </div>

        <!-- Step 3 Placeholder -->
        <div
          v-else-if="currentStep === 3"
          class="p-8 bg-white rounded-xl shadow-sm border border-gray-100 select-none"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Section 3: Geographic coverage</h3>
          <p class="text-sm text-gray-500">
            Geographic coverage form is currently in development. You can navigate to other steps
            via the sidebar or by clicking continue.
          </p>
        </div>

        <!-- Step 4 Placeholder -->
        <div
          v-else-if="currentStep === 4"
          class="p-8 bg-white rounded-xl shadow-sm border border-gray-100 select-none"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Section 4: Government agreements</h3>
          <p class="text-sm text-gray-500">
            Government agreements form is currently in development. You can navigate to other steps
            via the sidebar or by clicking continue.
          </p>
        </div>

        <!-- Step 5: Keywords Form -->
        <ProgrammeKeywordsView v-else-if="currentStep === 5" v-model="keywordsData" />

        <!-- Bottom Continue/Action Button -->
        <div class="mt-6 flex justify-end">
          <button
            @click="continueToNext"
            class="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer select-none"
          >
            {{ continueButtonText }} <span class="text-base">→</span>
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
