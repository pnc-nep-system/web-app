<script setup lang="ts">
import { useMapStore } from '@/stores/map'

/**
 * Renders Previous / Next pagination controls for the map entry table.
 *
 * Fully responsive: stacks pagination text and control buttons cleanly on mobile screens.
 */
const mapStore = useMapStore()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-200/80 bg-slate-50/30">
    <span class="text-xs font-semibold text-slate-500">Page {{ mapStore.page }} of {{ mapStore.totalPages }}</span>
    <div class="flex gap-2 w-full sm:w-auto justify-end">
      <button
        :disabled="mapStore.page <= 1"
        class="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer transition-all duration-150 enabled:hover:border-teal-500 enabled:hover:text-teal-700 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
        @click="mapStore.goToPage(mapStore.page - 1)"
      >Previous</button>
      <button
        :disabled="mapStore.page >= mapStore.totalPages"
        class="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer transition-all duration-150 enabled:hover:border-teal-500 enabled:hover:text-teal-700 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
        @click="mapStore.goToPage(mapStore.page + 1)"
      >Next</button>
    </div>
  </div>
</template>
