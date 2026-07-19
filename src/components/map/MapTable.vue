<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseBadge from '@/components/common/BaseBadge.vue'
import { useMapStore } from '@/stores/map'
import { useEntriesStore } from '@/stores/entries.store'

/**
 * Renders a sortable table of map entries.
 *
 * Reads paged data, sort state, and sorting/filtering helpers from
 * useMapStore. Status badges are sourced from useEntriesStore.statusOf.
 * Row click navigates to the entry edit route.
 */
const router = useRouter()
const mapStore = useMapStore()
const entriesStore = useEntriesStore()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap cursor-pointer select-none hover:text-gray-900" @click="mapStore.toggleSort('name')">
            Programme {{ mapStore.sortKey === 'name' ? (mapStore.sortDir === 'asc' ? '\u2191' : '\u2193') : '' }}
          </th>
          <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Status</th>
          <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Primary activities</th>
          <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Provinces</th>
          <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap cursor-pointer select-none hover:text-gray-900" @click="mapStore.toggleSort('budgetBand')">
            Budget band {{ mapStore.sortKey === 'budgetBand' ? (mapStore.sortDir === 'asc' ? '\u2191' : '\u2193') : '' }}
          </th>
          <th class="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in mapStore.paged" :key="e.id" class="cursor-pointer transition-colors duration-100 hover:bg-gray-50" @click="router.push('/entries/new?id=' + e.id)">
          <td class="px-3 py-2.5 border-b border-gray-100 min-w-[160px]">
            <div><b>{{ e.programme_name ?? e.name }}</b></div>
          </td>
          <td class="px-3 py-2.5 border-b border-gray-100">
            <BaseBadge :tone="entriesStore.statusOf(e) === 'verified' ? 'green' : 'amber'">
              {{ entriesStore.statusOf(e) === 'verified' ? 'Verified' : 'Unverified' }}
            </BaseBadge>
          </td>
          <td class="px-3 py-2.5 border-b border-gray-100">
            <BaseBadge v-for="code in mapStore.primaryActivities(e)" :key="code" tone="teal" class="mr-1">
              {{ code }}
            </BaseBadge>
          </td>
          <td class="px-3 py-2.5 border-b border-gray-100 text-xs">
            {{ (e.provinces ?? []).slice(0, 2).join(', ') }}
            <span v-if="(e.provinces ?? []).length > 2" class="text-gray-400"> +{{ e.provinces.length - 2 }}</span>
          </td>
          <td class="px-3 py-2.5 border-b border-gray-100 text-xs">{{ mapStore.formatBudget(e.budget_band ?? e.budgetBand) }}</td>
          <td class="px-3 py-2.5 border-b border-gray-100">
            <button class="btn btn-ghost btn-sm" @click.stop="router.push('/entries/new?id=' + e.id)">View →</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
