<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import ProgrammeWizard from '@/components/programme/ProgrammeWizard.vue'

function clearDraft() {
  sessionStorage.removeItem('new_programme_entry_draft')
}
</script>

<template>
  <AppShell>
    <!-- Breadcrumb slot -->
    <template #header>
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">New programme entry</span>

      <!-- Top-right action button (hidden on mobile) -->
      <div class="ml-auto hidden sm:block">
        <router-link to="/entries/new"
          @click="clearDraft"
          class="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style="color: white !important;">
          <span class="text-lg leading-none text-white" style="color: white !important;">+</span>
          <span class="text-white" style="color: white !important;">New programme entry</span>
        </router-link>
      </div>
    </template>

    <ProgrammeWizard />
  </AppShell>
</template>
