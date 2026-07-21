<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useAdviserStore } from '@/stores/adviser'
import { adviserApi } from '@/api/adviser.api'
import type { Submission, SubmissionStatus } from '@/types/adviser'

const router = useRouter()
const adviserStore = useAdviserStore()

// ── Coordinator lookup map ──────────────────────────────────────────────────
const coordinatorMap = ref<Record<number, string>>({})

async function loadCoordinators() {
  try {
    const res = await adviserApi.getCoordinators()
    const body = res.data as any
    const raw = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : [])
    // Only include users with nep_coordinator role
    const list = raw.filter((u: any) => u.role === 'nep_coordinator')
    const map: Record<number, string> = {}
    list.forEach((u: any) => { map[u.id] = u.name ?? u.email ?? `User ${u.id}` })
    coordinatorMap.value = map
  } catch {
    coordinatorMap.value = {}
  }
}

function coordinatorLabel(id: number | null): string {
  if (!id) return 'Unassigned'
  return coordinatorMap.value[id] ?? `User #${id}`
}

onMounted(() => {
  // Always fetch fresh data so status changes are reflected after returning from detail view
  adviserStore.fetchSubmissions()
  loadCoordinators()
})

// ── Tabs ──────────────────────────────────────────────────────────────────────
const activeTab = computed({
  get: () => _activeTab.value,
  set: (v) => { _activeTab.value = v },
})
const _activeTab = ref<'all' | 'submitted_for_review' | 'advice_delivered'>('submitted_for_review')

const filteredSubmissions = computed<Submission[]>(() => {
  const list = adviserStore.submissions
  if (_activeTab.value === 'all') return list
  if (_activeTab.value === 'submitted_for_review') {
    // Everything that is NOT advice_delivered is considered "Submitted for review"
    return list.filter((s) => s.status !== 'advice_delivered')
  }
  return list.filter((s) => s.status === _activeTab.value)
})

const countAll = computed(() => adviserStore.submissions.length)
const countReview = computed(() => adviserStore.submissions.filter((s) => s.status !== 'advice_delivered').length)
const countDelivered = computed(() => adviserStore.submissions.filter((s) => s.status === 'advice_delivered').length)

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusLabel(status: SubmissionStatus): string {
  if (status === 'advice_delivered') return 'Advice delivered'
  // 'pending' and 'submitted_for_review' both show as "Submitted for review"
  return 'Submitted for review'
}

function statusClass(status: SubmissionStatus): string {
  if (status === 'advice_delivered') return 'bg-[#DCFCE7] text-[#15803D]'
  // Everything else gets the orange "in review" style
  return 'bg-[#FFEDD5] text-[#C2410C]'
}

function formatScope(s: Submission): string {
  if (!s.analysis_scope_detail) return ucFirst(s.analysis_scope)
  return `${ucFirst(s.analysis_scope)}: ${s.analysis_scope_detail}`
}

function ucFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const months = Math.floor(days / 30)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  return `${months} month${months !== 1 ? 's' : ''} ago`
}

function openSubmission(id: number) {
  router.push(`/adviser/${id}`)
}
</script>

<template>
  <AppShell>
    <template #header>
      <span class="text-gray-400 text-[13px]">NEP</span>
      <span class="mx-2 text-gray-300 text-[13px]">&gt;</span>
      <span class="text-gray-700 font-semibold text-[13px]">The Adviser</span>
    </template>

    <!-- Page heading + CTA -->
    <div class="flex items-start justify-between mb-8 gap-4 mt-4">
      <div>
        <h1 class="text-[28px] font-bold text-gray-900 tracking-tight">The Adviser</h1>
        <p class="mt-1 text-[14px] text-gray-500">
          Analyse any submitted document against the map and generate a draft coordination advisory note.
        </p>
      </div>
      <router-link
        to="/adviser/new"
        class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] !text-white text-[13px] font-semibold rounded-lg hover:bg-[#0C4A3F] transition-colors shadow-sm"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Submit document for analysis
      </router-link>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 mb-6">
      <button
        v-for="tab in [
          { key: 'all', label: 'All', count: countAll },
          { key: 'submitted_for_review', label: 'Submitted for review', count: countReview },
          { key: 'advice_delivered', label: 'Advice delivered', count: countDelivered },
        ]"
        :key="tab.key"
        type="button"
        @click="_activeTab = tab.key as any"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
        :class="_activeTab === tab.key
          ? 'bg-[#0F5A4D]/10 text-[#0F5A4D] font-semibold'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'"
      >
        {{ tab.label }}
        <span
          class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold"
          :class="_activeTab === tab.key ? 'bg-[#0F5A4D] text-white' : 'bg-gray-100 text-gray-500'"
        >{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="adviserStore.loading" class="py-20 flex items-center justify-center text-gray-400 gap-3">
      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <span class="text-[14px]">Loading submissions…</span>
    </div>

    <!-- Error state -->
    <div v-else-if="adviserStore.error" class="py-12 text-center text-red-500 text-sm">
      {{ adviserStore.error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredSubmissions.length === 0" class="py-24 flex flex-col items-center justify-center text-center">
      <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
        </svg>
      </div>
      <p class="text-[14px] font-semibold text-gray-600">No submissions found</p>
      <p class="text-[13px] text-gray-400 mt-1">Submissions will appear here once documents are submitted.</p>
    </div>

    <!-- Card list -->
    <div v-else class="space-y-3">
      <!-- Column headers -->
      <div class="grid grid-cols-[1fr_1fr_1fr_140px_120px_100px_80px] gap-4 px-5 pb-2">
        <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Submitting party</span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Document</span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Analysis scope</span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Assigned to</span>
        <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Submitted</span>
        <span></span>
      </div>

      <!-- Row cards -->
      <div
        v-for="sub in filteredSubmissions"
        :key="sub.id"
        @click="openSubmission(sub.id)"
        class="group grid grid-cols-[1fr_1fr_1fr_140px_120px_100px_80px] gap-4 items-center px-5 py-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-[#0F5A4D]/20 transition-all cursor-pointer relative overflow-hidden"
      >
        <!-- Left accent border on hover -->
        <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0F5A4D] opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl"></div>

        <!-- Submitting party -->
        <div class="min-w-0">
          <p class="text-[13px] font-bold text-gray-900 truncate">{{ sub.submitting_party }}</p>
        </div>

        <!-- Document -->
        <div class="min-w-0 flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
            </svg>
          </div>
          <span class="text-[13px] text-gray-500 truncate">{{ sub.document_name }}</span>
        </div>

        <!-- Analysis scope -->
        <div class="min-w-0">
          <span class="text-[13px] text-gray-700 truncate block">{{ formatScope(sub) }}</span>
        </div>

        <!-- Status badge -->
        <div>
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
            :class="statusClass(sub.status)"
          >
            <span class="w-1.5 h-1.5 rounded-full shrink-0"
              :class="sub.status === 'advice_delivered' ? 'bg-[#15803D]' : 'bg-[#C2410C]'"
            ></span>
            {{ statusLabel(sub.status) }}
          </span>
        </div>

        <!-- Assigned to -->
        <div class="min-w-0">
          <span
            class="text-[13px] truncate block"
            :class="coordinatorLabel(sub.assign_to_staff_user_id) === 'Unassigned' ? 'text-gray-400 italic' : 'text-gray-700'"
          >
            {{ coordinatorLabel(sub.assign_to_staff_user_id) }}
          </span>
        </div>

        <!-- Submitted time -->
        <div>
          <span class="text-[13px] text-gray-400 whitespace-nowrap">{{ timeAgo(sub.submitted_at) }}</span>
        </div>

        <!-- Action -->
        <div class="flex justify-end">
          <span
            class="inline-flex items-center gap-1 text-[13px] font-semibold transition-colors"
            :class="sub.status === 'advice_delivered' ? 'text-[#15803D] group-hover:text-[#0f5a4d]' : 'text-gray-400 group-hover:text-[#0F5A4D]'"
          >
            {{ sub.status === 'advice_delivered' ? 'View' : 'Open' }}
            <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  </AppShell>
</template>

