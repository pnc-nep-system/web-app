<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import MemberDashboard from '@/components/programme/MemberDashboard.vue'
import NewEntryButton from '@/components/programme/NewEntryButton.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">Dashboard</span>

      <div class="ml-auto">
        <NewEntryButton />
      </div>
    </template>

    <MemberDashboard />
  </AppShell>
</template>
