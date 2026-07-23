<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import AdviserSubmissionTable from '@/components/adviser/AdviserSubmissionTable.vue'
import { useAdviserStore } from '@/stores/adviser'

const router = useRouter()
const adviserStore = useAdviserStore()

onMounted(() => {
  adviserStore.fetchSubmissions()
  adviserStore.loadCoordinators() // ← Load coordinator names for display
})

// ── Tabs ──────────────────────────────────────────────────────────────────────
const _activeTab = ref<'all' | 'submitted_for_review' | 'advice_delivered'>('submitted_for_review')

const filteredSubmissions = computed(() => {
  const list = adviserStore.submissions
  if (_activeTab.value === 'all') return list
  if (_activeTab.value === 'submitted_for_review') return list.filter(s => s.status !== 'advice_delivered')
  return list.filter(s => s.status === _activeTab.value)
})

const countAll = computed(() => adviserStore.submissions.length)
const countReview = computed(() => adviserStore.submissions.filter(s => s.status !== 'advice_delivered').length)
const countDelivered = computed(() => adviserStore.submissions.filter(s => s.status === 'advice_delivered').length)

// ── Navigation ────────────────────────────────────────────────────────────────
function openSubmission(id: number) {
  router.push(`/adviser/${id}`)
}
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="The Adviser" />
    </template>

    <!-- Page heading + CTA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 mt-4">
      <div>
        <h1 class="text-[24px] sm:text-[28px] font-bold text-gray-900 tracking-tight">The Adviser</h1>
        <p class="mt-1 text-xs sm:text-[14px] text-gray-500">
          Analyse any submitted document against the map and generate a draft coordination advisory note.
        </p>
      </div>
      <router-link
        to="/adviser/new"
        class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F5A4D] !text-white text-[13px] font-semibold rounded-lg hover:bg-[#0C4A3F] transition-colors shadow-sm self-start sm:self-auto"
      >
        <BaseIcon name="plus" size="16" />
        Submit document for analysis
      </router-link>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-1 mb-6 flex-wrap">
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

    <!-- Loading -->
    <LoadingSpinner v-if="adviserStore.loading" message="Loading submissions…" />

    <!-- Error -->
    <p v-else-if="adviserStore.error" class="py-12 text-center text-red-500 text-sm">
      {{ adviserStore.error }}
    </p>

    <!-- Empty -->
    <EmptyState
      v-else-if="filteredSubmissions.length === 0"
      title="No submissions found"
      description="Submissions will appear here once documents are submitted."
    />

    <!-- Table -->
    <AdviserSubmissionTable
      v-else
      :submissions="filteredSubmissions"
      :coordinator-map="adviserStore.coordinatorMap"
      @open="openSubmission"
    />
  </AppShell>
</template>