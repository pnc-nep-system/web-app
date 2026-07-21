import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { memberApi } from '@/api/member.api'
import { BUDGET_BANDS } from '@/constants/programme'
import type { ProgrammeIdentity } from '@/types/programme'

import { monthsSince, formatRelativeTime } from '@/utils/date'
import { extractPrimaryActivityCodes } from '@/utils/activityHelpers'

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
    provinces: (e.locations || []).map((loc: any) => loc.province?.province_name ?? loc.province_name).filter(Boolean),
    activities: (e.activities || []).map((a: any) => {
      let code = a.activity_item?.code || a.code || (typeof a === 'string' ? a : '')
      if (!code && a.activity_item_id) {
        // Search taxonomy by ID fallback
        code = (window as any).__taxonomyIdMap?.[a.activity_item_id] || ''
      }
      const isPrimary = !!(a.is_primary ?? a.primary)
      return {
        code,
        is_primary: isPrimary,
        primary: isPrimary,
        activity_item: a.activity_item || { code },
      }
    }).filter((a: any) => a.code),
    lastUpdated: e.last_updated_at || e.updated_at || '',
    isDraft: !Number(e.is_submitted),
  }
}

export const useEntriesStore = defineStore('entries', () => {
  const activeTab = ref<'all' | 'draft' | 'submitted'>('all')

  const allItems = ref<ProgrammeIdentity[]>([])
  const draftItems = ref<ProgrammeIdentity[]>([])
  const submittedItems = ref<ProgrammeIdentity[]>([])
  const allLoading = ref(false)
  const draftLoading = ref(false)
  const submittedLoading = ref(false)
  const allError = ref('')
  const draftError = ref('')
  const submittedError = ref('')
  const allPagination = ref<PaginationMeta>({ currentPage: 1, lastPage: 0, total: 0 })
  const draftPagination = ref<PaginationMeta>({ currentPage: 1, lastPage: 0, total: 0 })
  const submittedPagination = ref<PaginationMeta>({ currentPage: 1, lastPage: 0, total: 0 })

  const currentItems = computed(() =>
    activeTab.value === 'all' ? allItems.value : (activeTab.value === 'draft' ? draftItems.value : submittedItems.value)
  )
  const currentLoading = computed(() =>
    activeTab.value === 'all' ? allLoading.value : (activeTab.value === 'draft' ? draftLoading.value : submittedLoading.value)
  )
  const currentError = computed(() =>
    activeTab.value === 'all' ? allError.value : (activeTab.value === 'draft' ? draftError.value : submittedError.value)
  )
  const currentPagination = computed(() =>
    activeTab.value === 'all' ? allPagination.value : (activeTab.value === 'draft' ? draftPagination.value : submittedPagination.value)
  )

  const entriesWithStatus = computed<EntryWithStatus[]>(() =>
    currentItems.value.map(entry => {
      const provinces = entry.provinces || []
      const primaryActivities = extractPrimaryActivityCodes(entry.activities)

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

  const items = computed<any[]>(() => [...allItems.value, ...draftItems.value, ...submittedItems.value])
  const entryCache = ref<Record<string, any>>({})

  function statusOf(entry: ProgrammeIdentity): 'verified' | 'unverified' {
    return entry.isUnverified ? 'unverified' : 'verified'
  }

  function mapDetailEntry(e: any): any {
    return {
      id: `entry-${e.id}`,
      name: e.programme_name || '',
      organisationId: e.organisation_id || e.organisation?.id,
      organisationName: e.organisation_name || e.organisation?.name,
      startYear: e.start_year || null,
      endYear: e.end_year || null,
      isOngoing: !!e.ongoing,
      staffFte: e.fte_staff ? parseFloat(e.fte_staff) : null,
      budgetBand: e.budget_band_id ? BUDGET_BANDS[e.budget_band_id - 1] || null : null,
      directBeneficiaries: e.direct_beneficiaries || null,
      indirectBeneficiaries: e.indirect_beneficiaries || null,
      method: e.method || '',
      verifiedDate: e.verified_date || '',
      isUnverified: !!e.is_unverified,
      provinces: (e.locations || []).map((loc: any) => loc.province?.province_name ?? loc.province_name).filter(Boolean),
      activities: (e.activities || []).map((a: any) => ({
        code: a.activity_item?.code || a.code || '',
        is_primary: !!(a.is_primary ?? a.primary),
        primary: !!(a.is_primary ?? a.primary),
        inclusion: a.inclusion ? { group: a.inclusion_group || a.inclusion.group, type: a.inclusion_type || a.inclusion.type } : (a.inclusion_group ? { group: a.inclusion_group, type: a.inclusion_type } : null),
        levels: a.activity_levels?.map((l: any) => l.education_level_id ?? l) ?? [],
        source: a.source || null,
      })).filter((a: any) => a.code),
      governmentAgreements: (e.government_agreements || []).map((g: any) => ({
        counterpart: g.counterpart_agency || g.counterpart || '',
        institution: g.institution_name || g.institution || '',
        nature: g.nature || '',
        status: g.status || '',
      })),
      keywords: (e.keywords || []).map((k: any) => k.keyword ?? k),
      otherCountries: e.other_countries || e.otherCountries || '',
      lastUpdated: e.last_updated_at || e.updated_at || '',
      isDraft: !Number(e.is_submitted),
    }
  }

  function byId(id: string | number | undefined): any {
    if (id === undefined || id === null) return null
    const key = String(id)
    return entryCache.value[key] || null
  }

  const fetchPromises = new Map<string, Promise<any>>()

  async function fetchById(id: string | number): Promise<any> {
    const key = String(id)
    if (entryCache.value[key]) return entryCache.value[key]
    if (fetchPromises.has(key)) return fetchPromises.get(key)

    const promise = memberApi.getProgrammeEntry(id)
      .then((response) => {
        const data = response.data.data ?? response.data
        const mapped = mapDetailEntry(data)
        entryCache.value[key] = mapped
        fetchPromises.delete(key)
        return mapped
      })
      .catch((err) => {
        fetchPromises.delete(key)
        throw err
      })

    fetchPromises.set(key, promise)
    return promise
  }

  async function markVerified(id: string | number) {
    try {
      await memberApi.markVerified(id)
      const entry = [...allItems.value, ...draftItems.value, ...submittedItems.value].find((e) => String(e.id) === String(id))
      if (entry) {
        entry.isUnverified = false
      }
    } catch {
      // ignore
    }
  }

  let allPromise: Promise<void> | null = null
  let draftPromise: Promise<void> | null = null
  let submittedPromise: Promise<void> | null = null

  async function fetchAllEntries(page = 1) {
    if (allPromise) return allPromise
    allPromise = _fetchAll(page).finally(() => { allPromise = null })
    return allPromise
  }

  async function _fetchAll(page: number) {
    allLoading.value = true
    allError.value = ''
    try {
      const response = await memberApi.getAllProgrammeEntries(page)
      const body = response.data
      allItems.value = (body.data || []).map(mapEntry)
      allPagination.value = {
        currentPage: body.current_page ?? page,
        lastPage: body.last_page ?? 0,
        total: body.total ?? 0,
      }
    } catch (err: any) {
      allError.value = err?.response?.data?.message || 'Failed to load entries.'
      allItems.value = []
    } finally {
      allLoading.value = false
    }
  }

  async function fetchDraftEntries(page = 1) {
    if (draftPromise) return draftPromise
    draftPromise = _fetchDraft(page).finally(() => { draftPromise = null })
    return draftPromise
  }

  async function _fetchDraft(page: number) {
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
    if (submittedPromise) return submittedPromise
    submittedPromise = _fetchSubmitted(page).finally(() => { submittedPromise = null })
    return submittedPromise
  }

  async function _fetchSubmitted(page: number) {
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

  function switchTab(tab: 'all' | 'draft' | 'submitted') {
    activeTab.value = tab
    if (tab === 'all') fetchAllEntries(1)
    else if (tab === 'draft') fetchDraftEntries(1)
    else fetchSubmittedEntries(1)
  }

  function goToPage(page: number) {
    if (activeTab.value === 'all') {
      if (page >= 1 && page <= allPagination.value.lastPage) fetchAllEntries(page)
    } else if (activeTab.value === 'draft') {
      if (page >= 1 && page <= draftPagination.value.lastPage) fetchDraftEntries(page)
    } else {
      if (page >= 1 && page <= submittedPagination.value.lastPage) fetchSubmittedEntries(page)
    }
  }

  function retry() {
    if (activeTab.value === 'all') fetchAllEntries(currentPagination.value.currentPage)
    else if (activeTab.value === 'draft') fetchDraftEntries(currentPagination.value.currentPage)
    else fetchSubmittedEntries(currentPagination.value.currentPage)
  }

  function forOrganisation(orgId: number | null) {
    if (!orgId) return []
    return [...draftItems.value, ...submittedItems.value]
  }

  return {
    activeTab,
    allItems,
    draftItems,
    submittedItems,
    allLoading,
    draftLoading,
    submittedLoading,
    allError,
    draftError,
    submittedError,
    allPagination,
    draftPagination,
    submittedPagination,
    currentItems,
    items,
    currentLoading,
    currentError,
    currentPagination,
    entriesWithStatus,
    verifiedCount,
    unverifiedCount,
    statusOf,
    byId,
    fetchById,
    markVerified,
    fetchAllEntries,
    fetchDraftEntries,
    fetchSubmittedEntries,
    switchTab,
    goToPage,
    retry,
    forOrganisation,
  }
})
