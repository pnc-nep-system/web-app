<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import ExportButtons from '@/components/map/ExportButtons.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <AppShell>
    <template #header>
      <span class="text-gray-400">{{ auth.userRole === 'nep_admin' ? 'Admin' : 'Coordinator' }}</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium truncate">Programme Map</span>

      <div class="ml-auto shrink-0 pl-2">
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
