<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import ToastStack from '@/components/common/ToastStack.vue'
import { useToast } from '@/composables/useToast'
import { useAdviserStore } from '@/stores/adviser'
import { adviserApi } from '@/api/adviser.api'
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

// Coordinators are loaded into the store (shared, cached, role-filtered)
const coordinators = computed(() =>
  Object.entries(adviserStore.coordinatorMap).map(([id, name]) => ({
    id: Number(id),
    name,
  }))
)

// ── Bootstrap ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  // Load coordinators via store (cached, role-filtered)
  adviserStore.loadCoordinators()

  // Fast path: use cached store data if available
  const cached = adviserStore.submissions.find(s => s.id === submissionId)
  if (cached) {
    applySubmission(cached)
    loading.value = false
    return
  }

  // Fallback: fetch from API (direct URL / page refresh)
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
  assigneeId.value = data.assign_to_staff_user_id
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

import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

...

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

  </AppShell>
</template>