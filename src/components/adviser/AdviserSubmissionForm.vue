<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdviserStore } from '@/stores/adviser'
import { memberApi } from '@/api/member.api'
import { taxonomyApi } from '@/api/taxonomy.api'
import FormFileUpload from '@/components/adviser/FormFileUpload.vue'
import FormScopeSelect from '@/components/adviser/FormScopeSelect.vue'
import FormCoordinatorSelect from '@/components/adviser/FormCoordinatorSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import type { Province } from '@/types/programmeGeographic'
import type { Category } from '@/types/taxonomy'
import type { User } from '@/types/user'

const router = useRouter()
const route = useRoute()
const adviserStore = useAdviserStore()

// ── Mode: 'adviser' = text input, 'entity' = select from programme entries ───
const mode = computed(() => (route.query.mode === 'entity' ? 'entity' : 'adviser'))

// ── Form state ────────────────────────────────────────────────────────────────
const submittingParty = ref('')
const selectedEntryId = ref('')
const selectedFile = ref<File | null>(null)
const analysisScope = ref<'full_map' | 'geographic' | 'thematic'>('full_map')
const selectedProvince = ref('')
const selectedCategory = ref('')
const assignedTo = ref('unassigned')

// ── Validation ────────────────────────────────────────────────────────────────
const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)

// ── Programme entries list (for entity mode) ──────────────────────────────────
interface ProgrammeEntryOption {
  id: number
  name: string
  organisation_name?: string
}
const programmeEntries = ref<ProgrammeEntryOption[]>([])
const loadingEntries = ref(false)

async function loadProgrammeEntries() {
  loadingEntries.value = true
  try {
    const res = await memberApi.getAllProgrammeEntries()
    const data = (res.data as any)?.data ?? res.data ?? []
    programmeEntries.value = (Array.isArray(data) ? data : []).map((entry: any) => ({
      id: entry.id,
      name: entry.name || entry.programme_name || `Entry #${entry.id}`,
      organisation_name: entry.organisation_name || '',
    }))
  } catch {
    programmeEntries.value = []
  } finally {
    loadingEntries.value = false
  }
}

// ── Reference data ────────────────────────────────────────────────────────────
const provinces = ref<Province[]>([])
const categories = ref<Category[]>([])
const loadingProvinces = ref(false)
const loadingCategories = ref(false)

const coordinators = computed<User[]>(() =>
  Object.entries(adviserStore.coordinatorMap).map(([id, name]) => ({
    id: Number(id),
    name,
  } as User))
)

async function loadProvinces() {
  if (provinces.value.length) return
  loadingProvinces.value = true
  try {
    const res = await memberApi.getProvinces()
    provinces.value = res.data?.data ?? (res.data as any) ?? []
  } catch {
    provinces.value = []
  } finally {
    loadingProvinces.value = false
  }
}

async function loadCategories() {
  if (categories.value.length) return
  loadingCategories.value = true
  try {
    const cats = await taxonomyApi.list({ force: true })
    categories.value = cats ?? []
  } catch {
    categories.value = []
  } finally {
    loadingCategories.value = false
  }
}

onMounted(() => {
  loadProvinces()
  loadCategories()
  loadProgrammeEntries()
  adviserStore.loadCoordinators()
})

// ── File handling ─────────────────────────────────────────────────────────────
function onFileUpdate(f: File | null) {
  selectedFile.value = f
  errors.value.document = f ? '' : 'Only PDF or Word documents are accepted.'
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(): boolean {
  const e: Record<string, string> = {}
  if (mode.value === 'adviser') {
    if (!submittingParty.value.trim()) e.submittingParty = 'Submitting party is required.'
  } else {
    if (!selectedEntryId.value) e.selectedEntry = 'Please select an entry.'
  }
  if (!selectedFile.value) e.document = 'A PDF or Word document is required.'
  if (analysisScope.value === 'geographic' && !selectedProvince.value) e.province = 'Please select a province.'
  if (analysisScope.value === 'thematic' && !selectedCategory.value) e.category = 'Please select a category.'
  errors.value = e
  return Object.keys(e).length === 0
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleSubmit() {
  submitError.value = null
  if (!validate()) return

  let scopeValue = 'full map'
  let scopeDetail: string | null = null

  if (analysisScope.value === 'geographic') {
    scopeValue = 'geographic subset'
    const prov = provinces.value.find(p => String(p.id) === selectedProvince.value)
    scopeDetail = prov?.province_name ?? selectedProvince.value
  } else if (analysisScope.value === 'thematic') {
    scopeValue = 'thematic subset'
    const cat = categories.value.find(c => String(c.id) === selectedCategory.value)
    scopeDetail = (cat as any)?.label ?? cat?.name ?? selectedCategory.value
  }

  // Determine submitting_party based on mode
  let partyName: string
  if (mode.value === 'entity' && selectedEntryId.value) {
    const selectedEntry = programmeEntries.value.find(e => e.id === Number(selectedEntryId.value))
    partyName = selectedEntry?.name ?? selectedEntryId.value
  } else {
    partyName = submittingParty.value.trim()
  }

  try {
    await adviserStore.submitDocument(
      {
        submitting_party: partyName,
        document_name: selectedFile.value!.name,
        analysis_scope: scopeValue,
        analysis_scope_detail: scopeDetail ?? null,
        assigned_to: assignedTo.value !== 'unassigned' ? Number(assignedTo.value) : null,
      },
      selectedFile.value!,
    )
    router.push('/adviser')
  } catch (err: any) {
    submitError.value = err?.response?.data?.message ?? 'Submission failed. Please try again.'
  }
}

function cancel() {
  router.push('/adviser')
}

function switchMode(newMode: 'adviser' | 'entity') {
  router.push({ query: { mode: newMode } })
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Form - left side -->
      <div class="flex-1 min-w-0 space-y-6">
        <!-- Submitting party (text input for Adviser mode) -->
        <div v-if="mode === 'adviser'">
          <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Submitting Enty</label>
          <input
            v-model="submittingParty"
            type="text"
            placeholder="Organisation or individual name"
            class="w-full border rounded-[8px] px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition"
            :class="errors.submittingParty
              ? 'border-red-400 focus:ring-red-300'
              : 'border-gray-200 focus:border-[#125B4D] focus:ring-[#125B4D]'"
          />
          <p v-if="errors.submittingParty" class="mt-2 text-[13px] text-red-500">
            {{ errors.submittingParty }}
          </p>
        </div>

        <!-- Select Entry (dropdown for Adviser Entity mode) -->
        <div v-else>
          <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Selecting Enty</label>
          <select
            v-model="selectedEntryId"
            class="w-full border rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:ring-1 transition appearance-none bg-white"
            :class="errors.selectedEntry
              ? 'border-red-400 focus:ring-red-300'
              : 'border-gray-200 focus:border-[#125B4D] focus:ring-[#125B4D]'"
          >
            <option value="" disabled>{{ loadingEntries ? 'Loading…' : '-- Choose a programme entry --' }}</option>
            <option v-for="entry in programmeEntries" :key="entry.id" :value="String(entry.id)">
              {{ entry.name }}{{ entry.organisation_name ? ` (${entry.organisation_name})` : '' }}
            </option>
          </select>
          <p v-if="errors.selectedEntry" class="mt-2 text-[13px] text-red-500">
            {{ errors.selectedEntry }}
          </p>
        </div>

        <!-- Document upload -->
        <FormFileUpload
          :model-value="selectedFile"
          :error="errors.document"
          @update:model-value="onFileUpdate"
        />

        <!-- Analysis scope + conditional province / category sub-selects -->
        <FormScopeSelect
          v-model="analysisScope"
          v-model:province="selectedProvince"
          v-model:category="selectedCategory"
          :provinces="provinces"
          :categories="categories"
          :loading-provinces="loadingProvinces"
          :loading-categories="loadingCategories"
          :error-province="errors.province"
          :error-category="errors.category"
        />

        <!-- Assign to coordinator (data from store) -->
        <FormCoordinatorSelect
          v-model="assignedTo"
          :coordinators="coordinators"
          :loading="adviserStore.isLoadingCoordinators"
        />

        <!-- Server error -->
        <p v-if="submitError" class="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-5 py-4">
          {{ submitError }}
        </p>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-6">
          <BaseButton variant="secondary" @click="cancel">
            Cancel
          </BaseButton>
          <BaseButton variant="primary" @click="handleSubmit" :disabled="adviserStore.submitting">
            <svg v-if="adviserStore.submitting" class="animate-spin h-4 w-4 shrink-0 mr-1" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ adviserStore.submitting ? 'Submitting…' : 'Continue →' }}
          </BaseButton>
        </div>
      </div>

      <!-- Adviser Tools - right side -->
      <div class="lg:w-80 shrink-0">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 class="text-base font-semibold text-gray-900 mb-1">Adviser Tools</h2>
          <p class="text-[13px] text-gray-500 mb-5">
            Access adviser submissions and create new adviser entity records.
          </p>
          <div class="flex flex-col gap-3">
            <router-link
              :to="{ query: { mode: 'adviser' } }"
              class="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
              :class="mode === 'adviser'
                ? 'bg-[#0F5A4D] !text-white hover:bg-[#0C4A3F]'
                : 'border-2 border-[#0F5A4D] text-[#0F5A4D] hover:bg-[#0F5A4D]/5'"
            >
              <BaseIcon name="bolt" size="18" />
              <span>Adviser</span>
            </router-link>
            <router-link
              :to="{ query: { mode: 'entity' } }"
              class="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-lg text-[13px] font-semibold transition-colors"
              :class="mode === 'entity'
                ? 'bg-[#0F5A4D] !text-white hover:bg-[#0C4A3F]'
                : 'border-2 border-[#0F5A4D] text-[#0F5A4D] hover:bg-[#0F5A4D]/5'"
            >
              <BaseIcon name="plus" size="18" />
              <span>Adviser Entity</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>