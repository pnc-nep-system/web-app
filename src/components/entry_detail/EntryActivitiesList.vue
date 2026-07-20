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
  <BaseCard class="mt-4">
    <div class="section-title mt-0">
      <h3>Activities</h3>
    </div>
    <div v-for="row in activityRows" :key="row.code" class="mb-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="mono text-xs text-amber-700 bg-amber-50 px-1.5 py-px rounded">{{
            row.code }}</span>
        <b class="text-sm">{{ row.item?.label || 'Retired taxonomy item' }}</b>
        <BaseBadge :tone="row.primary ? 'teal' : 'gray'">{{ row.primary ? 'Primary' : 'Secondary' }}</BaseBadge>
        <BaseBadge v-if="row.source === 'ai_confirmed'" tone="indigo">AI-suggested, confirmed</BaseBadge>
        <BaseBadge v-if="row.source === 'ai_modified'" tone="indigo">AI-suggested, modified</BaseBadge>
      </div>
      <div class="mt-1.5 text-xs text-gray-500">
        <span v-if="row.inclusion">{{ INCLUSION_GROUPS[row.inclusion.group] }} · Type {{ row.inclusion.type }}
          &nbsp;·&nbsp; </span>
        {{ (row.levels ?? []).map((l: any) => EDUCATION_LEVELS[l]).join(', ') }}
      </div>
    </div>
  </BaseCard>
</template>
