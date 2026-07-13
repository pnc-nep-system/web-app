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
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import KpiCard from '@/components/KpiCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useEntriesStore } from '@/stores/entries.store'

const auth = useAuthStore()
const entries = useEntriesStore()

onMounted(() => {
  const orgId = auth.currentUser?.organisation_id
  if (orgId) {
    entries.fetchEntries(orgId as number)
  }
})

const orgName = computed(() => (auth.currentUser?.name as string) || 'Organisation')

const verifiedCount = computed(() => entries.items.filter(e => e.verifiedDate).length)
const unverifiedCount = computed(() => entries.items.length - verifiedCount.value)
const oldestReviewMonths = computed(() => 0) 
</script>
