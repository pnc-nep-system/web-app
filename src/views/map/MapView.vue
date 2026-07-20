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

    <div class="mb-6">
      <div>
        <h1 class="text-[22px] font-bold text-[var(--ink-900)] tracking-[-0.02em] m-0">The Map</h1>
        <p class="text-[13px] text-[var(--ink-400)] mt-1">Filter member programme entries across any combination of dimensions.</p>
      </div>
    </div>

    <FilterBar />

    <div class="bg-white border border-[var(--line)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden mt-6">
      <div class="px-6 py-5 border-b border-[var(--line-soft)] flex items-center justify-between bg-white">
        <div>
          <h2 class="text-[15px] font-bold text-[var(--ink-900)] mb-1">Programme entries</h2>
          <p class="text-[12.5px] text-[var(--ink-500)]">{{ total }} total</p>
        </div>
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
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-[var(--line)] bg-[var(--bg)]">
                <th class="cursor-pointer text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-4 py-3.5 hover:bg-[var(--line-soft)] transition-colors whitespace-nowrap" @click="toggleSort('name')">
                  Organisation / programme
                  <span v-if="sortKey === 'name'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">Status</th>
                <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">Primary activities</th>
                <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">Audiences</th>
                <th class="text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">Provinces</th>
                <th class="cursor-pointer text-[11px] font-bold text-[var(--ink-500)] uppercase tracking-wider px-4 py-3.5 hover:bg-[var(--line-soft)] transition-colors whitespace-nowrap" @click="toggleSort('budgetBand')">
                  Budget band
                  <span v-if="sortKey === 'budgetBand'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th class="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--line-soft)]">
              <tr v-for="e in paged" :key="e.id" class="hover:bg-[var(--bg)] transition-colors cursor-pointer group" @click="router.push({ name: 'entry-detail', params: { id: e.id } })">
                <td class="px-4 py-3.5 align-middle">
                  <div class="flex items-center gap-3">
                    <div class="w-[34px] h-[34px] rounded-[9px] text-[11px] bg-gradient-to-br from-[var(--teal-700)] to-[var(--teal-900)] flex items-center justify-center text-white font-bold tracking-wide shrink-0 shadow-[0_2px_6px_rgba(10,61,57,0.18)]">{{ initials(e.organisation?.name) }}</div>
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[13.5px] font-semibold text-[var(--ink-900)] group-hover:text-[var(--teal-700)] transition-colors">{{ e.organisation?.name }}</span>
                      <span class="text-xs text-[var(--ink-400)]">{{ e.programme_name }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3.5 align-middle">
                  <BaseBadge :tone="e.is_unverified ? 'amber' : 'green'">
                    {{ e.is_unverified ? 'Unverified' : 'Verified' }}
                  </BaseBadge>
                </td>
                <td class="px-4 py-3.5 align-middle">
                  <div class="flex flex-wrap gap-1">
                    <BaseBadge v-for="code in primaryCodes(e)" :key="code" tone="teal">
                      {{ code }}
                    </BaseBadge>
                  </div>
                </td>
                <td class="px-4 py-3.5 align-middle text-[12.5px] text-[var(--ink-600)]">{{ audienceLabels(e).join(', ') || '—' }}</td>
                <td class="px-4 py-3.5 align-middle text-[12.5px] text-[var(--ink-600)]">{{ provinceList(e) }}</td>
                <td class="px-4 py-3.5 align-middle text-[12.5px] text-[var(--ink-600)]">{{ e.budget_band?.label ?? '—' }}</td>
                <td class="px-4 py-3.5 align-middle text-right">
                  <button class="btn btn-ghost btn-sm" @click.stop="router.push({ name: 'entry-detail', params: { id: e.id } })">
                    View →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="lastPage > 1" class="flex items-center justify-between px-6 py-4 border-t border-[var(--line-soft)] bg-[var(--bg)]">
          <span class="text-[12.5px] font-medium text-[var(--ink-500)]">
            Page <b class="text-[var(--ink-900)]">{{ currentPage }}</b> of <b class="text-[var(--ink-900)]">{{ lastPage }}</b>
          </span>
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
