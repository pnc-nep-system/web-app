import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { memberApi } from '@/api/member.api'
import { BUDGET_BANDS } from '@/constants/programme'
import type { ProgrammeIdentity } from '@/types/programme'

import { monthsSince, formatRelativeTime } from '@/utils/date'

export interface EntryWithStatus extends ProgrammeIdentity {
  status: string
  statusVariant: 'warning' | 'success'
  unverifiedLabel: string
  provincesDisplay: string
  hasMoreProvinces: boolean
  moreProvincesCount: number
  primaryCodes: string[]
  relativeLastUpdated: string
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
    provinces: (e.locations || []).map((loc: any) => loc.province?.province_name).filter(Boolean),
    activities: (e.activities || []).map((a: any) => ({
      code: a.activity_item?.code || '',
      primary: !!a.is_primary,
    })).filter(a => a.code),
    lastUpdated: e.last_updated_at || e.updated_at || '',
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
    currentItems.value.map(entry => {
      const provinces = entry.provinces || []
      const primaryActivities = entry.activities?.filter(a => a.primary).map(a => a.code) || []

      return {
        ...entry,
        status: entry.isUnverified ? 'Unverified' : 'Verified',
        statusVariant: entry.isUnverified ? 'warning' : 'success' as const,
        unverifiedLabel: `Unverified — ${monthsSince(entry.lastUpdated)} months`,
        provincesDisplay: provinces.slice(0, 2).join(', '),
        hasMoreProvinces: provinces.length > 2,
        moreProvincesCount: provinces.length - 2,
        primaryCodes: primaryActivities,
        relativeLastUpdated: formatRelativeTime(entry.lastUpdated) || '—',
      }
    })
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

  async function switchTab(tab: 'draft' | 'submitted', force = false) {
    activeTab.value = tab
    if (tab === 'draft' && (draftItems.value.length === 0 || force)) {
      await fetchDraftEntries()
    } else if (tab === 'submitted' && (submittedItems.value.length === 0 || force)) {
      await fetchSubmittedEntries()
    }
  }

  function goToPage(page: number) {
    if (activeTab.value === 'draft') {
      fetchDraftEntries(page)
    } else {
      fetchSubmittedEntries(page)
    }
  }

  function retry() {
    const page = activeTab.value === 'draft'
      ? draftPagination.value.currentPage
      : submittedPagination.value.currentPage
    if (activeTab.value === 'draft') {
      fetchDraftEntries(page)
    } else {
      fetchSubmittedEntries(page)
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
    goToPage,
    retry,
  }
})
