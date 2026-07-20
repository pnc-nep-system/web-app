<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import DashboardTopBar from '@/components/dashboard/DashboardTopBar.vue'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader.vue'
import DashboardKpiGrid from '@/components/dashboard/DashboardKpiGrid.vue'
import CoverageListCard from '@/components/dashboard/CoverageListCard.vue'

const router = useRouter()

const activityCoverage = [
  { label: 'B1 Support to Learners', value: 10 },
  { label: 'B5 Direct Education Provision', value: 7 },
  { label: 'B4 Support to Education System and Governance', value: 4 },
  { label: 'B2 Support to Teachers', value: 3 },
  { label: 'B7 Child Protection and Reintegration', value: 2 },
  { label: 'B3 Support to Schools as Institutions', value: 2 },
  { label: 'B9 Emergency and Crisis Response', value: 2 },
  { label: 'B6 Community Health and Nutrition', value: 1 },
]

const provincialCoverage = [
  { label: 'Phnom Penh', value: 7 },
  { label: 'Kandal', value: 4 },
  { label: 'Siem Reap', value: 3 },
  { label: 'Battambang', value: 3 },
  { label: 'Ratanakiri', value: 3 },
  { label: 'Mondulkiri', value: 3 },
]
</script>

<template>
  <AppShell>
    <template #header>
      <DashboardTopBar />
    </template>

    <DashboardPageHeader />

    <DashboardKpiGrid />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <CoverageListCard 
        title="Activity coverage by category" 
        :items="activityCoverage" 
        show-bar
      />
      
      <CoverageListCard 
        title="Provincial coverage" 
        subtitle="Top provinces by entry count"
        :items="provincialCoverage" 
        action-text="Open full map →"
        @action="router.push('/admin/map')"
      />
    </div>
  </AppShell>
</template>

