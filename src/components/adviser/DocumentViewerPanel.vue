<script setup lang="ts">
import BaseIcon from '@/components/common/BaseIcon.vue'

defineProps<{
  documentName?: string
  documentSize?: string
  submittingParty?: string
  analysisScope?: string
  submittedDate?: string
  assignee?: string
}>()
</script>

<template>
  <div class="space-y-6">
    <!-- Reasoning Card -->
    <div class="bg-gradient-to-br from-slate-50 to-white border border-slate-200/90 rounded-xl shadow-2xs p-5 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-24 h-24 bg-[#0F5A4D]/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
      <div class="flex items-center gap-2 mb-2.5">
        <div class="w-6 h-6 rounded-md bg-[#0F5A4D]/10 text-[#0F5A4D] flex items-center justify-center shrink-0">
          <BaseIcon name="sparkles" size="14" />
        </div>
        <h2 class="text-[13.5px] font-bold text-slate-900">Reasoning for AI recommendations</h2>
      </div>
      <p class="text-[12.5px] text-slate-600 leading-relaxed font-normal">
        Recommendations are grounded strictly in structured system map data — activity taxonomy tags, 
        geographic locations, and targeted inclusion groups. The exact phrasing has been formulated based on 
        NEP coordination historical notes.
      </p>
    </div>
  </div>
</template>