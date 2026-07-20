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
  adviserStore.fetchSubmissions()
  loadCoordinators()
})

// ── Tabs ──────────────────────────────────────────────────────────────────────
const activeTab = computed({
  get: () => _activeTab.value,
  set: (v) => { _activeTab.value = v },
})
const _activeTab = ref<'all' | 'submitted_for_review' | 'advice_delivered'>('all')

const filteredSubmissions = computed<Submission[]>(() => {
  const list = adviserStore.submissions
  if (_activeTab.value === 'all') return list
  return list.filter((s) => s.status === _activeTab.value)
})

const countAll = computed(() => adviserStore.submissions.length)
const countReview = computed(() => adviserStore.submissions.filter((s) => s.status === 'submitted_for_review').length)
const countDelivered = computed(() => adviserStore.submissions.filter((s) => s.status === 'advice_delivered').length)

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusLabel(status: SubmissionStatus): string {
  if (status === 'submitted_for_review') return 'Submitted for review'
  if (status === 'advice_delivered') return 'Advice delivered'
  return 'Pending'
}

function statusClass(status: SubmissionStatus): string {
  if (status === 'submitted_for_review') return 'bg-[#FFEDD5] text-[#C2410C]' // light orange bg, orange/brown text
  if (status === 'advice_delivered') return 'bg-[#DCFCE7] text-[#15803D]' // light green bg, green text
  return 'bg-gray-100 text-gray-500'
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
        class="shrink-0 inline-flex items-center px-4 py-2 bg-[#0F5A4D] !text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#0C4A3F] transition-colors shadow-sm"
      >
        + Submit document for analysis
      </router-link>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-8 border-b border-gray-100 mb-6 px-1">
      <button
        v-for="tab in [
          { key: 'all', label: 'All', count: countAll },
          { key: 'submitted_for_review', label: 'Submitted for review', count: countReview },
          { key: 'advice_delivered', label: 'Advice delivered', count: countDelivered },
        ]"
        :key="tab.key"
        type="button"
        @click="_activeTab = tab.key as any"
        class="pb-3 text-[14px] font-medium border-b-[3px] transition -mb-[2px] px-1"
        :class="_activeTab === tab.key
          ? 'border-[#125B4D] text-[#125B4D]'
          : 'border-transparent text-gray-500 hover:text-gray-900'"
      >
        {{ tab.label }} ({{ tab.count }})
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="adviserStore.loading" class="py-20 flex items-center justify-center text-gray-400 gap-3">
      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Loading submissions…
    </div>

    <!-- Error state -->
    <div v-else-if="adviserStore.error" class="py-12 text-center text-red-500 text-sm">
      {{ adviserStore.error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredSubmissions.length === 0" class="py-20 text-center text-gray-400 text-sm">
      No submissions found.
    </div>

    <!-- Table -->
    <div v-else class="bg-white border border-gray-100 rounded-lg overflow-hidden">
      <table class="w-full text-[13px]">
        <thead>
          <tr class="border-b border-gray-100 bg-white text-[11px] uppercase tracking-wide text-gray-400 font-bold">
            <th class="text-left px-5 py-4 w-[22%]">Submitting party</th>
            <th class="text-left px-5 py-4 w-[22%]">Document</th>
            <th class="text-left px-5 py-4 w-[18%]">Analysis scope</th>
            <th class="text-left px-5 py-4 w-[12%]">Status</th>
            <th class="text-left px-5 py-4 w-[12%]">Assigned to</th>
            <th class="text-left px-5 py-4 w-[14%]">Submitted</th>
            <th class="px-5 py-4"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="sub in filteredSubmissions"
            :key="sub.id"
            class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
          >
            <td class="px-5 py-4 font-bold text-gray-900 align-middle">
              {{ sub.submitting_party }}
            </td>
            <td class="px-5 py-4 text-gray-500 truncate max-w-[200px] align-middle">
              {{ sub.document_name }}
            </td>
            <td class="px-5 py-4 text-gray-700 align-middle">
              {{ formatScope(sub) }}
            </td>
            <td class="px-5 py-4 align-middle">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
                :class="statusClass(sub.status)"
              >
                {{ statusLabel(sub.status) }}
              </span>
            </td>
            <td class="px-5 py-4 text-gray-700 align-middle whitespace-pre-line leading-snug">
              {{ coordinatorLabel(sub.assign_to_staff_user_id) }}
            </td>
            <td class="px-5 py-4 text-gray-700 whitespace-nowrap align-middle">
              {{ timeAgo(sub.submitted_at) }}
            </td>
            <td class="px-5 py-4 text-right align-middle">
              <button
                type="button"
                @click="openSubmission(sub.id)"
                class="text-gray-700 hover:text-gray-900 font-medium whitespace-nowrap transition-colors"
              >
                {{ sub.status === 'advice_delivered' ? 'View →' : 'Open →' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppShell>
</template>
