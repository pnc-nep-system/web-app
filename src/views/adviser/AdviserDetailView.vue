<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { useAdviserStore } from '@/stores/adviser'
import { adviserApi } from '@/api/adviser.api'

// Import split components
import DocumentViewerPanel from '@/components/adviser/DocumentViewerPanel.vue'
import SectionEditor from '@/components/adviser/SectionEditor.vue'
import RecommendationsList from '@/components/adviser/RecommendationsList.vue'
import GapsList from '@/components/adviser/GapsList.vue'
import WorkflowCard from '@/components/adviser/WorkflowCard.vue'

const route = useRoute()
const router = useRouter()
const adviserStore = useAdviserStore()

const loading = ref(true)
const delivering = ref(false)
const submissionId = Number(route.params.id)
const currentStatus = ref('submitted_for_review')
const form = ref({
  sectionA: 'The submitted document describes a programme focused on education support, primarily serving lower- and upper-secondary learners in Pursat. The reasoning below is grounded only in what could be inferred from the document text and the taxonomy — it should be verified against the source before the note is finalised.',
  sectionB: [] as { org: string; type: string; linked: string; text: string }[],
  sectionC: [] as { text: string }[],
  sectionD: 'No data-quality flags were raised by this analysis.',
  assignee: 'Sophea Chandara'
})

const customToasts = ref<{id: number, text: string}[]>([])

onMounted(async () => {
  // Try store first (fast path – no extra request when navigating within the app)
  const cached = adviserStore.submissions.find(s => s.id === submissionId)
  if (cached) {
    currentStatus.value = cached.status
    if (cached.section_profile) form.value.sectionA = cached.section_profile
    if (cached.section_gaps) form.value.sectionC = [{ text: cached.section_gaps }]
    if (cached.section_coordinators_notes) form.value.sectionD = cached.section_coordinators_notes
    loading.value = false
    return
  }

  // Fallback: fetch from API (page refresh or direct URL)
  try {
    const res = await adviserApi.getById(submissionId)
    const data = (res.data as any)?.data ?? res.data
    if (data) {
      currentStatus.value = data.status
      if (data.section_profile) form.value.sectionA = data.section_profile
      if (data.section_gaps) form.value.sectionC = [{ text: data.section_gaps }]
      if (data.section_coordinators_notes) form.value.sectionD = data.section_coordinators_notes
    }
  } catch {
    // silently fall back to defaults
  } finally {
    loading.value = false
  }
})

function saveDraft() {
  const id = Date.now()
  customToasts.value.push({ id, text: 'Draft saved' })
  setTimeout(() => { customToasts.value = customToasts.value.filter(t => t.id !== id) }, 4000)
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

    const id = Date.now()
    customToasts.value.push({ id, text: 'Advisory note marked as delivered' })
    setTimeout(() => { customToasts.value = customToasts.value.filter(t => t.id !== id) }, 4000)
  } catch {
    const id = Date.now()
    customToasts.value.push({ id, text: 'Failed to update status — please try again' })
    setTimeout(() => { customToasts.value = customToasts.value.filter(t => t.id !== id) }, 4000)
  } finally {
    delivering.value = false
  }
}

function goBack() {
  router.push('/adviser')
}

function addRecommendation() {
  form.value.sectionB.push({
    org: '',
    type: 'Geographic overlap',
    linked: '—',
    text: ''
  })
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
      <span class="text-gray-400 text-sm">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <router-link to="/adviser" class="text-gray-500 hover:text-gray-700 transition text-sm">Draft advisory note</router-link>
    </template>

    <div v-if="loading" class="py-20 flex justify-center text-gray-400">
      <BaseIcon name="refresh" size="24" class="animate-spin" />
    </div>

    <div v-else class="max-w-[1400px] mx-auto pb-12">
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 py-6 border-b border-gray-100 mb-6">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Draft advisory note</h1>
            <span v-if="currentStatus === 'advice_delivered'" class="bg-[#DCFCE7] text-[#15803D] px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide">Advice delivered</span>
            <span v-else class="bg-[#FFF4ED] text-[#C2410C] px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide">Submitted for review</span>
          </div>
          <p class="mt-2 text-[13px] text-gray-500 flex items-center gap-2">
            <span>Source: <a href="#" class="text-[#0F5A4D] hover:underline underline-offset-2">education-inclusion-call.pdf</a></span>
            <span class="text-gray-300">•</span>
            <span>Submitted by <span class="font-medium text-gray-700">EU Delegation to Cambodia</span></span>
            <span class="text-gray-300">•</span>
            <span>Analysed against full map</span>
          </p>
        </div>
        
        <div class="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
          <button @click="goBack" class="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm">
            <BaseIcon name="arrowLeft" size="16" class="mr-1" />
            Back
          </button>
          
          <template v-if="currentStatus !== 'advice_delivered'">
            <button @click="saveDraft" class="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm">
              Save draft
            </button>
            <button
              @click="markDelivered"
              :disabled="delivering"
              class="px-4 py-2 bg-[#0F5A4D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0c4a3f] transition shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <BaseIcon v-if="delivering" name="refresh" size="14" class="animate-spin" />
              {{ delivering ? 'Saving…' : 'Mark advice delivered →' }}
            </button>
          </template>
        </div>
      </div>

      <!-- Main Dual Pane Workspace -->
      <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
        
        <!-- LEFT PANE: Document Viewer & Workflow Sidebar -->
        <div class="space-y-6">
          <DocumentViewerPanel 
            document-name="education-inclusion-call.pdf"
            document-size="1.2 MB"
            submitting-party="EU Delegation to Cambodia"
            analysis-scope="Full map"
            submitted-date="16 days ago"
            :assignee="form.assignee"
          />

          <WorkflowCard
            :current-status="currentStatus"
            :assignee="form.assignee"
            @update:assignee="form.assignee = $event"
          />
        </div>

        <!-- RIGHT PANE: Editing Form for Sections A-D -->
        <div class="space-y-6">
          
          <!-- Section A: Profile -->
          <SectionEditor
            title="A · Programme profile as interpreted"
            :model-value="form.sectionA"
            @update:model-value="form.sectionA = $event"
            badge="AI-GENERATED"
            badge-tone="indigo"
          />

          <!-- Section B: Recommendations -->
          <RecommendationsList
            :items="form.sectionB"
            @add="addRecommendation"
            @remove="removeRecommendation"
            @update:org="(idx, val) => { if (form.sectionB[idx]) form.sectionB[idx].org = val }"
            @update:type="(idx, val) => { if (form.sectionB[idx]) form.sectionB[idx].type = val }"
            @update:text="(idx, val) => { if (form.sectionB[idx]) form.sectionB[idx].text = val }"
          />

          <!-- Section C: Gaps in the map -->
          <GapsList
            :items="form.sectionC"
            @add="addGap"
            @remove="removeGap"
            @update:text="(idx, val) => { if (form.sectionC[idx]) form.sectionC[idx].text = val }"
          />

          <!-- Section D: Internal Coordinator Notes -->
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
    
    <!-- Custom Bottom-Right Stacked Toasts -->
    <div class="fixed bottom-6 right-8 flex flex-col gap-3 z-[200] pointer-events-none">
      <div v-for="t in customToasts" :key="t.id" class="px-5 py-4 bg-[#0F5A4D] text-white rounded-lg flex items-center gap-3.5 shadow-xl min-w-[340px] pointer-events-auto transition-transform">
        <BaseIcon name="check" size="16" class="text-white shrink-0" />
        <span class="font-medium text-[14px] leading-none">{{ t.text }}</span>
      </div>
    </div>
  </AppShell>
</template>