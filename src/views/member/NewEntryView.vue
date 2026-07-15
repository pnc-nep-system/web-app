<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import ProgrammeIdentityForm from '@/components/programme/ProgrammeIdentityForm.vue'
import ActivitiesForm from '@/components/programme/ActivitiesForm.vue'
import AgreementsForm from '@/components/programme/AgreementsForm.vue'
import ProgrammeKeywordsView from '@/components/programme/ProgrammeKeywordsView.vue'
import ProgrammeGeographic from '@/components/programme/ProgrammeGeographic.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { ProgrammeIdentity, ProgrammeGeographicData } from '@/types/programme'
import { memberApi } from '@/api/member.api'
import { useToast } from '@/utils/toast'
import { useAuth } from '@/composables/useAuth'
import { BUDGET_BANDS } from '@/constants/programme'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { currentUser } = useAuth()

const steps = [
  { number: 1, title: 'Programme identity', subtitle: 'Name, dates, scale' },
  { number: 2, title: 'Activities', subtitle: 'Taxonomy B1–B9' },
  { number: 3, title: 'Geographic coverage', subtitle: 'Provinces & districts' },
  { number: 4, title: 'Government agreements', subtitle: 'Counterparts & status' },
  { number: 5, title: 'Keywords', subtitle: 'Up to 5 tags' },
]

const dbIdToCodeMap: Record<number, string> = {}

const taxonomyMap: Record<string, number> = {}

const currentStep = ref(1)
const isSaving = ref(false)
const errors = ref<Record<string, string[]>>({})

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
const pageTitle = computed(() => section1Data.value.name.trim() || 'New programme entry')
const progressPercent = computed(() => (currentStep.value / steps.length) * 100)
const saveStatus = ref<'unsaved' | 'saving' | 'saved'>('unsaved')
const saveLabel = computed(() => {
  if (isSaving.value) return 'Saving…'
  if (saveStatus.value === 'saved') return 'Saved'
  return 'Not yet saved'
})

const keywordsData = ref<string[]>([])
const keywordsError = ref<string | null>(null)
const section3Data = ref<ProgrammeGeographicData>({
  provinceIds: [],
  districts: {},
  otherCountries: '',
})
const geographicFormRef = ref<InstanceType<typeof ProgrammeGeographic> | null>(null)
const section2Data = ref<any>(null)

const section4Data = ref<any[]>([])
const agreementsFormRef = ref<InstanceType<typeof AgreementsForm> | null>(null)

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
const submissionResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)
let resultTimer: ReturnType<typeof setTimeout> | null = null

function clearSubmissionResult() {
  if (resultTimer) clearTimeout(resultTimer)
  submissionResult.value = null
}

function showSubmissionResult(type: 'success' | 'error', message: string) {
  clearSubmissionResult()
  submissionResult.value = { type, message }
  resultTimer = setTimeout(() => {
    submissionResult.value = null
  }, 5000)
}

onMounted(async () => {
  const entryId = route.query.id

  try {
    const [cats, entryResult, geoResult] = await Promise.all([
      memberApi.getTaxonomyCategories(),
      entryId ? memberApi.getProgrammeEntry(entryId as string) : Promise.resolve(null),
      entryId ? memberApi.getGeography(entryId as string) : Promise.resolve(null),
    ])

    cats.forEach((cat: any) => {
      cat.subcategories?.forEach((sub: any) => {
        sub.items?.forEach((item: any) => {
          dbIdToCodeMap[item.id] = item.code
          taxonomyMap[item.code] = item.id
        })
      })
    })

    if (entryId && entryResult) {
      const entry = entryResult.data.data

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
        isUnverified: !!entry.is_unverified,
      }

      const selectedCodes = entry.activities?.map((a: any) => dbIdToCodeMap[a.activity_item_id] || a.code).filter(Boolean) || []
      const primaryCodes = entry.activities?.filter((a: any) => a.is_primary).map((a: any) => dbIdToCodeMap[a.activity_item_id] || a.code).filter(Boolean) || []

      const inclusionsMap: Record<string, any> = {}
      const educationLevelsMap: Record<string, number[]> = {}

      entry.activities?.forEach((a: any) => {
        const code = dbIdToCodeMap[a.activity_item_id] || a.code
        if (code) {
          inclusionsMap[code] = {
            hasInclusion: !!a.inclusion_group,
            dimensions: a.inclusion_group ? [{ group: a.inclusion_group, type: a.inclusion_type }] : []
          }
          educationLevelsMap[code] = a.activity_levels?.map((l: any) => l.education_level_id) || []
        }
      })

      section2Data.value = {
        selected: selectedCodes,
        primary: primaryCodes,
        aiText: '',
        inclusions: inclusionsMap,
        educationLevels: educationLevelsMap
      }

      if (geoResult) {
        const resLocations = geoResult.data.data || []
        const resProvinceIds: number[] = []
        const resDistricts: Record<number, number[]> = {}
        const resOtherCountries: string[] = []
        resLocations.forEach((loc: any) => {
          if (loc.country) {
            resOtherCountries.push(loc.country)
          } else if (loc.province_id) {
            if (!resProvinceIds.includes(loc.province_id)) {
              resProvinceIds.push(loc.province_id)
            }
            if (loc.district_id) {
              const distArray = resDistricts[loc.province_id] || []
              distArray.push(loc.district_id)
              resDistricts[loc.province_id] = distArray
            }
          }
        })
        section3Data.value = {
          provinceIds: resProvinceIds,
          districts: resDistricts,
          otherCountries: resOtherCountries.join(', ')
        }
      } else {
        section3Data.value = { provinceIds: [], districts: {}, otherCountries: '' }
      }

      section4Data.value = entry.government_agreements || []
      saveStatus.value = 'saved'
    }
  } catch (err: any) {
    console.error('Failed to load entry data:', err)
    if (entryId) {
      toast.error('Failed to load the programme entry data.')
    }
  }

  if (!entryId) {
    const savedDraft = sessionStorage.getItem('new_programme_entry_draft')

    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        currentStep.value = draft.currentStep || 1
        section1Data.value = draft.section1Data
        section2Data.value = draft.section2Data
        section3Data.value = draft.section3Data || { provinceIds: [], districts: {}, otherCountries: '' }
        section4Data.value = draft.section4Data || []
        toast.success('Resumed from saved draft.')
      } catch {
        console.error('Failed to parse draft data')
      }
    }
  }
})

function clearError(field: string) {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

function validateCurrentStep(): boolean {
  if (currentStep.value === 1) {
    const isValid = identityFormRef.value?.validate?.()
    if (!isValid) {
      toast.error('Please fix the errors in the form before saving.')
      return false
    }
  }
  if (currentStep.value === 2) {
    const isValid = activitiesFormRef.value?.validate?.()
    if (!isValid) {
      toast.error('Please fix the errors in the form before saving.')
      return false
    }
  }
  if (currentStep.value === 3) {
    const isValid = geographicFormRef.value?.validate?.()
    if (!isValid) {
      toast.error('Please fix the errors in the form before saving.')
      return false
    }
  }
  if (currentStep.value === 4) {
    const isValid = agreementsFormRef.value?.validate?.()
    if (isValid === false) {
      toast.error('Please select a counterpart and specify the institution details for all agreement rows.')
      return false
    }
  }
  return true
}
async function saveEntry(exitAfterSave: boolean, loadingAlreadySet = false): Promise<boolean> {
  if (isSaving.value && !loadingAlreadySet) return false
  if (!loadingAlreadySet && !validateCurrentStep()) return false
  if (!loadingAlreadySet) {
    isSaving.value = true
  }
  captureCurrentStepData()
  saveStatus.value = 'saving'
  errors.value = {}
  clearSubmissionResult()

  try {
    const isEditMode = !!section1Data.value.id

    // Map data to API schema keys
    const activitiesData = activitiesFormRef.value?.getData?.() || section2Data.value
    const agreementsData = agreementsFormRef.value?.getData?.() || section4Data.value

    const payload: any = {
      programme_name: section1Data.value.name,
      start_year: section1Data.value.startYear,
      end_year: section1Data.value.isOngoing ? null : section1Data.value.endYear,
      ongoing: section1Data.value.isOngoing,
      method: section1Data.value.method || null,
      verified_date: section1Data.value.verifiedDate || null,
      activities: activitiesData ? activitiesData.selected.map((id: string) => ({ code: id, primary: activitiesData.primary.includes(id) })) : [],
      province_ids: section3Data.value.provinceIds,
      district_ids: section3Data.value.districts,
      other_countries: section3Data.value.otherCountries,
    }

    if (section1Data.value.fteStaff !== null && String(section1Data.value.fteStaff) !== '') {
      payload.fte_staff = Number(section1Data.value.fteStaff)
    }
    if (section1Data.value.budgetBand) {
      payload.budget_band_id = BUDGET_BANDS.indexOf(section1Data.value.budgetBand) + 1
    }
    if (section1Data.value.directBeneficiaries !== null && String(section1Data.value.directBeneficiaries) !== '') {
      payload.direct_beneficiaries = Number(section1Data.value.directBeneficiaries)
    }
    if (section1Data.value.indirectBeneficiaries !== null && String(section1Data.value.indirectBeneficiaries) !== '') {
      payload.indirect_beneficiaries = Number(section1Data.value.indirectBeneficiaries)
    }

    // 4. Send API request
    let response
    if (isEditMode) {
      response = await memberApi.updateProgrammeEntry(section1Data.value.id!, payload as any)
    } else {
      response = await memberApi.createProgrammeEntry(payload as any)
    }

    // 5. Success — save response data and show result message
    sessionStorage.removeItem('new_programme_entry_draft')
    saveStatus.value = 'saved'

    const savedId = response.data.data.id
    section1Data.value.id = savedId

    // Prepare all three saving payloads
    
    // 1. Agreements
    const mappedAgreements = agreementsData ? agreementsData.map((a: any) => ({
      id: a.id || null,
      counterpart_agency: a.counterpart_agency,
      nature: a.nature,
      status: a.status,
      institution_name: a.institution_name
    })) : []

    // 2. Geography
    const geographicData = geographicFormRef.value?.getData?.() || section3Data.value
    const otherCountriesArray = (geographicData && geographicData.otherCountries)
      ? geographicData.otherCountries.split(',').map((c: string) => c.trim()).filter(Boolean)
      : []
    const provincesPayload = (geographicData && geographicData.provinceIds)
      ? geographicData.provinceIds.map((pId: number) => ({
          province_id: pId,
          district_ids: geographicData.districts[pId] || []
        }))
      : []
    const geographyPayload = {
      provinces: provincesPayload,
      other_countries: otherCountriesArray
    }

    // 3. Activities
    const mappedActivities = activitiesData ? activitiesData.selected.map((code: string) => {
      const dbId = taxonomyMap[code] || 1
      const levels = activitiesData.educationLevels?.[code] || []
      const inc = activitiesData.inclusions?.[code]

      const payloadAct: any = {
        activity_item_id: dbId,
        is_primary: activitiesData.primary.includes(code),
        education_level_ids: levels.length > 0 ? levels : [1],
        source: 'human_entered'
      }

      if (inc && inc.hasInclusion && inc.dimensions?.length > 0) {
        const dim = inc.dimensions[0]
        payloadAct.inclusion_group = dim.group
        payloadAct.inclusion_type = dim.type
      }

      return payloadAct
    }) : []

    // Launch all API requests in parallel!
    const agreementsPromise = memberApi.saveGovernmentAgreements(savedId, mappedAgreements)
    const geographyPromise = memberApi.saveGeography(savedId, geographyPayload)
    const activitiesPromise = mappedActivities.length > 0
      ? memberApi.saveActivities(savedId, mappedActivities)
      : Promise.resolve(null)

    const [agreementsResponse, geographyResponse, activitiesResponse] = await Promise.all([
      agreementsPromise,
      geographyPromise,
      activitiesPromise
    ])

    // Update frontend state with the API responses
    section4Data.value = agreementsResponse.data.data || []

    const resLocations = geographyResponse.data.data || []
    const resProvinceIds: number[] = []
    const resDistricts: Record<number, number[]> = {}
    const resOtherCountries: string[] = []
    resLocations.forEach((loc: any) => {
      if (loc.country) {
        resOtherCountries.push(loc.country)
      } else if (loc.province_id) {
        if (!resProvinceIds.includes(loc.province_id)) {
          resProvinceIds.push(loc.province_id)
        }
        if (loc.district_id) {
          const distArray = resDistricts[loc.province_id] || []
          distArray.push(loc.district_id)
          resDistricts[loc.province_id] = distArray
        }
      }
    })
    section3Data.value = {
      provinceIds: resProvinceIds,
      districts: resDistricts,
      otherCountries: resOtherCountries.join(', ')
    }

    if (activitiesResponse) {
      const resActivities = activitiesResponse.data.data || []
      const resInclusions: Record<string, any> = {}
      const resLevels: Record<string, number[]> = {}
      
      resActivities.forEach((a: any) => {
        const code = dbIdToCodeMap[a.activity_item_id] || a.code
        if (code) {
          resInclusions[code] = {
            hasInclusion: !!a.inclusion_group,
            dimensions: a.inclusion_group ? [{ group: a.inclusion_group, type: a.inclusion_type }] : []
          }
          resLevels[code] = a.activity_levels?.map((l: any) => l.education_level_id) || []
        }
      })
      
      section2Data.value = {
        selected: activitiesData.selected,
        primary: activitiesData.primary,
        aiText: activitiesData.aiText || '',
        inclusions: resInclusions,
        educationLevels: resLevels
      }
    }

    // Show persistent result message
    const successMsg = response.data.message || 'Saved successfully!'
    showSubmissionResult('success', successMsg)
    toast.success(successMsg)

    // Update route query parameters so reloading does not lose state
    await router.replace({ query: { ...route.query, id: String(savedId) } })

    if (exitAfterSave) {
      router.push('/dashboard')
    }
    return true
  } catch (err: any) {
    // 6. Error — show error result message
    if (err.response && err.response.status === 422) {
      const apiMessage = 'Please correct the validation errors below.'
      showSubmissionResult('error', apiMessage)
      if (exitAfterSave) {
        router.push('/dashboard')
      } else {
        errors.value = err.response.data.errors
        toast.error(apiMessage)
      }
    } else {
      const apiMessage = err.response?.data?.message || 'An unexpected error occurred while saving.'
      showSubmissionResult('error', apiMessage)
      toast.error(apiMessage)
    }
    return false
  } finally {
    // 7. Remove loading state + re-enable buttons
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
    section3Data: section3Data.value,
    section2Data: activitiesFormRef.value?.getData?.() || section2Data.value,
    section4Data: agreementsFormRef.value?.getData?.() || section4Data.value,
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

async function saveAndExit(loadingAlreadySet = false) {
  await saveEntry(true, loadingAlreadySet)
}

function captureCurrentStepData() {
  if (currentStep.value === 2 && activitiesFormRef.value) {
    section2Data.value = activitiesFormRef.value.getData()
  } else if (currentStep.value === 3 && geographicFormRef.value) {
    section3Data.value = geographicFormRef.value.getData()
  } else if (currentStep.value === 4 && agreementsFormRef.value) {
    section4Data.value = agreementsFormRef.value.getData()
  }
}

function goBack() {
  if (currentStep.value > 1) {
    captureCurrentStepData()
    completedSteps.value.delete(currentStep.value - 1)
    currentStep.value--
  }
}

function goToStep(stepNumber: number) {
  if (stepNumber > 1 && (!section1Data.value.name?.trim() || !section1Data.value.startYear)) {
    toast.error('Please fill in the Programme identity (Name and Start year) before navigating to other steps.')
    return
  }
  // Only validate when leaving Step 1
  if (currentStep.value === 1 && !validateCurrentStep()) {
    return
  }
  captureCurrentStepData()
  currentStep.value = stepNumber
}

async function continueToNext() {
  // --- Final step (Step 5: Finish & save) ---
  if (currentStep.value === 5) {
    // Validate that at least one keyword is entered
    if (keywordsData.value.length === 0) {
      keywordsError.value = 'You must add at least one keyword before saving.'
      toast.error('Please add at least one keyword.')
      return
    }
    keywordsError.value = null

    // Set loading state immediately so the spinner shows on the button
    isSaving.value = true
    saveStatus.value = 'saving'

    // Check organisation profile completeness before saving
    if (!(currentUser.value as any)?.is_profile_complete) {
      toast.error('You haven\'t completed Organisation profile yet')
      isSaving.value = false
      return
    }

    await saveAndExit(true)
    return
  }

  // --- Non-final steps (1–4): validate before advancing ---
  if (currentStep.value === 1) {
    const isValid = identityFormRef.value?.validate?.()
    if (!isValid) {
      toast.error('Please fix the errors in the form before continuing.')
      return
    }
  }

  if (currentStep.value === 2) {
    const isValid = activitiesFormRef.value?.validate?.()
    if (!isValid) {
      toast.error('Please fix the errors in the form before continuing.')
      return
    }
  }

  if (currentStep.value === 3) {
    const isValid = geographicFormRef.value?.validate?.()
    if (!isValid) {
      toast.error('Please fix the errors in the form before continuing.')
      return
    }
  }

  captureCurrentStepData()

  // Save current step data to database before advancing
  isSaving.value = true
  const success = await saveEntry(false, true)
  if (!success) {
    return
  }

  completedSteps.value.add(currentStep.value)

  if (currentStep.value < steps.length) {
    currentStep.value++
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

      <!-- Top-right action button (hidden on mobile) -->
      <div class="ml-auto hidden sm:block">
        <button @click="() => router.push('/entries/new')"
          class="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <span class="text-lg leading-none">+</span> New programme entry
        </button>
      </div>
    </template>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {{ pageTitle }}
          <StatusBadge v-if="section1Data.isUnverified" label="Unverified" variant="warning" />
        </h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Section {{ currentStep }} of {{ steps.length }} ·
          <span :class="saveStatus === 'saved' ? 'text-green-600' : 'text-gray-400'">
            {{ saveLabel }}
          </span>
        </p>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <button @click="() => saveAndExit()" :disabled="isSaving"
          class="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <svg v-if="isSaving" class="animate-spin -ml-1 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ isSaving ? 'Saving...' : 'Save & exit' }}
        </button>
      </div>
    </div>

    <!-- Submission Result Banner -->
    <div v-if="submissionResult"
      class="mb-6 px-5 py-3.5 rounded-lg border flex items-center gap-3 text-sm font-medium transition-all" :class="submissionResult.type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-800'">
      <!-- Success icon -->
      <svg v-if="submissionResult.type === 'success'" class="w-5 h-5 shrink-0 text-green-600" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <!-- Error icon -->
      <svg v-else class="w-5 h-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="flex-1">{{ submissionResult.message }}</span>
      <button @click="clearSubmissionResult" class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        :class="submissionResult.type === 'success' ? 'text-green-800' : 'text-red-800'">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Two-column layout: Step Sidebar + Form -->
    <div class="flex flex-col lg:flex-row gap-6 items-start w-full">
      <!-- Mobile Horizontal Stepper with progressive line (visible only on mobile/tablet) -->
      <div
        class="lg:hidden w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-2 relative select-none flex flex-col gap-2">
        <div class="flex items-center justify-between relative z-10">
          <!-- Background progressive line -->
          <div class="absolute top-[14px] left-[28px] right-[28px] h-1 bg-gray-100 -z-10 rounded-full">
            <div class="bg-teal-600 h-1 rounded-full transition-all duration-500"
              :style="{ width: ((currentStep - 1) / (steps.length - 1)) * 100 + '%' }"></div>
          </div>

          <!-- Step Bubbles -->
          <div v-for="step in steps" :key="step.number" @click="goToStep(step.number)"
            class="flex flex-col items-center cursor-pointer" :style="{ width: (100 / steps.length) + '%' }">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 duration-300"
              :class="[
                completedSteps.has(step.number)
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : step.number === currentStep
                    ? 'bg-teal-800 border-teal-800 text-white ring-4 ring-teal-100 shadow-md scale-105'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-teal-600 hover:text-teal-700'
              ]">
              <svg v-if="completedSteps.has(step.number)" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <template v-else>{{ step.number }}</template>
            </div>
            <span
              class="text-[9px] font-bold mt-1.5 transition-colors text-center hidden xs:block truncate px-1 max-w-full"
              :class="step.number === currentStep ? 'text-teal-900 font-extrabold' : 'text-gray-400'">
              {{ step.title.split(' ')[0] }}
            </span>
          </div>
        </div>

        <!-- Active Step Name Label -->
        <div class="text-center mt-1 pt-2 border-t border-gray-100">
          <span class="text-[9px] uppercase tracking-wider text-gray-400 font-extrabold block">Current Step</span>
          <span class="text-xs font-extrabold text-teal-900 mt-0.5 block animate-fade-in">
            {{ currentStep }} · {{ steps[currentStep - 1]?.title }}
          </span>
        </div>
      </div>

      <!-- Desktop Step Sidebar (visible only on desktop) -->
      <div class="hidden lg:flex flex-col gap-4 w-64 shrink-0 sticky top-24 select-none">
        <aside
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <ul class="divide-y divide-gray-100">
            <li v-for="step in steps" :key="step.number"
              class="flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer select-none"
              :class="step.number === currentStep ? 'bg-teal-50' : 'hover:bg-gray-50'" @click="goToStep(step.number)">
              <!-- Step bubble: checkmark if done, number otherwise -->
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                :class="completedSteps.has(step.number)
                    ? 'bg-green-600 text-white'
                    : step.number === currentStep
                      ? 'bg-teal-800 text-white'
                      : 'bg-gray-100 text-gray-500'
                  ">
                <svg v-if="completedSteps.has(step.number)" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="3">
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

          <!-- Section Progress -->
          <div class="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Section progress</span>
              <span class="font-semibold text-gray-700">{{ currentStep }} of {{ steps.length }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5">
              <div class="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
                :style="{ width: progressPercent + '%' }" />
            </div>
          </div>
        </aside>

        <!-- Navigation Guide Message -->
        <div 
          :class="[
            'p-4 border rounded-xl flex gap-3 text-xs shadow-sm transition-all duration-300',
            (!section1Data.name?.trim() || !section1Data.startYear)
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          ]"
        >
          <span class="shrink-0 mt-0.5">
            <!-- Warning Icon -->
            <svg 
              v-if="!section1Data.name?.trim() || !section1Data.startYear" 
              class="w-4 h-4 text-amber-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <!-- Unlocked Check Icon -->
            <svg 
              v-else 
              class="w-4 h-4 text-emerald-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <p 
              class="font-semibold mb-0.5"
              :class="(!section1Data.name?.trim() || !section1Data.startYear) ? 'text-amber-950' : 'text-emerald-950'"
            >
              {{ (!section1Data.name?.trim() || !section1Data.startYear) ? 'Navigation Restricted' : 'Navigation Unlocked' }}
            </p>
            <p class="leading-relaxed opacity-90">
              {{ 
                (!section1Data.name?.trim() || !section1Data.startYear) 
                  ? 'Complete Step 1: Programme identity (Name and Start year) to freely jump to other steps.' 
                  : 'Step 1 complete! You can now freely click and jump to any step in the sidebar.' 
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Form Content Container -->
      <div class="flex-1 min-w-0">
        <!-- Step 1: Programme Identity -->
        <ProgrammeIdentityForm v-if="currentStep === 1" ref="identityFormRef" v-model="section1Data"
          v-model:valid="section1Valid" :errors="errors" :disabled="isSaving" @clear-error="clearError" />

        <!-- Step 2: Activities -->
        <ActivitiesForm v-else-if="currentStep === 2" ref="activitiesFormRef" :model-value="section2Data" />

        <!-- Step 3: Geographic Coverage -->
        <ProgrammeGeographic
          v-else-if="currentStep === 3"
          ref="geographicFormRef"
          v-model="section3Data"
        />

        <!-- Step 4: Government Agreements -->
        <AgreementsForm v-else-if="currentStep === 4" ref="agreementsFormRef" v-model="section4Data" />

        <!-- Step 5: Keywords Form -->
        <div v-else-if="currentStep === 5">
          <ProgrammeKeywordsView v-model="keywordsData" />
          <!-- Keywords validation error -->
          <div v-if="keywordsError"
            class="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <svg class="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ keywordsError }}</span>
          </div>
        </div>

        <!-- Bottom Navigation -->
        <div class="mt-6 flex items-center justify-end gap-2 w-full sm:w-auto">
          <button v-if="currentStep > 1" type="button" @click="goBack"
            class="flex-1 sm:flex-initial flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span class="sm:hidden">← Back</span>
            <span class="hidden sm:inline">{{ backStepLabel }}</span>
          </button>

          <button @click="continueToNext" :disabled="isSaving"
            class="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none">
            <svg v-if="isSaving" class="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span v-if="isSaving">Saving...</span>
            <template v-else>
              <span class="sm:hidden">
                {{ currentStep === 5 ? 'Finish & save' : 'Continue →' }}
              </span>
              <span class="hidden sm:inline">
                {{ currentStep === 5 ? 'Finish & save' : nextStepLabel }}
              </span>
            </template>
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
