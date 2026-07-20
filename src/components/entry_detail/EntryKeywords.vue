<script setup lang="ts">
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'

defineProps<{
  keywords: string[]
}>()
</script>

<template>
  <BaseCard class="mt-4">
    <div class="section-title mt-0">
      <h3>Keywords</h3>
    </div>
    <BaseBadge v-for="k in keywords" :key="k" tone="amber" class="mr-1.5 mb-1.5">{{ k }}</BaseBadge>
    <p v-if="!keywords.length" class="text-xs text-gray-500">No keywords recorded.</p>
  </BaseCard>
</template>
