<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import ProgrammeIdentityForm from '@/components/programme/ProgrammeIdentityForm.vue'
import ActivitiesForm from '@/components/programme/ActivitiesForm.vue'
import ProgrammeKeywordsView from '@/components/programme/ProgrammeKeywordsView.vue'
import type { ProgrammeIdentity } from '@/types/programme'
import { memberApi } from '@/api/member.api'
import { useToast } from '@/utils/toast'
import { BUDGET_BANDS } from '@/constants/programme'

const router = useRouter()
const route = useRoute()
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
const isSaving = ref(false)
const errors = ref<Record<string, string[]>>({})

// --- Section 1 Form Data ---
const section1Data = ref<ProgrammeIdentity>({
  id: null,
  name: '',
  startYear: new Date().getFullYear(),
  endYear: null,
  isOngoing: false,
  fteStaff: null,
  budgetBand: null,
  directBeneficiaries: null,
  indirectBeneficiaries: null,
  method: '',
  verifiedDate: '',
})

const section1Valid = ref(false)
const identityFormRef = ref<InstanceType<typeof ProgrammeIdentityForm> | null>(null)
const activitiesFormRef = ref<InstanceType<typeof ActivitiesForm> | null>(null)

// Dynamic page title — shows programme name once entered
const pageTitle = computed(() => section1Data.value.name.trim() || 'New programme entry')

// Progress bar width for sidebar
const progressPercent = computed(() => (currentStep.value / steps.length) * 100)

// Save status display
const saveStatus = ref<'unsaved' | 'saving' | 'saved'>('unsaved')

const saveLabel = computed(() => {
  if (isSaving.value) return 'Saving…'
  if (saveStatus.value === 'saved') return 'Saved'
  return 'Not yet saved'
})

// --- Section 5 Data (Keywords) ---
const keywordsData = ref<string[]>([])
const section2Data = ref(null)


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
    !!d.method,
    !!d.verifiedDate,
  ]
  return fields.filter(Boolean).length
})

const totalSection1Fields = 9

onMounted(async () => {

  // Load saved data if an ID is present in query parameters
  const entryId = route.query.id
  if (entryId) {
    try {
      const response = await memberApi.getProgrammeEntry(entryId as string)
      const entry = response.data.data

      section1Data.value = {
        id: entry.id,
        name: entry.programme_name || '',
        startYear: entry.start_year || null,
        endYear: entry.end_year || null,
        isOngoing: !!entry.ongoing,
        fteStaff: entry.fte_staff ? parseFloat(entry.fte_staff) : null,
        budgetBand: (entry.budget_band_id
          ? BUDGET_BANDS[entry.budget_band_id - 1]
          : null) || null,
        directBeneficiaries: entry.direct_beneficiaries || null,
        indirectBeneficiaries: entry.indirect_beneficiaries || null,
        method: entry.method || '',
        verifiedDate: entry.verified_date || '',
      }
      section2Data.value = {
        selected: entry.activities?.map((a: any) => a.code) || [],
        primary: entry.activities?.filter((a: any) => a.primary).map((a: any) => a.code) || [],
        aiText: '',
      }
      saveStatus.value = 'saved'
    } catch (err: any) {
      toast.error('Failed to load the programme entry data.')
    }
  } else {
    // Load draft from session storage
    const savedDraft = sessionStorage.getItem('new_programme_entry_draft')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        currentStep.value = draft.currentStep || 1
        section1Data.value = draft.section1Data
        section2Data.value = draft.section2Data
        toast.success('Resumed from saved draft.')
      } catch {
        console.error('Failed to parse draft data')
      }
    }
  }
})

// Handle clearing validation errors from child component edits
function clearError(field: string) {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

// Unified API Save function
async function saveEntry(exitAfterSave: boolean) {
  // Run client-side validation on the current step
  if (currentStep.value === 1) {
    const isValid = identityFormRef.value?.validate?.()
    if (!isValid) {
      toast.error('Please fix the errors in the form before saving.')
      return
    }
  }
  if (currentStep.value === 2) {
    const isValid = activitiesFormRef.value?.validate?.()
    if (!isValid) {
      toast.error('Please fix the errors in the form before saving.')
      return
    }
  }

  if (isSaving.value) return
  isSaving.value = true
  errors.value = {}
  try {
    const isEditMode = !!section1Data.value.id

    // Map data to API schema keys
    const activitiesData = activitiesFormRef.value?.getData?.()

    const payload = {
      programme_name: section1Data.value.name,
      start_year: section1Data.value.startYear,
      end_year: section1Data.value.isOngoing ? null : section1Data.value.endYear,
      ongoing: section1Data.value.isOngoing,
      fte_staff: section1Data.value.fteStaff,
      budget_band_id: section1Data.value.budgetBand
        ? BUDGET_BANDS.indexOf(section1Data.value.budgetBand) + 1
        : null,
      direct_beneficiaries: section1Data.value.directBeneficiaries,
      indirect_beneficiaries: section1Data.value.indirectBeneficiaries,
      method: section1Data.value.method || null,
      verified_date: section1Data.value.verifiedDate || null,
      activities: activitiesData ? activitiesData.selected.map((id: string) => ({ code: id, primary: activitiesData.primary.includes(id) })) : [],
    }
    console.log('API Payload:', payload)


    let response
    if (isEditMode) {
      response = await memberApi.updateProgrammeEntry(section1Data.value.id!, payload)
    } else {
      response = await memberApi.createProgrammeEntry(payload)
    }

    // Success response handling
    sessionStorage.removeItem('new_programme_entry_draft')

    toast.success(response.data.message || 'Saved successfully!')
    saveStatus.value = 'saved'

    const savedId = response.data.data.id
    section1Data.value.id = savedId

    // Update route query parameters so reloading does not lose state
    await router.replace({ query: { ...route.query, id: String(savedId) } })

    if (exitAfterSave) {
      router.push('/dashboard')
    }
  } catch (err: any) {
    if (err.response && err.response.status === 422) {
      console.error('API Validation Error:', err.response.data.errors)
      if (exitAfterSave) {
        console.log('Suppresing validation error toast on exit.')
        router.push('/dashboard') // Proceed to exit anyway, even if save failed
      } else {
        errors.value = err.response.data.errors
        toast.error('Please correct the validation errors below.')
      }
    } else {
      toast.error(err.response?.data?.message || 'An unexpected error occurred while saving.')
    }
  } finally {
    isSaving.value = false
  }
}

// Completed steps set
const completedSteps = ref<Set<number>>(new Set())

// Bottom button labels
const nextStepLabel = computed(() => {
  const next = steps[currentStep.value]
  return next ? `Continue: ${next.title.replace(/^\d+ · /, '')} →` : 'Finish →'
})

const backStepLabel = computed(() => {
  const prev = steps[currentStep.value - 2]
  return prev ? `← Back: ${prev.title.replace(/^\d+ · /, '')}` : ''
})
function saveDraftAndExit() {
  const draft = {
    currentStep: currentStep.value,
    section1Data: section1Data.value,
    section2Data: activitiesFormRef.value?.getData?.(),
  }
  sessionStorage.setItem('new_programme_entry_draft', JSON.stringify(draft))
  toast.success('Progress saved to session.')
  router.push('/dashboard')
}
const currentSectionProgress = computed(() => {
  if (currentStep.value === 1) {
    return { current: section1Progress.value, total: totalSection1Fields }
  }
  if (currentStep.value === 5) {
    return { current: keywordsData.value.length, total: 5 }
  }
  return { current: 0, total: 0 }
})

const continueButtonText = computed(() => {
  if (currentStep.value === 1) return 'Continue: Activities'
  if (currentStep.value === 2) return 'Continue: Geographic coverage'
  if (currentStep.value === 3) return 'Continue: Government agreements'
  if (currentStep.value === 4) return 'Continue: Keywords'
  return 'Finish & save'
})

function saveAndExit() {
  saveEntry(true)
}

function goBack() {
  if (currentStep.value > 1) {
    completedSteps.value.delete(currentStep.value - 1)
    currentStep.value--
  }
}

function continueToNext() {
  // Run client-side validation on the current step
  if (currentStep.value === 1) {
    const isValid = identityFormRef.value?.validate?.()
    if (!isValid) return
  }
  if (currentStep.value === 2) {
    const isValid = activitiesFormRef.value?.validate?.()
    if (!isValid) return
  }

  // Save to API when leaving Step 1
  if (currentStep.value === 1) {
    saveEntry(false)
  }

  completedSteps.value.add(currentStep.value)

  if (currentStep.value < steps.length) {
    currentStep.value++
    return
  }

  // Final step — save & exit
  if (completedSteps.value.size < steps.length) {
    toast.error('You need to complete the form')
    return
  }

  if (!(auth.currentUser as any)?.is_profile_complete) {
    toast.error('You haven\'t complete Organisation profile yet')
    return
  }

  saveAndExit()
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
        <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Section {{ currentStep }} of {{ steps.length }} ·
          <span :class="saveStatus === 'saved' ? 'text-green-600' : 'text-gray-400'">
            {{ saveLabel }}
          </span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="saveAndExit"
          :disabled="isSaving"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {{ isSaving ? 'Saving...' : 'Save & exit' }}
        </button>
        <button
          @click="continueToNext"
          :disabled="isSaving"
          class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
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
            <!-- Step bubble: checkmark if done, number otherwise -->
            <span
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
              :class="
                completedSteps.has(step.number)
                  ? 'bg-green-600 text-white'
                  : step.number === currentStep
                    ? 'bg-teal-800 text-white'
                    : 'bg-gray-100 text-gray-500'
              "
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
        <div class="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Section progress</span>
            <span class="font-semibold text-gray-700">{{ currentStep }} of {{ steps.length }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-1.5">
            <div
              class="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
              :style="{ width: progressPercent + '%' }"
            />
          </div>
        </div>
      </aside>

      <!-- Form Content Container -->
      <div class="flex-1 min-w-0">
        <!-- Step 1: Programme Identity -->
        <ProgrammeIdentityForm
          v-if="currentStep === 1"
          ref="identityFormRef"
          v-model="section1Data"
          v-model:valid="section1Valid"
          :errors="errors"
          @clear-error="clearError"
        />

        <!-- Step 2: Activities -->
        <ActivitiesForm v-else-if="currentStep === 2" ref="activitiesFormRef" />

        <!-- Step 3 Placeholder -->
        <div
          v-else-if="currentStep === 3"
          class="p-8 bg-white rounded-xl shadow-sm border border-gray-100 select-none"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Section 3: Geographic coverage</h3>
          <p class="text-sm text-gray-500">
            Geographic coverage form is currently in development. Use the sidebar to navigate.
          </p>
        </div>

        <!-- Step 4 Placeholder -->
        <div
          v-else-if="currentStep === 4"
          class="p-8 bg-white rounded-xl shadow-sm border border-gray-100 select-none"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Section 4: Government agreements</h3>
          <p class="text-sm text-gray-500">
            Government agreements form is currently in development. Use the sidebar to navigate.
          </p>
        </div>

        <!-- Step 5: Keywords Form -->
        <ProgrammeKeywordsView v-else-if="currentStep === 5" v-model="keywordsData" />

        <!-- Bottom Navigation -->
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
            @click="continueToNext"
            :disabled="isSaving"
            class="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer select-none"
          >
            {{ currentStep === 5 ? 'Finish & save' : nextStepLabel }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
