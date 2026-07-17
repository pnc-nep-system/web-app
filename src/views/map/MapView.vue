<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import FilterBar from '@/components/map/FilterBar.vue'
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

    <FilterBar />

    <div class="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center h-[600px] text-gray-400 text-sm">
      Map view — coming soon
    </div>
  </AppShell>
</template>
