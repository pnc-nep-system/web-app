<script setup lang="ts">
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

defineProps<{
  provinces: string[]
  otherCountries: string
}>()
</script>

<template>
  <BaseCard>
    <div class="section-title mt-0">
      <h3>Geographic coverage</h3>
    </div>
    <div class="h-[140px] rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center text-teal-700 mb-3">
      <BaseIcon name="globe" :size="32" />
    </div>
    <BaseBadge v-for="p in provinces" :key="p" tone="gray" class="mr-1.5 mb-1.5">{{ p }}</BaseBadge>
    <p v-if="otherCountries" class="text-xs text-gray-500 mt-2">Also operates in:
      {{ otherCountries }}</p>
  </BaseCard>
</template>
