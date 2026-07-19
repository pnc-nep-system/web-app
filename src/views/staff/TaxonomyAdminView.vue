<script setup lang="ts">
import { onMounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import TaxonomyAdminPanel from '@/components/programme/TaxonomyAdminPanel.vue'
import { useTaxonomyAdminStore } from '@/stores/taxonomyAdmin'

const store = useTaxonomyAdminStore()

onMounted(async () => {
  await store.taxonomy.fetchTaxonomy()
  const firstCategory = store.taxonomy.categories[0]
  if (firstCategory) {
    store.expandedCategories.add(firstCategory.code)
  }
})
</script>

<template>
  <AppShell>
    <!-- Breadcrumb -->
    <template #header>
      <span class="text-gray-400">Admin</span>
      <span class="mx-1.5 text-gray-300">›</span>
      <span class="text-gray-700 font-medium">Activity Taxonomy Directory</span>
    </template>

    <TaxonomyAdminPanel />
  </AppShell>
</template>
