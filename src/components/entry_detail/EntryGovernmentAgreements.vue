<script setup lang="ts">
import { AGREEMENT_STATUS } from '@/utils/format'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import type { DetailGovernmentAgreement } from '@/types/entryDetail'

defineProps<{
  agreements: DetailGovernmentAgreement[]
}>()
</script>

<template>
  <BaseCard class="mt-4">
    <div class="section-title mt-0">
      <h3>Government agreements</h3>
    </div>
    <table class="tbl" v-if="agreements.length">
      <thead>
        <tr>
          <th>Counterpart</th>
          <th>Nature</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(g, idx) in agreements" :key="idx">
          <td>{{ g.counterpart }}<div v-if="g.institution" class="text-xs text-gray-500">{{
            g.institution }}</div>
          </td>
          <td>{{ g.nature }}</td>
          <td>
            <BaseBadge :tone="g.status === 'active' ? 'green' : g.status === 'expired' ? 'red' : 'amber'">{{
              AGREEMENT_STATUS[g.status] }}</BaseBadge>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-xs text-gray-500">No government agreements recorded for this entry.
    </p>
  </BaseCard>
</template>
