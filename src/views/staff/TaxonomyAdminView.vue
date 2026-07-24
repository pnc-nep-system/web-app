<script setup lang="ts">
import { onMounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
import TaxonomyAdminPanel from '@/components/programme/TaxonomyAdminPanel.vue'
import { useTaxonomyStore } from '@/stores/taxonomy'

const taxonomyStore = useTaxonomyStore()

onMounted(() => {
  taxonomyStore.fetchTaxonomy()
})
</script>

<template>
  <AppShell>
    <!-- Breadcrumb -->
    <template #header>
      <HeaderBreadcrumb title="Taxonomy Data" />
    </template>

    <TaxonomyAdminPanel />
  </AppShell>
</template>
