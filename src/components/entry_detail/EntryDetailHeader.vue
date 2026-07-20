<script setup lang="ts">
import type { EntryDetail } from '@/types/entryDetail'
import { formatRelativeTime } from '@/utils/format'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseIcon from '@/components/common/BaseIcon.vue'

defineProps<{
  entry: EntryDetail
  status: 'verified' | 'unverified' | null
  marking: boolean
  isAdmin: boolean
}>()

defineEmits<{
  'mark-verified': []
  back: []
}>()
</script>

<template>
  <div class="page-head flex items-center justify-between gap-4 mb-6">
    <div>
      <div class="flex items-center gap-2.5 mb-1.5 flex-wrap">
        <h1 class="text-xl">{{ entry.name }}</h1>
        <BaseBadge :tone="status === 'verified' ? 'green' : 'amber'" dot>{{ status === 'verified' ? 'Verified' :
          'Unverified' }}</BaseBadge>
      </div>
      <p>{{ entry.organisationName }} · Programme ID #{{ entry.id.replace('entry-', '') }} ·
        Last
        updated {{ formatRelativeTime(entry.lastUpdated) }}</p>
    </div>

    <div class="flex gap-2.5">
      <BaseButton v-if="status === 'unverified' && isAdmin" variant="secondary" class="inline-flex items-center gap-1.5" :disabled="marking" @click="$emit('mark-verified')">
        <BaseIcon name="check" :size="15" /> {{ marking ? 'Marking…' : 'Mark as verified' }}
      </BaseButton>
      <BaseButton variant="secondary" class="inline-flex items-center gap-1.5" @click="$emit('back')">
        <BaseIcon name="arrowLeft" :size="15" /> Back to map
      </BaseButton>
    </div>
  </div>
</template>
