<script setup lang="ts">
import { formatBudget } from '@/utils/format'
import BaseCard from '@/components/common/BaseCard.vue'
import type { EntryDetail } from '@/types/entryDetail'

defineProps<{
  entry: EntryDetail
}>()
</script>

<template>
  <BaseCard>
    <div class="section-title mt-0">
      <h3>Programme identity</h3>
    </div>
    <div class="grid grid-cols-4 gap-3.5">
      <div>
        <div class="text-xs text-gray-500">Start year</div><b>{{ entry.startYear }}</b>
      </div>
      <div>
        <div class="text-xs text-gray-500">End year</div><b>{{ entry.endYear || 'Ongoing' }}</b>
      </div>
      <div>
        <div class="text-xs text-gray-500">Staff (FTE)</div><b>{{ entry.staffFte }}</b>
      </div>
      <div>
        <div class="text-xs text-gray-500">Budget band</div><b>{{ formatBudget(entry.budgetBand) }}</b>
      </div>
      <div>
        <div class="text-xs text-gray-500">Direct beneficiaries</div><b>{{
          entry.directBeneficiaries
            ? '~' + entry.directBeneficiaries.toLocaleString() + ' / yr' : '—' }}</b>
      </div>
      <div>
        <div class="text-xs text-gray-500">Indirect beneficiaries</div><b>{{
          entry.indirectBeneficiaries ? '~' + entry.indirectBeneficiaries.toLocaleString() + ' / yr' : '—'
          }}</b>
      </div>
    </div>
  </BaseCard>
</template>
