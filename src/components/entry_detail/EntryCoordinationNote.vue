<script setup lang="ts">
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'

defineProps<{
  hasOverlaps: boolean
  overlapCount: number
}>()

defineEmits<{
  analyse: []
}>()
</script>

<template>
  <BaseCard class="mt-4 bg-teal-50 border-teal-100">
    <b class="text-sm">Coordination note</b>
    <p class="text-xs text-gray-600 mt-1.5">
      <template v-if="hasOverlaps">
        {{ overlapCount }} other {{ overlapCount === 1 ? 'entry shares' : 'entries share' }}
        both province and activity category. Run this entry through the Adviser to generate a coordination
        analysis.
      </template>
      <template v-else>No strong overlaps detected on province + category alone — the Adviser's full analysis
        considers more dimensions.</template>
    </p>
    <BaseButton variant="secondary" size="sm" class="mt-2" @click="$emit('analyse')">Analyse in the
      Adviser</BaseButton>
  </BaseCard>
</template>
