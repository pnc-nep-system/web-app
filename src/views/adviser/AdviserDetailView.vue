<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import ToastStack from '@/components/common/ToastStack.vue'
import { useToast } from '@/composables/useToast'
import { useAdviserStore } from '@/stores/adviser'
import { adviserApi } from '@/api/adviser.api'
import { organisationService } from '@/api/organisation.service'
import type { Submission } from '@/types/adviser'

// Adviser-specific sub-components
import DetailPageHeader from '@/components/adviser/DetailPageHeader.vue'
import DocumentViewerPanel from '@/components/adviser/DocumentViewerPanel.vue'
import WorkflowCard from '@/components/adviser/WorkflowCard.vue'
import SectionEditor from '@/components/adviser/SectionEditor.vue'
import RecommendationsList from '@/components/adviser/RecommendationsList.vue'
import GapsList from '@/components/adviser/GapsList.vue'

const route = useRoute()
const router = useRouter()
const adviserStore = useAdviserStore()
const { toasts, push: pushToast } = useToast()

// ── State ─────────────────────────────────────────────────────────────────────
const loading = ref(true)
const delivering = ref(false)
const submissionId = Number(route.params.id)
const currentStatus = ref('submitted_for_review')
const submission = ref<Submission | null>(null)
const assigneeId = ref<number | null>(null)

const form = ref({
  sectionA: '',
  sectionB: [] as { org: string; type: string; linked: string; text: string }[],
  sectionC: [] as { text: string }[],
  sectionD: '',
})

// ── AI Draft Programme Modal State ────────────────────────────────────────────
const showDraftModal = ref(false)
const draftGenerating = ref(false)
const organisations = ref<{ id: number; name: string }[]>([])
const selectedOrgId = ref<number | null>(null)
const programmeName = ref('')
const startYear = ref<number>(new Date().getFullYear())
const programmeProfile = ref({
  activities: { category_ids: [] as number[], education_level_ids: [] as number[], inclusion_groups: [] as string[] },
  geography: { province_ids: [] as number[] },
  audiences: { inclusion_types: [] as string[] },
})

async function openDraftModal() {
  showDraftModal.value = true
  if (!organisations.value.length) {
    try {
      const res = await organisationService.getOrganisations(1, '', { per_page: 200 })
      const data = (res.data as any)?.data ?? res.data
      organisations.value = Array.isArray(data) ? data : data?.data ?? []
    } catch {
      pushToast('Failed to load organisations')
    }
  }
}

async function generateAndDraft() {
  if (!selectedOrgId.value) {
    pushToast('Please select an organisation')
    return
  }
  if (!programmeName.value.trim()) {
    pushToast('Please enter a programme name')
    return
  }
  draftGenerating.value = true
  try {
    // Step 1: generate advisory note to get AI analysis
    const aiRes = await adviserApi.generateAdvisoryNote(submissionId, programmeProfile.value)
    const aiData = (aiRes.data as any)?.data ?? {}

    // Step 2: create the programme entry draft
    const payload = {
      organisation_id: selectedOrgId.value,
      programme_name: programmeName.value.trim(),
      start_year: startYear.value,
      activities: [],
      geography: programmeProfile.value.geography,
      keywords: aiData.executive_summary
        ? aiData.executive_summary.split(' ').slice(0, 3).map((w: string) => w.replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(Boolean)
        : [],
    }

    const entryRes = await adviserApi.createProgrammeEntry(submissionId, payload)
    const newId = entryRes.data?.data?.id

    showDraftModal.value = false
    pushToast('AI programme draft created — redirecting to form')
    router.push(`/entries/new?id=${newId}`)
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? 'Failed to generate programme draft'
    pushToast(msg)
  } finally {
    draftGenerating.value = false
  }
}

// Coordinators are loaded into the store (shared, cached, role-filtered)
const coordinators = computed(() =>
  Object.entries(adviserStore.coordinatorMap).map(([id, name]) => ({
    id: Number(id),
    name,
  }))
)

// ── Bootstrap ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  adviserStore.loadCoordinators()

  const cached = adviserStore.submissions.find(s => s.id === submissionId)
  if (cached) {
    applySubmission(cached)
    loading.value = false
    return
  }

  try {
    const res = await adviserApi.getById(submissionId)
    const data = (res.data as any)?.data ?? res.data
    if (data) applySubmission(data)
  } catch {
    // silently fall back to defaults
  } finally {
    loading.value = false
  }
})

function applySubmission(data: Submission) {
  submission.value = data
  currentStatus.value = data.status
  assigneeId.value = data.assign_to_staff_user_id ?? null
  if (data.section_profile) form.value.sectionA = data.section_profile
  if (data.section_gaps) form.value.sectionC = [{ text: data.section_gaps }]
  if (data.section_coordinators_notes) form.value.sectionD = data.section_coordinators_notes
}

// ── Computed ──────────────────────────────────────────────────────────────────
const scopeDisplay = computed(() => {
  if (!submission.value) return 'full map'
  const s = submission.value
  if (!s.analysis_scope_detail) return s.analysis_scope ?? 'full map'
  return `${s.analysis_scope}: ${s.analysis_scope_detail}`
})

// ── Actions ───────────────────────────────────────────────────────────────────
function goBack() {
  router.push('/adviser')
}

function saveDraft() {
  pushToast('Draft saved')
}

async function markDelivered() {
  if (delivering.value) return
  delivering.value = true
  try {
    const res = await adviserApi.markDelivered(submissionId)
    const data = (res.data as any)?.data ?? res.data
    const newStatus = data?.status ?? 'advice_delivered'
    currentStatus.value = newStatus
    const existing = adviserStore.submissions.find(s => s.id === submissionId)
    if (existing) existing.status = newStatus
    pushToast('Advisory note marked as delivered')
  } catch {
    pushToast('Failed to update status — please try again')
  } finally {
    delivering.value = false
  }
}

async function assignCoordinator(userId: number | null) {
  assigneeId.value = userId
  try {
    await adviserApi.updateAssignee(submissionId, userId)
    const existing = adviserStore.submissions.find(s => s.id === submissionId)
    if (existing) existing.assign_to_staff_user_id = userId
  } catch {
    // silently ignore — local state already updated optimistically
  }
}

// ── Section B / C helpers ─────────────────────────────────────────────────────
function addRecommendation() {
  form.value.sectionB.push({ org: '', type: 'Geographic overlap', linked: '—', text: '' })
}
function removeRecommendation(idx: number) {
  form.value.sectionB.splice(idx, 1)
}
function addGap() {
  form.value.sectionC.push({ text: '' })
}
function removeGap(idx: number) {
  form.value.sectionC.splice(idx, 1)
}
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb :crumbs="['The Adviser', 'Draft advisory note']" />
    </template>

    <!-- Loading -->
    <div v-if="loading" class="py-20 flex justify-center text-gray-400">
      <BaseIcon name="refresh" size="24" class="animate-spin" />
    </div>

    <div v-else class="max-w-[1400px] mx-auto pb-12">

      <!-- Header bar -->
      <DetailPageHeader
        :status="currentStatus"
        :document-name="submission?.document_name ?? '—'"
        :submitting-party="submission?.submitting_party ?? '—'"
        :scope-display="scopeDisplay"
        :delivering="delivering"
        @back="goBack"
        @save-draft="saveDraft"
        @mark-delivered="markDelivered"
      />


      <!-- Dual-pane workspace -->
      <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

        <!-- LEFT PANE: Document viewer + Workflow sidebar -->
        <div class="space-y-6">
          <DocumentViewerPanel
            :document-name="submission?.document_name ?? '—'"
            document-size=""
            :submitting-party="submission?.submitting_party ?? '—'"
            :analysis-scope="submission?.analysis_scope ?? '—'"
            :submitted-date="submission?.submitted_at ?? ''"
          />
          <WorkflowCard
            :current-status="currentStatus"
            :assignee-id="assigneeId"
            :coordinators="coordinators"
            :delivered-at="submission?.delivered_at ?? null"
            @update:assigneeId="assignCoordinator"
          />
        </div>

        <!-- RIGHT PANE: Advisory note sections A–D -->
        <div class="space-y-6">

          <SectionEditor
            title="A · Programme profile as interpreted"
            :model-value="form.sectionA"
            @update:model-value="form.sectionA = $event"
            badge="AI-GENERATED"
            badge-tone="indigo"
          />

          <RecommendationsList
            :items="form.sectionB"
            @add="addRecommendation"
            @remove="removeRecommendation"
            @update:org="(idx, val) => { if (form.sectionB[idx]) form.sectionB[idx].org = val }"
            @update:type="(idx, val) => { if (form.sectionB[idx]) form.sectionB[idx].type = val }"
            @update:text="(idx, val) => { if (form.sectionB[idx]) form.sectionB[idx].text = val }"
          />

          <GapsList
            :items="form.sectionC"
            @add="addGap"
            @remove="removeGap"
            @update:text="(idx, val) => { if (form.sectionC[idx]) form.sectionC[idx].text = val }"
          />

          <SectionEditor
            title="D · Notes for the coordinator"
            :model-value="form.sectionD"
            @update:model-value="form.sectionD = $event"
            badge="Internal — not released"
            badge-tone="amber"
            :is-internal="true"
            placeholder="Private notes for coordinations. This will not be exported in the final PDF..."
          />

        </div>
      </div>
    </div>

    <!-- Toast notifications -->
    <ToastStack :toasts="toasts" />

    <!-- AI Draft Programme Modal -->
    <Teleport to="body">
      <div v-if="showDraftModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-[16px] font-bold text-gray-900">AI Draft Programme</h2>
            <button @click="showDraftModal = false" class="text-gray-400 hover:text-gray-600 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-[13px] text-gray-500 leading-relaxed">
            The AI will analyse this submission and create a programme entry draft pre-filled across all 5 sections. You can review and edit before submitting.
          </p>

          <!-- Organisation -->
          <div>
            <label class="block text-[12px] font-semibold text-gray-700 mb-1">Member organisation <span class="text-red-500">*</span></label>
            <select
              v-model="selectedOrgId"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option :value="null" disabled>Select organisation…</option>
              <option v-for="org in organisations" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
          </div>

          <!-- Programme name -->
          <div>
            <label class="block text-[12px] font-semibold text-gray-700 mb-1">Programme name <span class="text-red-500">*</span></label>
            <input
              v-model="programmeName"
              type="text"
              placeholder="e.g. Education Support Initiative 2026"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Start year -->
          <div>
            <label class="block text-[12px] font-semibold text-gray-700 mb-1">Start year <span class="text-red-500">*</span></label>
            <input
              v-model.number="startYear"
              type="number"
              min="2000"
              max="2100"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="flex gap-3 pt-1">
            <button
              @click="showDraftModal = false"
              class="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-[13px] font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              @click="generateAndDraft"
              :disabled="draftGenerating"
              class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[13px] font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg v-if="draftGenerating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ draftGenerating ? 'Generating…' : 'Generate & open draft' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </AppShell>
</template>