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
      <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span>NEP Portal</span>
        <span>/</span>
        <span class="text-slate-800 font-bold">Activity Taxonomy Directory</span>
      </div>
    </template>

    <TaxonomyAdminPanel />
  </AppShell>
</template>
