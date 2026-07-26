<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <KpiCard
        icon="users"
        iconTone="teal"
        :value="loading ? '...' : stats?.total_organizations ?? 0"
        label="Member organisations"
      />
      <KpiCard
        icon="trend"
        iconTone="teal"
        :value="loading ? '...' : stats?.total_program_entries ?? 0"
        label="Programme entries mapped"
      />
      <KpiCard
        icon="alert"
        iconTone="amber"
        :value="loading ? '...' : stats?.unverified_program_entries ?? 0"
        label="Entries unverified (18mo+)"
      >
        <template #badge>
          <BaseBadge tone="amber">Review</BaseBadge>
        </template>
      </KpiCard>
      <KpiCard
        icon="bolt"
        iconTone="indigo"
        :value="loading ? '...' : stats?.coordinator_advisory_notes ?? 0"
        label="Advisory notes awaiting review"
      >
        <template #badge>
          <BaseBadge tone="green">{{ loading ? '...' : stats?.total_advisory_notes ?? 0 }} total</BaseBadge>
        </template>
      </KpiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import KpiCard from '@/components/KpiCard.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import { dashboardApi } from '@/api/dashboard.api'
import type { DashboardStats } from '@/types/dashboard'

const stats = ref<DashboardStats | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await dashboardApi.getStats()
    stats.value = res.data
  } catch (err) {
    console.error('Failed to fetch dashboard stats', err)
  } finally {
    loading.value = false
  }
})
</script>
