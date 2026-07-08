<template>
  <AppShell>
    <!-- Breadcrumb slot -->
    <template #header>
      <span class="text-gray-400">{{ breadcrumbRoot }}</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">Dashboard</span>

      <!-- Top-right New Entry button (members & coordinators) -->
      <div class="ml-auto">
        <RouterLink
          to="/entries/new"
          class="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span class="text-lg leading-none">+</span> New programme entry
        </RouterLink>
      </div>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { useAuth } from '@/composables/useAuth'

const { userRole } = useAuth()

const breadcrumbRoot = computed(() => {
  const role = userRole.value
  if (role === 'nep_admin') return 'NEP Admin'
  if (role === 'nep_coordinator') return 'NEP Coordinator'
  return 'NEP'
})
</script>
