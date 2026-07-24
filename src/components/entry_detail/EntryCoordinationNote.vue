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
  <BaseCard class="mt-6 bg-gradient-to-br from-indigo-50/80 to-purple-50/40 border-indigo-100 shadow-sm relative overflow-hidden group">
    <div class="absolute -right-8 -top-8 w-32 h-32 bg-indigo-200/30 rounded-full blur-2xl group-hover:bg-indigo-300/40 transition-colors pointer-events-none"></div>
    
    <div class="flex items-center gap-2 mb-2 relative z-10">
      <div class="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm">
        <BaseIcon name="eye" :size="14" />
      </div>
      <h3 class="text-slate-800 font-bold">Coordination note</h3>
    </div>
    
    <div class="relative z-10">
      <p class="text-[13px] text-slate-600 leading-relaxed font-medium">
        <template v-if="hasOverlaps">
          <span class="text-indigo-700 font-bold">{{ overlapCount }} other {{ overlapCount === 1 ? 'entry shares' : 'entries share' }}</span>
          both province and activity category. Run this entry through the Adviser to generate a full coordination analysis.
        </template>
        <template v-else>No strong overlaps detected on province & category alone — the Adviser's full analysis
          considers more dimensions.</template>
      </p>
      
      <div class="mt-4 flex">
        <BaseButton variant="primary" size="sm" class="shadow-sm hover:shadow-md transition-shadow" @click="$emit('analyse')">
          Analyse in the Adviser
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>
