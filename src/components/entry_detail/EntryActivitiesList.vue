<script setup lang="ts">
import { EDUCATION_LEVELS, INCLUSION_GROUPS } from '@/utils/format'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import type { ActivityRow } from '@/types/entryDetail'

defineProps<{
  activityRows: ActivityRow[]
}>()
</script>

<template>
  <BaseCard class="mt-6 bg-white border-slate-100 shadow-sm relative overflow-hidden">
    <div class="section-title mt-0">
      <h3 class="text-slate-800 font-bold">Activities</h3>
    </div>
    
    <div class="space-y-3" v-if="activityRows.length">
      <div v-for="row in activityRows" :key="row.code" class="bg-slate-50/50 border border-slate-100 hover:border-teal-100 hover:bg-teal-50/20 transition-all rounded-xl p-4 group">
        <div class="flex items-center gap-3 flex-wrap mb-2">
          <span class="mono text-xs font-semibold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded shadow-sm border border-amber-200/50">{{
              row.code }}</span>
          <b class="text-base font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">{{ row.item?.label || 'Retired taxonomy item' }}</b>
          <BaseBadge :tone="row.primary ? 'teal' : 'gray'" class="shadow-sm border border-slate-100">{{ row.primary ? 'Primary' : 'Secondary' }}</BaseBadge>
          <BaseBadge v-if="row.source === 'ai_confirmed'" tone="indigo" class="shadow-sm border border-slate-100">AI-suggested, confirmed</BaseBadge>
          <BaseBadge v-if="row.source === 'ai_modified'" tone="indigo" class="shadow-sm border border-slate-100">AI-suggested, modified</BaseBadge>
        </div>
        <div class="flex flex-col gap-1.5 text-[13px] text-slate-500 font-medium mt-1">
          <div v-if="row.inclusion" class="flex items-center gap-2">
            <span class="text-slate-400">Audience:</span>
            <span class="bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm text-slate-700">{{ INCLUSION_GROUPS[row.inclusion.group] }}</span>
            <span class="text-slate-400">•</span>
            <span class="text-slate-600">Type {{ row.inclusion.type }}</span>
          </div>
          <div v-if="row.levels && row.levels.length" class="flex items-center gap-2">
            <span class="text-slate-400">Education levels:</span>
            <span class="text-slate-600">{{ row.levels.map((l: any) => EDUCATION_LEVELS[l]).join(', ') }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
      <p class="text-sm text-slate-500 font-medium">No activities recorded for this entry.</p>
    </div>
  </BaseCard>
</template>
