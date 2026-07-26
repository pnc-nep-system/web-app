<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
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
const exportingPdf = ref(false)
// Support both /adviser/:id and /adviser/entry/:entryId routes
const submissionId = ref<number>(Number(route.params.id) || 0)
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
    const aiRes = await adviserApi.generateAdvisoryNote(submissionId.value, programmeProfile.value)
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

    const entryRes = await adviserApi.createProgrammeEntry(submissionId.value, payload)
    const newId = entryRes.data?.data?.id

    showDraftModal.value = false
    pushToast('AI programme draft created — redirecting to form')
    router.push(`/entries/new?id=${newId}&org_id=${selectedOrgId.value}`)
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

  // If loaded via /adviser/entry/:entryId, resolve the advisory note first
  if (!submissionId.value && route.params.entryId) {
    try {
      const res = await adviserApi.getByProgrammeEntry(Number(route.params.entryId))
      const note = (res.data as any)?.data ?? res.data
      if (note?.id) {
        submissionId.value = note.id
        // Fetch full detail so programme_entry.activities/locations are included
        const full = await adviserApi.getById(note.id)
        const fullData = (full.data as any)?.data ?? full.data
        applySubmission(fullData ?? note)
        loading.value = false
        return
      }
    } catch {
      // fall through to default empty state
    }
    loading.value = false
    return
  }

  try {
    const res = await adviserApi.getById(submissionId.value)
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

  // Populate section B from saved recommendations
  const recs = (data as any).recommendations
  if (Array.isArray(recs) && recs.length > 0) {
    form.value.sectionB = recs.map((r: any) => ({
      org: r.organisation_name || '',
      type: r.type || 'Geographic overlap',
      linked: r.programme_entry_id ? `Entry #${r.programme_entry_id}` : '—',
      text: r.relational || '',
    }))
  } else if (form.value.sectionB.length === 0) {
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

async function saveDraft() {
  try {
    await adviserApi.updateSections(submissionId.value, {
      section_profile: form.value.sectionA,
      section_gaps: form.value.sectionC.map(g => g.text).filter(Boolean).join('\n'),
      section_coordinators_notes: form.value.sectionD,
      recommendations: form.value.sectionB.map(r => ({
        organisation_name: r.org,
        type: r.type,
        relational: r.text,
        programme_entry_id: r.linked && r.linked !== '—' ? (Number(r.linked.replace(/\D/g, '')) || null) : null,
      })),
    })
    pushToast('Draft saved')
  } catch {
    pushToast('Failed to save draft')
  }
}

async function markDelivered() {
  if (!form.value.sectionA || !form.value.sectionA.trim()) {
    pushToast('Please complete Section A (Programme profile as interpreted) before marking advice as delivered.')
    return
  }

  if (delivering.value) return
  delivering.value = true
  try {
    // Save all sections first, then mark delivered
    await adviserApi.updateSections(submissionId.value, {
      section_profile: form.value.sectionA,
      section_gaps: form.value.sectionC.map(g => g.text).filter(Boolean).join('\n'),
      section_coordinators_notes: form.value.sectionD,
      recommendations: form.value.sectionB.map(r => ({
        organisation_name: r.org,
        type: r.type,
        relational: r.text,
        programme_entry_id: r.linked && r.linked !== '—' ? (Number(r.linked.replace(/\D/g, '')) || null) : null,
      })),
    })
    const res = await adviserApi.markDelivered(submissionId.value)
    const data = (res.data as any)?.data ?? res.data
    const newStatus = data?.status ?? 'advice_delivered'
    currentStatus.value = newStatus
    const existing = adviserStore.submissions.find(s => s.id === submissionId.value)
    if (existing) existing.status = newStatus
    pushToast('Advisory note saved and marked as delivered')
  } catch {
    pushToast('Failed to save — please try again')
  } finally {
    delivering.value = false
  }
}

async function exportAdvisoryNotePdf() {
  if (exportingPdf.value) return
  exportingPdf.value = true
  const docName = (submission.value?.document_name || 'Advisory_Note').replace(/[^a-zA-Z0-9_-]/g, '_')

  // Build a hidden render div
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;padding:40px;background:#fff;font-family:Arial,sans-serif;font-size:13px;color:#1e293b;line-height:1.6;'

  const title = submission.value?.document_name || 'Advisory Note'
  const party = submission.value?.submitting_party || 'Member Organisation'
  const scope = scopeDisplay.value

  let sectionsHtml = ''

  if (form.value.sectionA?.trim()) {
    sectionsHtml += `<div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:bold;color:#0F5A4D;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:8px">A · Programme profile as interpreted</div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;white-space:pre-wrap">${form.value.sectionA.trim()}</div>
    </div>`
  }

  if (form.value.sectionB?.length) {
    const recHtml = form.value.sectionB.map((r, i) => `
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:10px;margin-bottom:8px">
        <strong>${i + 1}. ${r.org}</strong> <span style="background:#e2e8f0;padding:1px 6px;border-radius:4px;font-size:11px">${r.type}</span><br/>
        <em style="color:#64748b;font-size:11px">Linked: ${r.linked}</em>
        <p style="margin:6px 0 0;font-size:12px">${r.text}</p>
      </div>`).join('')
    sectionsHtml += `<div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:bold;color:#0F5A4D;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:8px">B · Coordination recommendations</div>
      ${recHtml}
    </div>`
  }

  const validGaps = form.value.sectionC?.filter(g => g?.text?.trim())
  if (validGaps?.length) {
    sectionsHtml += `<div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:bold;color:#0F5A4D;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:8px">C · Gaps in the map</div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px">${validGaps.map(g => `<p style="margin:2px 0">• ${g.text.trim()}</p>`).join('')}</div>
    </div>`
  }

  container.innerHTML = `
    <h1 style="color:#0F5A4D;font-size:20px;margin:0 0 4px">Advisory Note</h1>
    <div style="color:#64748b;font-size:12px;border-bottom:2px solid #0F5A4D;padding-bottom:8px;margin-bottom:20px">
      <strong>Source:</strong> ${title} &nbsp;|&nbsp; <strong>Submitted by:</strong> ${party} &nbsp;|&nbsp; <strong>Scope:</strong> ${scope}
    </div>
    ${sectionsHtml || '<p style="color:#94a3b8;font-style:italic">No sections recorded.</p>'}
  `

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgW = pageW
    const imgH = (canvas.height * imgW) / canvas.width
    let y = 0
    let remaining = imgH
    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, -y, imgW, imgH)
      remaining -= pageH
      if (remaining > 0) { pdf.addPage(); y += pageH }
    }
    pdf.save(`Advisory_Note_${docName}.pdf`)
  } finally {
    document.body.removeChild(container)
    exportingPdf.value = false
  }
}

async function assignCoordinator(userId: number | null) {
  assigneeId.value = userId
  try {
    await adviserApi.updateAssignee(submissionId.value, userId)
    const existing = adviserStore.submissions.find(s => s.id === submissionId.value)
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

    const entry = submission.value?.programme_entry
    const categoryIds = [...new Set(
      (entry?.activities ?? []).map((a: any) => a.activityItem?.subcategory?.category_id).filter(Boolean)
    )]
    const itemIds = [...new Set(
      (entry?.activities ?? []).map((a: any) => a.activity_item_id).filter(Boolean)
    )]
    const provinceIds = [...new Set(
      (entry?.locations ?? []).map((l: any) => l.province_id).filter(Boolean)
    )]
    const districtIds = [...new Set(
      (entry?.locations ?? []).map((l: any) => l.district_id).filter(Boolean)
    )]

    const profile = {
      activities: { category_ids: categoryIds, item_ids: itemIds, education_level_ids: [] as number[], inclusion_groups: [] as string[] },
      geography: { province_ids: provinceIds, district_ids: districtIds },
      audiences: { inclusion_types: [] as string[] },
    }

    let matches: any[] = []
    try {
      let res = await adviserApi.queryOverlap(profile, validScope)
      matches = (res.data as any)?.data ?? res.data ?? []
      // Exclude the submission's own programme entry from results
      if (submission.value?.programme_entry_id) {
        matches = matches.filter((m: any) => m.id !== submission.value!.programme_entry_id)
      }
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
          type: 'Geographic & Activity overlap',
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
            :exporting-pdf="exportingPdf"
            @export-pdf="exportAdvisoryNotePdf"
          />
          <WorkflowCard
            :current-status="currentStatus"
            :assignee-id="assigneeId"
            :coordinators="coordinators"
            :delivered-at="submission?.delivered_at ?? null"
            :final-note-file-url="(submission as any)?.final_note_file_url ?? null"
            @update:assigneeId="assignCoordinator"
            @open-file="adviserApi.openFinalNoteFile(submissionId)"
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
