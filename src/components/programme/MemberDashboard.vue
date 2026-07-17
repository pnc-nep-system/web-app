<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import KpiCard from '@/components/KpiCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import DashboardGuidance from '@/components/programme/DashboardGuidance.vue'
import { useEntriesStore } from '@/stores/entries.store'
import { useProgrammeFormStore } from '@/stores/programmeForm'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const entries = useEntriesStore()
const formStore = useProgrammeFormStore()
const auth = useAuthStore()

const canSeeDraft = computed(() => !['nep_admin', 'nep_coordinator'].includes(auth.userRole))

function clearDraft() {
  sessionStorage.removeItem('new_programme_entry_draft')
  formStore.resetAll()
}

onMounted(() => {
  const requestedTab = route.query.tab === 'submitted' ? 'submitted' : 'draft'
  const tab = !canSeeDraft.value && requestedTab === 'draft' ? 'submitted' : requestedTab
  entries.switchTab(tab)
})
</script>

<template>
  <!-- KPI Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <KpiCard label="Total Entries" :value="entries.currentItems.length" icon="list" icon-tone="indigo" />
    <KpiCard label="Verified" :value="entries.verifiedCount" icon="check" icon-tone="green" />
    <KpiCard label="Unverified" :value="entries.unverifiedCount" icon="alert" icon-tone="amber" />
  </div>

  <!-- Tabs -->
  <div class="flex items-center justify-between mb-3">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">Your programme entries</h3>
      <span class="text-sm text-gray-500 block mt-0.5">Organisational account — visible to your organisation and NEP
        staff</span>
    </div>
    <div class="flex gap-1 bg-gray-100 p-1 rounded-lg">
      <button v-if="canSeeDraft"
        :class="['px-4 py-2 text-sm font-medium rounded-md transition-colors', entries.activeTab === 'draft' ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
        @click="entries.switchTab('draft')">
        Draft
      </button>
      <button
        :class="['px-4 py-2 text-sm font-medium rounded-md transition-colors', entries.activeTab === 'submitted' ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
        @click="entries.switchTab('submitted')">
        Submitted
      </button>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-800 capitalize">{{ entries.activeTab }} entries</h2>
      <span class="text-xs text-gray-400">{{ entries.currentPagination.total }} total</span>
    </div>

    <!-- Loading state -->
    <div v-if="entries.currentLoading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- Error state -->
    <div v-else-if="entries.currentError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="text-gray-400 mb-2">
          <BaseIcon name="alert" :size="32" />
        </div>
        <p class="text-sm text-red-500 mb-3">{{ entries.currentError }}</p>
        <button
          class="text-sm font-medium text-teal-700 hover:text-teal-600 bg-teal-50 px-3 py-1.5 rounded-md border border-teal-200 transition-colors"
          @click="entries.retry">
          Try again
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="entries.currentItems.length === 0" class="py-12">
      <EmptyState
        icon="file"
        :title="entries.activeTab === 'draft' ? 'No draft entries' : 'No submitted entries'"
        :message="entries.activeTab === 'draft' ? 'You haven\'t created any draft programme entries yet.' : 'No programme entries have been submitted yet.'"
      >
        <template #action>
          <RouterLink to="/entries/new"
            @click="clearDraft"
            class="inline-flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style="color: white !important;">
            <span class="text-white" style="color: white !important;">+ New programme entry</span>
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <!-- Entries list -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider">
            <th class="text-left px-5 py-3">Programme</th>
            <th class="text-left px-5 py-3">Status</th>
            <th class="text-left px-5 py-3">Coverage</th>
            <th class="text-left px-5 py-3">Primary activities</th>
            <th class="text-left px-5 py-3">Last updated</th>
            <th class="text-left px-5 py-3">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="(entry, index) in entries.entriesWithStatus" :key="entry.id ?? index"
            class="hover:bg-gray-50 transition-colors cursor-pointer"
            @click="router.push(`/entries/new?id=${entry.id}`)">
            <td class="px-5 py-3.5">
              <div class="text-sm font-medium text-gray-800">{{ entry.name || 'Untitled' }}</div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ entry.startYear }}–{{ entry.endYear || 'ongoing' }}
                <span v-if="entry.budgetBand"> · {{ entry.budgetBand }}</span>
              </div>
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-1.5">
                <StatusBadge v-if="entry.status === 'Verified'" label="Verified" variant="success" />
                <StatusBadge v-else :label="entry.unverifiedLabel" variant="warning" />
              </div>
            </td>
            <td class="px-5 py-3.5 text-xs text-gray-500 hidden sm:table-cell">
              <template v-if="entry.provinces && entry.provinces.length">
                {{ entry.provincesDisplay }}
                <span v-if="entry.hasMoreProvinces" class="text-gray-400"> +{{ entry.moreProvincesCount }}</span>
              </template>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="px-5 py-3.5 hidden md:table-cell">
              <div class="flex flex-wrap gap-1">
                <BaseBadge v-for="code in entry.primaryCodes" :key="code" tone="teal">{{ code }}</BaseBadge>
                <span v-if="!entry.primaryCodes.length" class="text-xs text-gray-300">—</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">
              {{ entry.relativeLastUpdated }}
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-1.5" @click.stop>
                <button v-if="entry.status === 'Unverified'"
                  class="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors whitespace-nowrap">
                  Still current
                </button>
                <button
                  class="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
                  @click="router.push(`/entries/new?id=${entry.id}`)">
                  Open →
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="entries.currentPagination.lastPage > 1"
        class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-500">
          Page {{ entries.currentPagination.currentPage }} of {{ entries.currentPagination.lastPage }}
        </span>
        <div class="flex gap-2">
          <button
            :disabled="entries.currentPagination.currentPage <= 1"
            :class="['px-3 py-1 text-xs font-medium rounded-md border transition-colors', entries.currentPagination.currentPage <= 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50']"
            @click="entries.goToPage(entries.currentPagination.currentPage - 1)">
            Previous
          </button>
          <button
            :disabled="entries.currentPagination.currentPage >= entries.currentPagination.lastPage"
            :class="['px-3 py-1 text-xs font-medium rounded-md border transition-colors', entries.currentPagination.currentPage >= entries.currentPagination.lastPage ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50']"
            @click="entries.goToPage(entries.currentPagination.currentPage + 1)">
            Next
          </button>
        </div>
      </div>
    </div>
  </div>

  <DashboardGuidance />
</template>
