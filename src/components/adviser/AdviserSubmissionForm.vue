<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdviserStore } from '@/stores/adviser'
import { memberApi } from '@/api/member.api'
import { taxonomyApi } from '@/api/taxonomy.api'
import type { Province } from '@/types/programmeGeographic'
import type { Category } from '@/types/taxonomy'

const router = useRouter()
const adviserStore = useAdviserStore()

// ── Form fields ──────────────────────────────────────────────────────────────
const submittingParty = ref('')
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const analysisScope = ref<'full_map' | 'geographic' | 'thematic'>('full_map')
const selectedProvince = ref<string>('')
const selectedCategory = ref<string>('')
const assignedTo = ref('unassigned')

// ── Validation ───────────────────────────────────────────────────────────────
const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)

// ── Remote data ──────────────────────────────────────────────────────────────
const provinces = ref<Province[]>([])
const categories = ref<Category[]>([])
const coordinators = ref<User[]>([])
const loadingProvinces = ref(false)
const loadingCategories = ref(false)

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function isValidFile(f: File) {
  return (
    ALLOWED_TYPES.includes(f.type) ||
    f.name.endsWith('.pdf') ||
    f.name.endsWith('.doc') ||
    f.name.endsWith('.docx')
  )
}

// ── File handling ─────────────────────────────────────────────────────────────
function onFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) setFile(input.files[0])
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setFile(f)
}

function setFile(f: File) {
  if (!isValidFile(f)) {
    errors.value.document = 'Only PDF or Word documents are accepted.'
    return
  }
  selectedFile.value = f
  errors.value.document = ''
}

function triggerFileInput() {
  document.getElementById('fileInput')?.click()
}

// ── Scope data loaders ────────────────────────────────────────────────────────
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
    // force: true bypasses the localStorage cache so we always get the latest data
    const cats = await taxonomyApi.list({ force: true })
    categories.value = cats ?? []
  } catch {
    categories.value = []
  } finally {
    loadingCategories.value = false
  }
}

async function loadCoordinators() {
  adviserStore.loadCoordinators()
}

onMounted(() => {
  loadProvinces()
  loadCategories()
  adviserStore.loadCoordinators()
})

// ── Computed scope display ────────────────────────────────────────────────────
const scopeOptions = [
  { value: 'full_map',    label: 'Full map (default)' },
  { value: 'geographic',  label: 'Geographic subset' },
  { value: 'thematic',    label: 'Thematic subset' },
]

const showProvince = computed(() => analysisScope.value === 'geographic')
const showCategory = computed(() => analysisScope.value === 'thematic')

// ── Validation ────────────────────────────────────────────────────────────────
function validate(): boolean {
  const e: Record<string, string> = {}
  if (!submittingParty.value.trim()) e.submittingParty = 'Submitting party is required.'
  if (!selectedFile.value) e.document = 'A PDF or Word document is required.'
  if (analysisScope.value === 'geographic' && !selectedProvince.value)
    e.province = 'Please select a province.'
  if (analysisScope.value === 'thematic' && !selectedCategory.value)
    e.category = 'Please select a category.'
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
    const prov = provinces.value.find((p) => String(p.id) === selectedProvince.value)
    scopeDetail = prov?.province_name ?? selectedProvince.value
  } else if (analysisScope.value === 'thematic') {
    scopeValue = 'thematic subset'
    const cat = categories.value.find((c) => String(c.id) === selectedCategory.value)
    scopeDetail = (cat as any)?.label ?? cat?.name ?? selectedCategory.value
  }

  const payload = {
    submitting_party: submittingParty.value.trim(),
    document_name: selectedFile.value!.name,
    analysis_scope: scopeValue,
    analysis_scope_detail: scopeDetail ?? null,
    assigned_to: assignedTo.value !== 'unassigned' ? Number(assignedTo.value) : null,
  }

  try {
    await adviserStore.submitDocument(payload, selectedFile.value!)
    router.push('/adviser')
  } catch (err: any) {
    submitError.value = err?.response?.data?.message ?? 'Submission failed. Please try again.'
  }
}

function cancel() {
  router.push('/adviser')
}
</script>

<template>
  <div>
    <div class="bg-white border border-gray-100 rounded-xl p-[44px] space-y-8 shadow-sm">
      
      <!-- Submitting party -->
      <div>
        <label class="block text-[15px] font-bold text-gray-900 mb-2.5">
          Submitting party
        </label>
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

      <!-- Document upload -->
      <div>
        <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Document</label>

        <!-- Drop zone -->
        <div
          class="border border-dashed rounded-lg py-12 px-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition relative"
          style="border-width: 1.5px;"
          :class="[
            isDragging ? 'border-teal-500 bg-teal-50/50' : errors.document ? 'border-red-400 bg-red-50/50' : 'border-gray-300 bg-white hover:border-[#125B4D] hover:bg-gray-50/30',
          ]"
          @click="triggerFileInput"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
        >
          <!-- Upload icon -->
          <svg v-if="!selectedFile" class="w-[26px] h-[26px] text-gray-400 mb-2" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>

          <!-- File selected indicator -->
          <svg v-else class="w-7 h-7 text-[#125B4D]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>

          <p v-if="!selectedFile" class="text-[15px] text-gray-500 text-center">
            Drop a PDF or Word document, or
            <span class="text-[#0E5B4D] font-medium underline underline-offset-[3px] hover:text-[#0C4A3F]">browse files</span>
          </p>
          <p v-else class="text-[15px] text-gray-900 font-medium truncate max-w-xs">
            {{ selectedFile.name }}
          </p>
          <p v-if="!selectedFile" class="text-[14px] text-gray-400 mt-1">Accepts .pdf, .doc, .docx</p>
        </div>

        <input
          id="fileInput"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          class="hidden"
          @change="onFileInputChange"
        />

        <p v-if="errors.document" class="mt-2 text-[13px] text-red-500">{{ errors.document }}</p>
      </div>

      <!-- Analysis scope -->
      <div>
        <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Analysis scope</label>
        <select
          v-model="analysisScope"
          class="w-full border border-gray-200 rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] bg-white transition"
          :class="{ 'border-teal-500 ring-1 ring-teal-400': analysisScope !== 'full_map' }"
        >
          <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <p class="mt-2 text-[13px] text-gray-400 tracking-wide">
          Narrowing scope is useful for very specific proposals, but the full map gives the most complete coordination picture.
        </p>

        <!-- Focus province (geographic) -->
        <div v-if="showProvince" class="mt-6">
          <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Focus province</label>
          <select
            v-model="selectedProvince"
            class="w-full border rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] bg-white transition"
            :class="errors.province ? 'border-red-400' : 'border-gray-200'"
          >
            <option value="">
              {{ loadingProvinces ? 'Loading…' : 'Select a province' }}
            </option>
            <option v-for="p in provinces" :key="p.id" :value="String(p.id)">
              {{ p.province_name }}
            </option>
          </select>
          <p v-if="errors.province" class="mt-1.5 text-[13px] text-red-500">{{ errors.province }}</p>
        </div>

        <!-- Focus category (thematic) -->
        <div v-if="showCategory" class="mt-6">
          <label class="block text-[15px] font-bold text-gray-900 mb-2.5">
            Focus activity category
          </label>
          <select
            v-model="selectedCategory"
            class="w-full border rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] bg-white transition"
            :class="errors.category ? 'border-red-400' : 'border-gray-200'"
          >
            <option value="">
              {{ loadingCategories ? 'Loading…' : 'Select a category' }}
            </option>
            <option v-for="c in categories" :key="c.id" :value="String(c.id)">
              {{ (c as any).label ?? c.name }}
            </option>
          </select>
          <p v-if="errors.category" class="mt-1.5 text-[13px] text-red-500">{{ errors.category }}</p>
        </div>
      </div>

      <!-- Assign to coordinator -->
      <div>
        <label class="block text-[15px] font-bold text-gray-900 mb-2.5">
          Assign to coordinator
        </label>
        <select
          v-model="assignedTo"
          class="w-full border border-gray-200 rounded-[8px] px-4 py-3 text-[15px] text-gray-900 focus:outline-none focus:border-[#125B4D] focus:ring-1 focus:ring-[#125B4D] bg-white transition"
          @mousedown="loadCoordinators"
        >
          <option value="unassigned">Unassigned — leave in shared queue</option>
          <option
            v-if="loadingCoordinators"
            disabled
            value=""
          >Loading coordinators…</option>
          <option
            v-for="coord in coordinators"
            :key="coord.id"
            :value="String(coord.id)"
          >
            {{ coord.name }}
          </option>
        </select>
      </div>

      <!-- Server error -->
      <p v-if="submitError" class="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-5 py-4">
        {{ submitError }}
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-6">
        <button
          type="button"
          @click="cancel"
          class="px-6 py-3 text-[15px] font-medium text-gray-700 bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="adviserStore.submitting"
          class="px-6 py-3 text-[15px] font-semibold text-white bg-[#125B4D] border border-[#125B4D] rounded-[8px] hover:bg-[#0E4A3F] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="adviserStore.submitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ adviserStore.submitting ? 'Submitting…' : 'Continue →' }}
        </button>
      </div>

    </div>
  </div>
</template>
