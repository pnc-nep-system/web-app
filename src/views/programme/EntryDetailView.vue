<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import { mapApi } from '@/api/map.api'

const route = useRoute()
const entry = ref<any>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await mapApi.getEntry(Number(route.params.id))
    entry.value = res.data.data
  } catch {
    error.value = 'Failed to load entry.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex items-center min-w-0 truncate">
        <span class="text-gray-400">NEP</span>
        <span class="mx-1.5 text-gray-300">›</span>
        <span class="text-gray-700 font-medium truncate">Entry detail</span>
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <div v-else-if="error" class="text-sm text-red-500 text-center py-12">{{ error }}</div>

    <div v-else-if="entry" class="max-w-3xl">
      <h1 class="text-xl font-semibold text-gray-900 mb-1">{{ entry.programme_name || 'Untitled' }}</h1>
      <p class="text-sm text-gray-500 mb-6">
        {{ entry.organisation?.name }}
        <span v-if="entry.organisation"> · </span>
        <BaseBadge :tone="entry.is_unverified ? 'amber' : 'green'">
          {{ entry.is_unverified ? 'Unverified' : 'Verified' }}
        </BaseBadge>
      </p>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Budget</div>
          <div>{{ entry.budget_band?.label ?? '—' }}</div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Staff (FTE)</div>
          <div>{{ entry.fte_staff ?? '—' }}</div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Direct beneficiaries</div>
          <div>{{ entry.direct_beneficiaries?.toLocaleString() ?? '—' }}</div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Keywords</div>
          <div>{{ entry.keywords?.join(', ') || '—' }}</div>
        </div>
      </div>

      <div class="mt-6 bg-white rounded-lg border border-gray-200 p-4">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Activities</div>
        <div v-if="!entry.activities?.length" class="text-sm text-gray-400">None</div>
        <ul v-else class="text-sm space-y-1">
          <li v-for="a in entry.activities" :key="a.id">
            {{ a.activity_item?.code }} — {{ a.activity_item?.label || a.activity_item?.name }}
            <span v-if="a.is_primary" class="text-teal-700 font-medium">(primary)</span>
          </li>
        </ul>
      </div>

      <div class="mt-6 bg-white rounded-lg border border-gray-200 p-4">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Agreements</div>
        <div v-if="!entry.government_agreements?.length" class="text-sm text-gray-400">None</div>
        <div v-else v-for="ag in entry.government_agreements" :key="ag.id" class="text-sm mb-2">
          {{ ag.counterpart_agency }} · {{ ag.nature }} · {{ ag.status }}
        </div>
      </div>
    </div>
  </AppShell>
</template>
