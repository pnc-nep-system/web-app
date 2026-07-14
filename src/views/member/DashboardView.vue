<template>
  <AppShell>
    <template #header>
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">Dashboard</span>

      <div class="ml-auto">
        <RouterLink
          to="/entries/new"
          class="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
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
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-800">Programme Entries</h2>
        <span class="text-xs text-gray-400">{{ entries.items.length }} total</span>
      </div>

      <!-- Loading state -->
      <div v-if="entries.loading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
      <div v-else class="divide-y divide-gray-100">
        <!-- Column headers -->
        <div class="hidden sm:grid grid-cols-12 gap-4 px-5 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
          <div class="col-span-6">Name</div>
          <div class="col-span-3">Years</div>
          <div class="col-span-3 text-right">Status</div>
        </div>
        <RouterLink
          v-for="(entry, index) in entries.entriesWithStatus"
          :key="entry.id ?? index"
          :to="`/entries/new?id=${entry.id}`"
          class="grid grid-cols-12 gap-4 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors group"
        >
          <div class="col-span-6 flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">
              {{ (entry.name || 'P').charAt(0).toUpperCase() }}
            </div>
            <span class="text-sm font-medium text-gray-800 truncate">{{ entry.name || 'Untitled' }}</span>
          </div>
          <div class="col-span-3 text-xs text-gray-400 hidden sm:block">
            {{ entry.startYear }}{{ entry.endYear ? ` – ${entry.endYear}` : '' }}{{ entry.isOngoing ? ' · Ongoing' : '' }}
          </div>
          <div class="col-span-2 text-right">
            <StatusBadge :label="entry.status" :variant="entry.statusVariant" />
          </div>
          <div class="col-span-1 flex justify-end">
            <svg class="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </RouterLink>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import KpiCard from '@/components/KpiCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useEntriesStore } from '@/stores/entries.store'

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
</script>

