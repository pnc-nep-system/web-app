<template>
  <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-[22px] font-bold text-[var(--ink-900)] tracking-[-0.02em] m-0"> Admin overview</h1>
      <p class="text-[13px] text-[var(--ink-400)] mt-1">Landscape of NGO education activity across 10 member organisations, current as of today.</p>
    </div>
    <BaseButton variant="primary" class="shadow-sm shrink-0">
      <BaseIcon name="bolt" :size="15" /> New advisory analysis
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'
</script>
