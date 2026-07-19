<script setup lang="ts">
import { useMapStore } from '@/stores/map'

/**
 * Renders Previous / Next pagination controls for the map entry table.
 *
 * Reads page and totalPages from useMapStore and calls goToPage on click.
 * Buttons are disabled at the boundaries.
 */
const mapStore = useMapStore()
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
    <span class="text-xs text-gray-500">Page {{ mapStore.page }} of {{ mapStore.totalPages }}</span>
    <div class="flex gap-2">
      <button
        :disabled="mapStore.page <= 1"
        class="px-3 py-1.5 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 cursor-pointer transition-colors duration-100 enabled:hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
        @click="mapStore.goToPage(mapStore.page - 1)"
      >Previous</button>
      <button
        :disabled="mapStore.page >= mapStore.totalPages"
        class="px-3 py-1.5 text-xs font-medium rounded border border-gray-200 bg-white text-gray-700 cursor-pointer transition-colors duration-100 enabled:hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
        @click="mapStore.goToPage(mapStore.page + 1)"
      >Next</button>
    </div>
  </div>
</template>
