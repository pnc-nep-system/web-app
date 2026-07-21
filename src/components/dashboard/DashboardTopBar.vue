<template>
  <HeaderBreadcrumb title="Overview">
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
  </HeaderBreadcrumb>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'
import HeaderBreadcrumb from '@/components/common/HeaderBreadcrumb.vue'
</script>
