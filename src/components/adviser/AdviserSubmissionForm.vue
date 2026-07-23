
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdviserStore } from '@/stores/adviser'
import { memberApi } from '@/api/member.api'
import { taxonomyApi } from '@/api/taxonomy.api'
import FormFileUpload from '@/components/adviser/FormFileUpload.vue'
import FormScopeSelect from '@/components/adviser/FormScopeSelect.vue'
import FormCoordinatorSelect from '@/components/adviser/FormCoordinatorSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import type { Province } from '@/types/programmeGeographic'
import type { Category } from '@/types/taxonomy'
import type { User } from '@/types/user'

const router = useRouter()
const adviserStore = useAdviserStore()

// ── Form state ────────────────────────────────────────────────────────────────
const submittingParty = ref('')
const selectedFile = ref<File | null>(null)
const analysisScope = ref<'full_map' | 'geographic' | 'thematic'>('full_map')
const selectedProvince = ref('')
const selectedCategory = ref('')
const assignedTo = ref('unassigned')

// ── Validation ────────────────────────────────────────────────────────────────
const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)

// ── Reference data ────────────────────────────────────────────────────────────
const provinces = ref<Province[]>([])
const categories = ref<Category[]>([])
const loadingProvinces = ref(false)
const loadingCategories = ref(false)

// Coordinators are owned by the store (shared, cached, role-filtered)
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

// Eagerly load all reference data so dropdowns open instantly
onMounted(() => {
  loadProvinces()
  loadCategories()
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
  if (!submittingParty.value.trim()) e.submittingParty = 'Submitting party is required.'
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

  try {
    await adviserStore.submitDocument(
      {
        submitting_party: submittingParty.value.trim(),
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
</script>

<template>
  <div>
    <div class="bg-white border border-gray-100 rounded-xl p-8 space-y-6 shadow-sm">

      <!-- Submitting party -->
      <div>
        <label class="block text-[15px] font-bold text-gray-900 mb-2.5">Submitting party</label>
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
        v-if="false"
        v-model="assignedTo"
        :coordinators="coordinators"
        :loading="!adviserStore.coordinatorMap || Object.keys(adviserStore.coordinatorMap).length === 0"
      />

      <!-- Server error -->
      <p v-if="submitError" class="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-5 py-4">
        {{ submitError }}
      </p>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-6">
        <BaseButton
          variant="secondary"
          @click="cancel"
        >
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="handleSubmit"
          :disabled="adviserStore.submitting"
        >
          <svg v-if="adviserStore.submitting" class="animate-spin h-4 w-4 shrink-0 mr-1" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ adviserStore.submitting ? 'Submitting…' : 'Continue →' }}
        </BaseButton>
      </div>

    </div>
  </div>
</template>
