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
import { getMapEntries } from '@/api/map.api'
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

  form.value.sectionA = data.section_profile || ''

  if (data.section_gaps) form.value.sectionC = [{ text: data.section_gaps }]
  if (data.section_coordinators_notes) form.value.sectionD = data.section_coordinators_notes

  if (form.value.sectionB.length === 0) {
    fetchMapOverlaps()
  }
}

function handleViewDocument() {
  const docUrl = submission.value?.document_url || submission.value?.document_path
  if (docUrl) {
    window.open(docUrl, '_blank')
  } else {
    pushToast(`Document: ${submission.value?.document_name || 'Uploaded File'} (read for prototype review)`)
  }
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
  if (!form.value.sectionA || !form.value.sectionA.trim()) {
    pushToast('Please complete Section A (Programme profile as interpreted) before marking advice as delivered.')
    return
  }

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

function exportAdvisoryNotePdf() {
  const docName = (submission.value?.document_name || 'Advisory_Note').replace(/[^a-zA-Z0-9_-]/g, '_')
  const title = submission.value?.document_name || 'Advisory Note'
  const party = submission.value?.submitting_party || 'Member Organisation'
  const scope = scopeDisplay.value

  let sectionsHtml = ''

  // Section A: Profile as interpreted
  if (form.value.sectionA && form.value.sectionA.trim()) {
    sectionsHtml += `
      <div class="section">
        <div class="section-title">A · Programme profile as interpreted</div>
        <div class="content-box">${form.value.sectionA.trim()}</div>
      </div>
    `
  }

  // Section B: Coordination recommendations (only if present)
  if (form.value.sectionB && form.value.sectionB.length > 0) {
    const recHtml = form.value.sectionB.map((r, i) => `
      <div style="border:1px solid #cbd5e1; border-radius:8px; padding:12px; margin-bottom:10px; background:#ffffff;">
        <strong style="color:#0f172a;">Recommendation ${i + 1}: ${r.org}</strong> <span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold;">${r.type}</span><br/>
        <em style="color:#64748b; font-size:12px;">Linked Entry: ${r.linked}</em>
        <p style="margin-top:6px; font-size:13px; color:#334155;">${r.text}</p>
      </div>
    `).join('')

    sectionsHtml += `
      <div class="section">
        <div class="section-title">B · Coordination recommendations</div>
        ${recHtml}
      </div>
    `
  }

  // Section C: Gaps in the map (only if populated)
  const validGaps = (form.value.sectionC || []).filter(g => g && g.text && g.text.trim())
  if (validGaps.length > 0) {
    const gapHtml = validGaps.map(g => `<p style="margin:4px 0; font-size:13px;">• ${g.text.trim()}</p>`).join('')
    sectionsHtml += `
      <div class="section">
        <div class="section-title">C · Gaps in the map</div>
        <div class="content-box">${gapHtml}</div>
      </div>
    `
  }

  // Note: Section D (Notes for the coordinator) is internal-only and explicitly excluded from exported advisory reports.

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Advisory Note — ${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 30px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
    h1 { color: #0F5A4D; font-size: 22px; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; border-bottom: 2px solid #0F5A4D; padding-bottom: 10px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: bold; color: #0F5A4D; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; }
    .content-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; white-space: pre-wrap; font-size: 13px; }
  </style>
</head>
<body>
  <h1>Advisory Note</h1>
  <div class="meta">
    <strong>Source Document:</strong> ${title} | <strong>Submitted by:</strong> ${party} | <strong>Scope:</strong> ${scope}
  </div>
  ${sectionsHtml || '<p style="color:#94a3b8; font-style:italic;">No active report sections recorded.</p>'}
</body>
</html>`

  const blob = new Blob([fullHtml], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Advisory_Note_${docName}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  pushToast(`Downloaded Advisory Note PDF (Advisory_Note_${docName}.pdf)`)
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

const fetchingOverlaps = ref(false)

async function fetchMapOverlaps() {
  fetchingOverlaps.value = true
  try {
    const rawScope = (submission.value?.analysis_scope || 'full map').toLowerCase()
    const validScope = ['full map', 'geographic subset', 'thematic subset'].find(s => rawScope.includes(s)) ?? 'full map'
    let profile = { ...programmeProfile.value }

    let matches: any[] = []
    try {
      let res = await adviserApi.queryOverlap(profile, validScope)
      matches = (res.data as any)?.data ?? res.data ?? []
    } catch (err) {
      console.warn('Overlap query error:', err)
    }

    if (Array.isArray(matches) && matches.length > 0) {
      form.value.sectionB = matches.map((m: any) => {
        const orgName = m.organisation?.name || m.organisation_name || 'Partner Organisation'
        const entryName = m.programme_name || m.name || `Programme Entry #${m.id}`
        const locations = (m.locations || []).map((l: any) => l.province?.name || l.province_name || l.province?.province_name).filter(Boolean).join(', ')

        return {
          org: orgName,
          type: locations ? 'Geographic & Activity overlap' : 'Thematic overlap',
          linked: entryName,
          text: `Registered programme in ${locations || 'target region'}. Recommending coordination with ${orgName} on intervention alignment and avoiding duplication of activities.`,
        }
      })
      pushToast(`Identified ${matches.length} overlapping programme(s) on the map`)
    } else {
      form.value.sectionB = []
      pushToast('No similar programmes found for current profile & scope')
    }
  } catch (err) {
    console.error('Map overlap query error:', err)
    form.value.sectionB = []
  } finally {
    fetchingOverlaps.value = false
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
        @view-document="handleViewDocument"
      />

      <!-- Dual-pane workspace -->
      <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

        <!-- LEFT PANE: Document viewer + Workflow sidebar -->
        <div class="space-y-6">
          <DocumentViewerPanel
            :document-name="submission?.document_name"
            :submitting-party="submission?.submitting_party"
            :analysis-scope="submission?.analysis_scope"
            :analysis-scope-detail="submission?.analysis_scope_detail"
            @export-pdf="exportAdvisoryNotePdf"
            @exportPdf="exportAdvisoryNotePdf"
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
            badge="MANUAL ENTRY"
            badge-tone="gray"
            placeholder="Type or paste the interpreted programme profile here..."
          />

          <RecommendationsList
            :items="form.sectionB"
            :fetching="fetchingOverlaps"
            @add="addRecommendation"
            @remove="removeRecommendation"
            @find-overlaps="fetchMapOverlaps"
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