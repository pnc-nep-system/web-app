<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import MemberDashboard from '@/components/programme/MemberDashboard.vue'
import { useProgrammeFormStore } from '@/stores/programmeForm'

const store = useProgrammeFormStore()

function clearDraft() {
  sessionStorage.removeItem('new_programme_entry_draft')
  store.resetAll()
}
</script>

<template>
  <AppShell>
    <template #header>
      <span class="text-gray-400">NEP</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">Dashboard</span>

      <div class="ml-auto">
        <RouterLink to="/entries/new"
          @click="clearDraft"
          class="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style="color: white !important;">
          <span class="text-white" style="color: white !important;">+ New programme entry</span>
        </RouterLink>
      </div>
    </template>

    <MemberDashboard />
  </AppShell>
</template>
