import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { memberApi } from '@/api/member.api'
import { BUDGET_BANDS } from '@/constants/programme'
import type { ProgrammeIdentity } from '@/types/programme'

export interface EntryWithStatus extends ProgrammeIdentity {
  status: string
  statusVariant: 'warning' | 'success'
}

export const useEntriesStore = defineStore('entries', () => {
  const items = ref<ProgrammeIdentity[]>([])
  const loading = ref(false)

  const entriesWithStatus = computed<EntryWithStatus[]>(() =>
    items.value.map(entry => ({
      ...entry,
      status: entry.isUnverified ? 'Unverified' : 'Verified',
      statusVariant: entry.isUnverified ? 'warning' : 'success' as const,
    }))
  )

  function statusOf(entry: ProgrammeIdentity): 'verified' | 'unverified' {
    return entry.isUnverified ? 'unverified' : 'verified'
  }

  async function fetchEntries(organisationId: number | string) {
    loading.value = true
    try {
        const response = await memberApi.listProgrammeEntries(organisationId)
        const raw = response.data.data || []
        items.value = raw.map((e: any) => ({
          id: e.id,
          name: e.programme_name || '',
          startYear: e.start_year || null,
          endYear: e.end_year || null,
          isOngoing: !!e.ongoing,
          fteStaff: e.fte_staff ? parseFloat(e.fte_staff) : null,
          budgetBand: e.budget_band_id ? BUDGET_BANDS[e.budget_band_id - 1] || null : null,
          directBeneficiaries: e.direct_beneficiaries || null,
          indirectBeneficiaries: e.indirect_beneficiaries || null,
          method: e.method || '',
          verifiedDate: e.verified_date || '',
          isUnverified: !!e.is_unverified,
          provinces: e.provinces || [],
          activities: e.activities || [],
          lastUpdated: e.updated_at || '',
        }))
    } finally {
        loading.value = false
    }
  }

  return { items, loading, entriesWithStatus, statusOf, fetchEntries }
})
