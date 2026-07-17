<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import MemberDashboard from '@/components/programme/MemberDashboard.vue'
import NewEntryButton from '@/components/programme/NewEntryButton.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex items-center min-w-0 truncate">
        <span class="text-gray-400">NEP</span>
        <span class="mx-1.5 text-gray-300">›</span>
        <span class="text-gray-700 font-medium truncate">Dashboard</span>
      </div>

      <div class="ml-auto shrink-0 pl-2">
        <NewEntryButton />
      </div>
    </template>

    <MemberDashboard />
  </AppShell>
</template>