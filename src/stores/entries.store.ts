import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { memberApi } from '@/api/member.api'
import { BUDGET_BANDS } from '@/constants/programme'
import type { ProgrammeIdentity } from '@/types/programme'

export interface EntryWithStatus extends ProgrammeIdentity {
  status: string
  statusVariant: 'warning' | 'success'
}

export interface PaginationMeta {
  currentPage: number
  lastPage: number
  total: number
}

function mapEntry(e: any): ProgrammeIdentity {
  return {
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
  }
}

export const useEntriesStore = defineStore('entries', () => {
  const activeTab = ref<'draft' | 'submitted'>('draft')

  const draftItems = ref<ProgrammeIdentity[]>([])
  const submittedItems = ref<ProgrammeIdentity[]>([])
  const draftLoading = ref(false)
  const submittedLoading = ref(false)
  const draftError = ref('')
  const submittedError = ref('')
  const draftPagination = ref<PaginationMeta>({ currentPage: 1, lastPage: 0, total: 0 })
  const submittedPagination = ref<PaginationMeta>({ currentPage: 1, lastPage: 0, total: 0 })

  const currentItems = computed(() =>
    activeTab.value === 'draft' ? draftItems.value : submittedItems.value
  )
  const currentLoading = computed(() =>
    activeTab.value === 'draft' ? draftLoading.value : submittedLoading.value
  )
  const currentError = computed(() =>
    activeTab.value === 'draft' ? draftError.value : submittedError.value
  )
  const currentPagination = computed(() =>
    activeTab.value === 'draft' ? draftPagination.value : submittedPagination.value
  )

  const entriesWithStatus = computed<EntryWithStatus[]>(() =>
    currentItems.value.map(entry => ({
      ...entry,
      status: entry.isUnverified ? 'Unverified' : 'Verified',
      statusVariant: entry.isUnverified ? 'warning' : 'success' as const,
    }))
  )

  const verifiedCount = computed(() => currentItems.value.filter(e => !e.isUnverified).length)
  const unverifiedCount = computed(() => currentItems.value.filter(e => e.isUnverified).length)

  function statusOf(entry: ProgrammeIdentity): 'verified' | 'unverified' {
    return entry.isUnverified ? 'unverified' : 'verified'
  }

  async function fetchDraftEntries(page = 1) {
    draftLoading.value = true
    draftError.value = ''
    try {
      const response = await memberApi.getDraftProgrammeEntries(page)
      const body = response.data
      draftItems.value = (body.data || []).map(mapEntry)
      draftPagination.value = {
        currentPage: body.current_page ?? page,
        lastPage: body.last_page ?? 0,
        total: body.total ?? 0,
      }
    } catch (err: any) {
      draftError.value = err?.response?.data?.message || 'Failed to load draft entries.'
      draftItems.value = []
    } finally {
      draftLoading.value = false
    }
  }

  async function fetchSubmittedEntries(page = 1) {
    submittedLoading.value = true
    submittedError.value = ''
    try {
      const response = await memberApi.getSubmittedProgrammeEntries(page)
      const body = response.data
      submittedItems.value = (body.data || []).map(mapEntry)
      submittedPagination.value = {
        currentPage: body.current_page ?? page,
        lastPage: body.last_page ?? 0,
        total: body.total ?? 0,
      }
    } catch (err: any) {
      submittedError.value = err?.response?.data?.message || 'Failed to load submitted entries.'
      submittedItems.value = []
    } finally {
      submittedLoading.value = false
    }
  }

  async function switchTab(tab: 'draft' | 'submitted') {
    activeTab.value = tab
    if (tab === 'draft' && draftItems.value.length === 0) {
      await fetchDraftEntries()
    } else if (tab === 'submitted' && submittedItems.value.length === 0) {
      await fetchSubmittedEntries()
    }
  }

  return {
    activeTab,
    draftItems,
    submittedItems,
    draftLoading,
    submittedLoading,
    draftError,
    submittedError,
    draftPagination,
    submittedPagination,
    currentItems,
    currentLoading,
    currentError,
    currentPagination,
    entriesWithStatus,
    verifiedCount,
    unverifiedCount,
    statusOf,
    fetchDraftEntries,
    fetchSubmittedEntries,
    switchTab,
  }
})
