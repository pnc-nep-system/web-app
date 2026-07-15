<template>
  <AppShell>
    <template #header>
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">Dashboard</span>

      <div class="ml-auto">
        <RouterLink to="/entries/new"
          class="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <p class="text-white">+ New programme entry</p>
        </RouterLink>
      </div>
    </template>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <KpiCard label="Total Entries" :value="entries.items.length" icon="list" icon-tone="indigo" />
      <KpiCard label="Verified" :value="verifiedCount" icon="check" icon-tone="green" />
      <KpiCard label="Unverified" :value="unverifiedCount" icon="alert" icon-tone="amber" />
    </div>

    <!-- Programme Entries List -->
    <div class="mb-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Your programme entries</h3>
          <span class="text-sm text-gray-500 block mt-0.5">Organisational account — visible to your organisation and NEP
            staff</span>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-800">Programme Entries</h2>
        <span class="text-xs text-gray-400">{{ entries.items.length }} total</span>
      </div>

      <!-- Loading state -->
      <div v-if="entries.loading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Empty state -->
      <div v-else-if="entries.items.length === 0" class="py-12 text-center">
        <p class="text-sm text-gray-400">No programme entries yet.</p>
        <RouterLink to="/entries/new" class="text-sm font-medium text-teal-700 hover:text-teal-600 mt-1 inline-block">
          Create your first entry →
        </RouterLink>
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
                  <StatusBadge v-if="entries.statusOf(entry) === 'verified'" label="Verified" variant="success" />
                  <StatusBadge v-else :label="`Unverified — ${monthsSince(entry.lastUpdated)} months`"
                    variant="warning" />
                </div>
              </td>
              <td class="px-5 py-3.5 text-xs text-gray-500 hidden sm:table-cell">
                <template v-if="entry.provinces && entry.provinces.length">
                  {{ entry.provinces.slice(0, 2).join(', ') }}
                  <span v-if="entry.provinces.length > 2" class="text-gray-400"> +{{ entry.provinces.length - 2
                    }}</span>
                </template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-5 py-3.5 hidden md:table-cell">
                <div class="flex flex-wrap gap-1">
                  <BaseBadge v-for="code in primaryActivityCodes(entry)" :key="code" tone="teal">{{ code }}</BaseBadge>
                  <span v-if="!primaryActivityCodes(entry).length" class="text-xs text-gray-300">—</span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">
                {{ formatRelativeTime(entry.lastUpdated) || '—' }}
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-1.5" @click.stop>
                  <button v-if="entries.statusOf(entry) === 'unverified'"
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
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import KpiCard from '@/components/KpiCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useEntriesStore } from '@/stores/entries.store'
import { monthsSince, formatRelativeTime } from '@/utils/date'
import type { ProgrammeIdentity } from '@/types/programme'

const router = useRouter()
const auth = useAuthStore()
const entries = useEntriesStore()

onMounted(async () => {
  if (!auth.currentUser) {
    try {
      await auth.fetchCurrentUser()
    } catch (e) {
      console.error('Error fetching current user:', e)
    }
  }
  const orgId = auth.currentUser?.organisation_id
  if (orgId) {
    entries.fetchEntries(orgId as number)
  }
})

const orgName = computed(() => (auth.currentUser?.name as string) || 'Organisation')

const verifiedCount = computed(() => entries.items.filter(e => !e.isUnverified).length)
const unverifiedCount = computed(() => entries.items.filter(e => e.isUnverified).length)

function primaryActivityCodes(entry: ProgrammeIdentity): string[] {
  if (!entry.activities) return []
  return entry.activities.filter(a => a.primary).map(a => a.code)
}
</script>
