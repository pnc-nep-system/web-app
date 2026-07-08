<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import ProgrammeIdentityForm from '@/components/programme/ProgrammeIdentityForm.vue'
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
  { number: 2, title: '2 · Activities',          subtitle: 'Taxonomy B1–B9' },
  { number: 3, title: '3 · Geographic coverage', subtitle: 'Provinces & districts' },
  { number: 4, title: '4 · Government agreements', subtitle: 'Counterparts & status' },
  { number: 5, title: '5 · Keywords',            subtitle: 'Up to 5 tags' },
]

const currentStep = ref(1)
const isSaved = ref(false)
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

// Load saved data if an ID is present in query parameters
onMounted(async () => {
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
      isSaved.value = true
    } catch (err: any) {
      toast.error('Failed to load the programme entry data.')
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
  if (isSaving.value) return
  isSaving.value = true
  errors.value = {}

  try {
    const isEditMode = !!section1Data.value.id
    
    // Map data to API schema keys
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
    }

    let response
    if (isEditMode) {
      response = await memberApi.updateProgrammeEntry(section1Data.value.id!, payload)
    } else {
      response = await memberApi.createProgrammeEntry(payload)
    }

    // Success response handling
    toast.success(response.data.message || 'Saved successfully!')
    isSaved.value = true
    
    const savedId = response.data.data.id
    section1Data.value.id = savedId
    
    // Update route query parameters so reloading does not lose state
    await router.replace({ query: { ...route.query, id: String(savedId) } })

    if (exitAfterSave) {
      router.push('/dashboard')
    } else {
      // In a full implementation, we would proceed to Section 2
      alert('Section 2 (Activities) is not yet implemented.')
    }
  } catch (err: any) {
    if (err.response && err.response.status === 422) {
      errors.value = err.response.data.errors
      toast.error('Please correct the validation errors below.')
    } else {
      toast.error(err.response?.data?.message || 'An unexpected error occurred while saving.')
    }
  } finally {
    isSaving.value = false
  }
}

function saveAndExit() {
  saveEntry(true)
}

function continueToNext() {
  saveEntry(false)
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
          {{ isSaving ? 'Saving...' : 'Continue' }} <span class="text-base">→</span>
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
          v-model="section1Data"
          :errors="errors"
          @clear-error="clearError"
        />

        <!-- Bottom Continue Button -->
        <div class="mt-6 flex justify-end">
          <button
            @click="continueToNext"
            :disabled="isSaving"
            class="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {{ isSaving ? 'Saving...' : 'Continue: Activities' }} <span class="text-base">→</span>
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>

