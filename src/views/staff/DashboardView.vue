<script setup lang="ts">
import AppShell from '@/components/AppShell.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import KpiCard from '@/components/KpiCard.vue'
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex w-full items-center justify-between gap-4">
        <div class="flex items-center gap-1.5 text-sm min-w-0">
          <span class="text-gray-400">NEP</span>
          <span class="text-gray-300">›</span>
          <span class="text-gray-700 font-medium truncate">Overview</span>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Search box -->
          <div class="relative w-72 hidden md:block">
            <span class="absolute inset-y-0 left-3 flex items-center text-[var(--ink-400)]">
              <BaseIcon name="search" :size="15" />
            </span>
            <input
              type="text"
              placeholder="Search programmes, organisations..."
              class="w-full pl-9 pr-4 py-[7px] text-[13px] bg-white border border-[var(--line)] rounded-lg focus:outline-none focus:border-[var(--teal-600)] transition-colors"
            />
          </div>
          <!-- Bell icon -->
          <button class="icon-btn">
            <BaseIcon name="bell" :size="16" />
          </button>
        </div>
      </div>
    </template>

    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-[22px] font-bold text-[var(--ink-900)] tracking-[-0.02em] m-0">Coordination overview</h1>
        <p class="text-[13px] text-[var(--ink-400)] mt-1">Landscape of NGO education activity across 10 member organisations, current as of today.</p>
      </div>
      <BaseButton variant="primary" class="shadow-sm shrink-0">
        <BaseIcon name="bolt" :size="15" /> New advisory analysis
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
  </AppShell>
</template>
