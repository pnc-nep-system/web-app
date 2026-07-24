<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import ProgrammeWizard from '@/components/programme/ProgrammeWizard.vue'
</script>

<template>
  <AppShell>
    <!-- Breadcrumb slot -->
    <template #header>
      <HeaderBreadcrumb title="New Programme Entry" />
    </template>

    <ProgrammeWizard />
  </AppShell>
</template>
