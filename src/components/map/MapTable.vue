<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseBadge from '@/components/common/BaseBadge.vue'
import { useMapStore } from '@/stores/map'
import { useEntriesStore } from '@/stores/entries.store'

const router = useRouter()
const mapStore = useMapStore()
const entriesStore = useEntriesStore()

function formatAudiences(activities: any[]): string[] {
  if (!activities || !activities.length) return []
  const unique = new Set<string>()
  activities.forEach((a: any) => {
    if (a.inclusion_group && a.inclusion_type) {
      unique.add(`${a.inclusion_group} (${a.inclusion_type})`)
    } else if (a.inclusion_group) {
      unique.add(a.inclusion_group)
    }
  })
  return Array.from(unique).sort()
}

function getProvinces(entry: any): string[] {
  if (!entry.locations || !entry.locations.length) return []
  const unique = new Set<string>()
  entry.locations.forEach((l: any) => {
    if (l.province?.province_name) {
      unique.add(l.province.province_name)
    } else if (l.province_name) {
      unique.add(l.province_name)
    }
  })
  return Array.from(unique).sort()
}

function formatBudgetBand(b: any): string {
  if (!b) return '—'
  if (typeof b === 'string') return b
  if (typeof b === 'object' && b.label) return b.label
  return '—'
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200">
          <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-900 transition-colors" @click="mapStore.toggleSort('name')">
            Programme {{ mapStore.sortKey === 'name' ? (mapStore.sortDir === 'asc' ? '↑' : '↓') : '' }}
          </th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Primary activities</th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Audiences</th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Provinces</th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-900 transition-colors" @click="mapStore.toggleSort('budgetBand')">
            Budget band {{ mapStore.sortKey === 'budgetBand' ? (mapStore.sortDir === 'asc' ? '↑' : '↓') : '' }}
          </th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-for="e in mapStore.paged" :key="e.id" class="cursor-pointer transition-colors duration-200 hover:bg-teal-50/50 group" @click="router.push({ name: 'entry-detail', params: { id: String(e.id) } })">
          <td class="px-4 py-3 min-w-[200px]">
            <div class="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">{{ e.programme_name ?? e.name }}</div>
          </td>
          <td class="px-4 py-3">
            <BaseBadge :tone="entriesStore.statusOf(e) === 'verified' ? 'green' : 'amber'">
              {{ entriesStore.statusOf(e) === 'verified' ? 'Verified' : 'Unverified' }}
            </BaseBadge>
          </td>
          <td class="px-4 py-3 max-w-[200px]">
            <div class="flex flex-wrap gap-1">
              <template v-if="mapStore.primaryActivities(e).length > 0">
                <BaseBadge v-for="code in mapStore.primaryActivities(e).slice(0, 3)" :key="code" tone="teal">
                  {{ code }}
                </BaseBadge>
                <BaseBadge v-if="mapStore.primaryActivities(e).length > 3" tone="slate">
                  +{{ mapStore.primaryActivities(e).length - 3 }}
                </BaseBadge>
              </template>
              <span v-else class="text-xs text-slate-300">—</span>
            </div>
          </td>
          <td class="px-4 py-3 text-xs text-slate-600">
            {{ formatAudiences(e.activities).slice(0, 2).join(', ') || '—' }}
            <span v-if="formatAudiences(e.activities).length > 2" class="text-slate-400 font-medium ml-1"> +{{ formatAudiences(e.activities).length - 2 }}</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex flex-wrap gap-1">
              <span v-for="p in getProvinces(e).slice(0, 2)" :key="p" class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">{{ p }}</span>
              <span v-if="getProvinces(e).length > 2" class="px-1.5 py-0.5 rounded-md bg-slate-100/80 text-slate-500 text-xs font-semibold"> +{{ getProvinces(e).length - 2 }}</span>
              <span v-if="!getProvinces(e).length" class="text-xs text-slate-300">—</span>
            </div>
          </td>
          <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
            {{ formatBudgetBand(e.budget_band ?? e.budgetBand) }}
          </td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button 
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-all border border-teal-200/60 shadow-xs whitespace-nowrap cursor-pointer group-hover:bg-teal-100/80"
              @click.stop="router.push({ name: 'entry-detail', params: { id: String(e.id) } })"
            >
              <span>View</span>
              <span class="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
