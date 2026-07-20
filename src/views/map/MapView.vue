<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FilterBar from '@/components/map/FilterBar.vue'
import { useMapFilterStore } from '@/stores/mapFilter'
import { mapApi } from '@/api/map.api'
import type { MapEntry } from '@/types/map'

const router = useRouter()
const mapFilter = useMapFilterStore()

const data = ref<MapEntry[]>([])
const loading = ref(false)
const error = ref('')
const total = ref(0)
const currentPage = ref(1)
const lastPage = ref(0)
const sortKey = ref<'name' | 'budgetBand'>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => ({ ...mapFilter.filters }),
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => fetchEntries(1), 300)
  },
  { deep: true },
)

const paged = computed(() => {
  const sorted = [...data.value]
  sorted.sort((a, b) => {
    let aVal: string | number = ''
    let bVal: string | number = ''
    if (sortKey.value === 'name') {
      aVal = (a.organisation?.name ?? a.programme_name ?? '').toLowerCase()
      bVal = (b.organisation?.name ?? b.programme_name ?? '').toLowerCase()
    } else {
      aVal = a.budget_band?.id ?? 0
      bVal = b.budget_band?.id ?? 0
    }
    if (aVal < bVal) return sortDir.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
  return sorted
})

async function fetchEntries(page = 1) {
  loading.value = true
  error.value = ''
  currentPage.value = page
  try {
    const params = { ...mapFilter.filters, page }
    const res = await mapApi.getEntries(params)
    data.value = res.data.data
    total.value = res.data.total
    lastPage.value = res.data.last_page
    currentPage.value = res.data.current_page
  } catch {
    error.value = 'Failed to load entries.'
    data.value = []
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  if (page < 1 || page > lastPage.value) return
  fetchEntries(page)
}

function retry() {
  fetchEntries(currentPage.value)
}

// Keep existing UI logic intact
function toggleSort(key: 'name' | 'budgetBand') {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function initials(name: string | null | undefined): string {
  if (!name) return '??'
  return name.slice(0, 2).toUpperCase()
}

function primaryCodes(entry: MapEntry): string[] {
  return (entry.activities || [])
    .filter((a: any) => a.is_primary)
    .map((a: any) => a.activity_item?.code)
    .filter((c: any): c is string => !!c)
}

function audienceLabels(entry: MapEntry): string[] {
  const labels = new Set<string>()
  for (const activity of entry.activities || []) {
    for (const el of activity.education_levels || []) {
      if (el.level_name) labels.add(el.level_name)
    }
  }
  return Array.from(labels)
}

function provinceList(entry: MapEntry): string {
  const names = (entry.locations || [])
    .map((l: any) => l.province?.province_name)
    .filter((n: any): n is string => !!n)
  if (names.length === 0) return '—'
  const unique = [...new Set(names)]
  if (unique.length <= 2) return unique.join(', ')
  return `${unique.slice(0, 2).join(', ')} +${unique.length - 2}`
}

onMounted(() => {
  fetchEntries(1)
})
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex items-center min-w-0 truncate">
        <span class="text-gray-400">NEP</span>
        <span class="mx-1.5 text-gray-300">›</span>
        <span class="text-gray-700 font-medium truncate">The Map</span>
      </div>
    </template>

    <div class="page-head">
      <div>
        <h1>The Map</h1>
        <p>Filter member programme entries across any combination of dimensions.</p>
      </div>
    </div>

    <FilterBar />

    <div class="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-800">Programme entries</h2>
        <span class="text-xs text-gray-400">{{ total }} total</span>
      </div>

      <LoadingSpinner v-if="loading" message="Loading entries…" />

      <EmptyState v-else-if="error" title="Something went wrong" :description="error">
        <button class="btn btn-secondary btn-sm mt-2" @click="retry">
          Try again
        </button>
      </EmptyState>

      <EmptyState v-else-if="paged.length === 0" />

      <template v-else>
        <div class="overflow-x-auto">
          <table class="tbl">
            <thead>
              <tr>
                <th class="sortable" @click="toggleSort('name')">
                  Organisation / programme
                  <span v-if="sortKey === 'name'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th>Status</th>
                <th>Primary activities</th>
                <th>Audiences</th>
                <th>Provinces</th>
                <th class="sortable" @click="toggleSort('budgetBand')">
                  Budget band
                  <span v-if="sortKey === 'budgetBand'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in paged" :key="e.id" class="hoverable" @click="router.push({ name: 'entry-detail', params: { id: e.id } })">
                <td class="org-cell">
                  <div class="org-logo">{{ initials(e.organisation?.name) }}</div>
                  <div>
                    <b>{{ e.organisation?.name }}</b>
                    <div class="text-[11.5px]" style="color:var(--ink-500);">{{ e.programme_name }}</div>
                  </div>
                </td>
                <td>
                  <BaseBadge :tone="e.is_unverified ? 'amber' : 'green'">
                    {{ e.is_unverified ? 'Unverified' : 'Verified' }}
                  </BaseBadge>
                </td>
                <td>
                  <BaseBadge v-for="code in primaryCodes(e)" :key="code" tone="teal" style="margin-right:4px;">
                    {{ code }}
                  </BaseBadge>
                </td>
                <td style="font-size:12px;color:var(--ink-600);">{{ audienceLabels(e).join(', ') || '—' }}</td>
                <td style="font-size:12px;">{{ provinceList(e) }}</td>
                <td style="font-size:12px;">{{ e.budget_band?.label ?? '—' }}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" @click.stop="router.push({ name: 'entry-detail', params: { id: e.id } })">
                    View →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="lastPage > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <span class="text-xs text-gray-500">Page {{ currentPage }} of {{ lastPage }}</span>
          <div class="flex gap-2">
            <button
              :disabled="currentPage <= 1"
              class="btn btn-secondary btn-sm"
              @click="goToPage(currentPage - 1)"
            >
              Previous
            </button>
            <button
              :disabled="currentPage >= lastPage"
              class="btn btn-secondary btn-sm"
              @click="goToPage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </div>
  </AppShell>
</template>
