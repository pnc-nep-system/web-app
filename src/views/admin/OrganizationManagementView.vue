<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import OrganisationManagementPanel from '@/components/organisation/OrganisationManagementPanel.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <span class="text-gray-400">Admin</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">Organisation Management</span>
    </template>

    <OrganisationManagementPanel />
  </AppShell>
</template>
