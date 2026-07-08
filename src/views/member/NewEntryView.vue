<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import ProgrammeIdentityForm from '@/components/programme/ProgrammeIdentityForm.vue'
import type { ProgrammeIdentity } from '@/types/programme'

const router = useRouter()

// --- Step Definition ---
const steps = [
  { number: 1, title: '1 · Programme identity', subtitle: 'Name, dates, scale' },
  { number: 2, title: '2 · Activities',          subtitle: 'Taxonomy B1–B9' },
  { number: 3, title: '3 · Geographic coverage', subtitle: 'Provinces & districts' },
  { number: 4, title: '4 · Government agreements', subtitle: 'Counterparts & status' },
  { number: 5, title: '5 · Keywords',            subtitle: 'Up to 5 tags' },
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

// Tracks whether the form is currently valid
const section1Valid = ref(false)

// Template ref to the form component so we can trigger validation on submit
const identityFormRef = useTemplateRef<InstanceType<typeof ProgrammeIdentityForm>>('identityForm')

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

function saveAndExit() {
  isSaved.value = true
  router.push('/dashboard')
}

function continueToNext() {
  // Trigger full validation and mark all fields as touched
  const isValid = identityFormRef.value?.validate()
  if (!isValid) return

  // For now, only Section 1 is built — show a placeholder alert
  alert('Section 2 (Activities) is not yet implemented.')
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
          Continue <span class="text-base">→</span>
        </button>
      </div>
    </div>

    <!-- Two-column layout: Step Sidebar + Form -->
    <div class="flex gap-6 items-start">

      <!-- Step Sidebar -->
      <aside class="w-64 shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
        <ul class="divide-y divide-gray-100">
          <li
            v-for="step in steps"
            :key="step.number"
            class="flex items-start gap-3 px-4 py-3.5 transition-colors"
            :class="step.number === currentStep ? 'bg-teal-50' : 'hover:bg-gray-50'"
          >
            <!-- Step number bubble -->
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
              :class="step.number === currentStep
                ? 'bg-teal-800 text-white'
                : 'bg-gray-100 text-gray-500'"
            >
              {{ step.number }}
            </span>

            <div>
              <p class="text-sm font-semibold"
                :class="step.number === currentStep ? 'text-teal-900' : 'text-gray-600'">
                {{ step.title }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">{{ step.subtitle }}</p>
            </div>
          </li>
        </ul>

        <!-- Section Progress -->
        <div class="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Section progress</span>
          <span class="font-semibold text-gray-700">{{ section1Progress }} of {{ totalSection1Fields }}</span>
        </div>
      </aside>

      <!-- Section 1 Form -->
      <div class="flex-1 min-w-0">
        <ProgrammeIdentityForm
          ref="identityForm"
          v-model="section1Data"
          v-model:valid="section1Valid"
        />

        <!-- Bottom Continue Button -->
        <div class="mt-6 flex justify-end">
          <button
            @click="continueToNext"
            class="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Continue: Activities <span class="text-base">→</span>
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
