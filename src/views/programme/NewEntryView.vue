<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import ProgrammeWizard from '@/components/programme/ProgrammeWizard.vue'
</script>

<template>
  <AppShell>
    <!-- Breadcrumb slot -->
    <template #header>
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium truncate">New programme entry</span>
    </template>

    <ProgrammeWizard />
  </AppShell>
</template>
