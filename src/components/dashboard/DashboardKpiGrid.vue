<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
    <KpiCard
      icon="users"
      iconTone="teal"
      value="10"
      label="Member organisations"
    />
    <KpiCard
      icon="trend"
      iconTone="teal"
      value="15"
      label="Programme entries mapped"
    />
    <KpiCard
      icon="alert"
      iconTone="amber"
      value="3"
      label="Entries unverified (18mo+)"
    >
      <template #badge>
        <BaseBadge tone="amber">Review</BaseBadge>
      </template>
    </KpiCard>
    <KpiCard
      icon="bolt"
      iconTone="indigo"
      value="3"
      label="Advisory notes awaiting review"
    >
      <template #badge>
        <BaseBadge tone="green">3 pending</BaseBadge>
      </template>
    </KpiCard>
  </div>
</template>

<script setup lang="ts">
import KpiCard from '@/components/KpiCard.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
</script>
