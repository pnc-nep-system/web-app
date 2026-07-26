<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import DashboardTopBar from '@/components/dashboard/DashboardTopBar.vue'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader.vue'
import DashboardKpiGrid from '@/components/dashboard/DashboardKpiGrid.vue'
import CoverageListCard from '@/components/dashboard/CoverageListCard.vue'
import DashboardRecentActivity from '@/components/dashboard/DashboardRecentActivity.vue'
import { dashboardApi } from '@/api/dashboard.api'

const router = useRouter()

const activityCoverage = ref<{ label: string; value: number }[]>([])
const activityLoading = ref(true)

const provincialCoverage = ref<{ label: string; value: number }[]>([])
const provincialLoading = ref(true)

onMounted(() => {
  dashboardApi.getCategoryCounts()
    .then(res => {
      activityCoverage.value = res.data.map(c => ({ label: c.label, value: c.programme_count }))
    })
    .catch(err => console.error('Failed to fetch category counts', err))
    .finally(() => { activityLoading.value = false })

  dashboardApi.getProvinceCounts()
    .then(res => {
      // Filter out provinces with 0 entries and limit to top 9 to match activity categories height perfectly
      provincialCoverage.value = res.data
        .filter(p => p.programme_count > 0)
        .slice(0, 9)
        .map(p => ({ label: p.province_name, value: p.programme_count }))
    })
    .catch(err => console.error('Failed to fetch province counts', err))
    .finally(() => { provincialLoading.value = false })
})
</script>

<template>
  <AppShell>
    <template #header>
      <DashboardTopBar />
    </template>

    <DashboardPageHeader />

    <DashboardKpiGrid />

    <!-- Coverage cards side by side -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <CoverageListCard
        title="Activity coverage by category"
        :items="activityCoverage"
        :loading="activityLoading"
        show-bar
      />

      <CoverageListCard
        title="Provincial coverage"
        subtitle="Top provinces by entry count"
        :items="provincialCoverage"
        :loading="provincialLoading"
        action-text="Open full map"
        @action="router.push('/map')"
      />
    </div>

    <DashboardRecentActivity class="mt-5" />
  </AppShell>
</template>
