
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

// ── Modal state ───────────────────────────────────────────────────────────────
const showEntryModal = ref(false)
const entrySearch = ref('')

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

const filteredEntries = computed(() => {
  const q = entrySearch.value.toLowerCase().trim()
  if (!q) return programmeEntries.value
  return programmeEntries.value.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      (e.organisation_name && e.organisation_name.toLowerCase().includes(q)),
  )
})

const selectedEntryName = computed(() => {
  if (!selectedEntryId.value) return ''
  const entry = programmeEntries.value.find(e => e.id === Number(selectedEntryId.value))
  if (!entry) return ''
  return entry.organisation_name ? `${entry.name} (${entry.organisation_name})` : entry.name
})

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
    const payload: any = {
      submitting_party: partyName,
      document_name: selectedFile.value!.name,
      analysis_scope: scopeValue,
      analysis_scope_detail: scopeDetail ?? null,
    }

    // If a programme entry is selected (entity mode), link it
    if (selectedEntryId.value) {
      payload.programme_entry_id = Number(selectedEntryId.value)
    }

    // Assignment: old style or new style
    if (assignedTo.value !== 'unassigned') {
      payload.assign_to_staff_user_id = Number(assignedTo.value)
    }

    await adviserStore.submitDocument(payload, selectedFile.value!)
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
          <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Submitting Party</label>
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

        <!-- Select Entry (modal for Adviser Entity mode) -->
        <div v-else>
          <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Selecting Entry</label>
          <div
            class="w-full border rounded-[8px] px-4 py-3 text-[15px] cursor-pointer flex items-center justify-between transition bg-white"
            :class="errors.selectedEntry
              ? 'border-red-400'
              : 'border-gray-200 hover:border-[#125B4D]'"
            @click="showEntryModal = true"
          >
            <span :class="selectedEntryName ? 'text-gray-900' : 'text-gray-400'">
              {{ selectedEntryName || '-- Choose a programme entry --' }}
            </span>
            <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
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

        <!-- Assign to coordinator -->
        <FormCoordinatorSelect
          v-model="assignedTo"
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
          <div class="flex flex-col gap-3 ">
            <router-link
              :to="{ query: { mode: 'adviser' } }"
              class="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
              :class="mode === 'adviser'
                ? 'bg-[#0F5A4D] !text-white hover:bg-[#0C4A3F]'
                : 'border-2 border-[#0F5A4D] text-[#0F5A4D] hover:bg-[#0F5A4D]/5'"
            >
              <BaseIcon name="bolt" size="8" />
              <span>Advice on not existing programmes</span>
            </router-link>
            <router-link
              :to="{ query: { mode: 'entity' } }"
              class="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-lg text-[11px] font-semibold transition-colors"
              :class="mode === 'entity'
                ? 'bg-[#0F5A4D] !text-white hover:bg-[#0C4A3F]'
                : 'border-2 border-[#0F5A4D] text-[#0F5A4D] hover:bg-[#0F5A4D]/5'"
            >
              <BaseIcon name="plus" size="8" />
              <span>Advice on existing programmes</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal: Select Programme Entry ────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showEntryModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="showEntryModal = false"
        ></div>

        <!-- Modal panel -->
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-bold text-gray-900">Select Programme Entry</h3>
            <button
              type="button"
              @click="showEntryModal = false"
              class="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Search -->
          <div class="px-6 py-3 border-b border-gray-100">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" stroke-width="2"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2"/>
              </svg>
              <input
                v-model="entrySearch"
                type="text"
                placeholder="Search by name or organisation..."
                class="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] transition"
              />
            </div>
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto px-6 py-2">
            <div v-if="loadingEntries" class="py-8 text-center text-gray-400 text-sm">
              Loading entries...
            </div>
            <div v-else-if="filteredEntries.length === 0" class="py-8 text-center text-gray-400 text-sm">
              No entries found.
            </div>
            <div v-else class="divide-y divide-gray-100">
              <button
                v-for="entry in filteredEntries"
                :key="entry.id"
                type="button"
                class="w-full text-left px-3 py-3 rounded-lg transition-colors hover:bg-[#F4FBFA]"
                :class="{ 'bg-[#0F5A4D]/10': String(entry.id) === selectedEntryId }"
                @click="
                  selectedEntryId = String(entry.id);
                  showEntryModal = false;
                  entrySearch = '';
                "
              >
                <div class="text-[14px] font-semibold text-gray-900">{{ entry.name }}</div>
                <div v-if="entry.organisation_name" class="text-[12px] text-gray-500 mt-0.5">{{ entry.organisation_name }}</div>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
            <BaseButton variant="secondary" @click="showEntryModal = false">
              Cancel
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>