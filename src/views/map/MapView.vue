<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import ExportButtons from '@/components/map/ExportButtons.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex w-full items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-sm min-w-0">
            <span class="text-gray-400">NEP</span>
            <span class="text-gray-300">></span>
            <span class="text-gray-700 font-medium truncate">Programme Map</span>
          </div>
        </div>

        <ExportButtons />
      </div>
    </template>

    <div class="grid gap-6">
      <section class="card card-pad">
        <h1 class="text-2xl font-semibold">Programme Map</h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-600">
          The export controls above will download the entries that match the active map filters.
          Add the map filters and results panels here when you are ready to complete the page.
        </p>
      </section>

      <section class="card card-pad border-dashed">
        <h2 class="text-base font-semibold">Next step</h2>
        <p class="mt-2 text-sm text-gray-600">
          Wire in the filter and results components under this shell when the map UI is ready.
        </p>
      </section>
    </div>
  </AppShell>
</template>
