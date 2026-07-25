<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import MemberDashboard from '@/components/programme/MemberDashboard.vue'
import NewEntryButton from '@/components/programme/NewEntryButton.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <HeaderBreadcrumb title="Dashboard" />
    </template>

    <MemberDashboard />
  </AppShell>
</template>