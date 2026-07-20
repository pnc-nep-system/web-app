import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { organisationService } from '@/api/organisation.service'
import { memberApi } from '@/api/member.api'
import { formatRelativeTime } from '@/utils/date'
import type { Organisation } from '@/api/organisation.service'
import type { EntryRow } from '@/types/adminProgrammes'

export function useAdminProgrammes() {
  const router = useRouter()

  const orgs = ref<Organisation[]>([])
  const orgsLoading = ref(false)

  const entries = ref<EntryRow[]>([])
  const entriesLoading = ref(false)
  const entriesError = ref('')
  const currentPage = ref(1)
  const lastPage = ref(1)
  const total = ref(0)
  const selectedOrgId = ref<number | null>(null)

  const showOrgPicker = ref(false)
  const pickerSearch = ref('')
  const pickerOrgId = ref<number | null>(null)

  function toOrganisation(value: unknown): Organisation | null {
    if (!value || typeof value !== 'object') return null

    const org = value as Partial<Organisation> & { id?: unknown; name?: unknown }
    const id = Number(org.id)
    const name = typeof org.name === 'string' ? org.name.trim() : ''

    if (!Number.isFinite(id) || !name) return null

    return {
      ...org,
      id,
      name,
      contact_name: org.contact_name ?? '',
      email: org.email ?? '',
      member_since: org.member_since ?? 0,
      status: org.status ?? 'active',
      last_inactive_at: org.last_inactive_at ?? null,
      users_count: org.users_count ?? 0,
      logo_url: org.logo_url ?? null,
      created_at: org.created_at ?? '',
      updated_at: org.updated_at ?? '',
    }
  }

  const filteredOrgs = computed<Organisation[]>(() => {
    const q = pickerSearch.value.toLowerCase()
    return orgs.value.filter((org) => {
      if (q && !org.name.toLowerCase().includes(q)) return false
      return true
    })
  })

  async function loadOrgs() {
    orgsLoading.value = true
    try {
      const res = await organisationService.getOrganisations(1, '', { per_page: 200 })
      orgs.value = (res.data.data ?? [])
        .map((org) => toOrganisation(org))
        .filter((org): org is Organisation => org !== null)
    } catch {
      // Fallback: try the general organisations endpoint (for coordinators)
      try {
        const res = await memberApi.listAllOrganisations()
        const data = res.data?.data ?? res.data ?? []
        orgs.value = (Array.isArray(data) ? data : [])
          .map((org: unknown) => toOrganisation(org))
          .filter((org): org is Organisation => org !== null)
      } catch {
        orgs.value = []
      }
    } finally {
      orgsLoading.value = false
    }
  }

  async function fetchEntries(page: number) {
    entriesLoading.value = true
    entriesError.value = ''
    try {
      const res = await memberApi.getAdminAllProgrammeEntries(page, selectedOrgId.value)
      const body = res.data
      entries.value = (body.data || []).map((e: unknown): EntryRow => {
        const entry = e as Record<string, unknown>
        const org = entry.organisation as Record<string, unknown> | null | undefined
        const orgName = (org && typeof org.name === 'string')
          ? org.name
          : (typeof entry.organisation_name === 'string' ? entry.organisation_name : null)
            ?? orgs.value.find(o => o.id === Number(entry.organisation_id))?.name
            ?? null
        return {
          id: Number(entry.id),
          programme_name: String(entry.programme_name ?? ''),
          is_submitted: !!entry.is_submitted,
          is_unverified: !!entry.is_unverified,
          start_year: entry.start_year as number | null,
          end_year: entry.end_year as number | null,
          organisation: orgName ? { name: orgName } : null,
          relativeUpdated: formatRelativeTime(entry.updated_at as string) || '—',
        }
      })
      currentPage.value = body.current_page ?? page
      lastPage.value = body.last_page ?? 1
      total.value = body.total ?? 0
    } catch {
      entriesError.value = 'Failed to load entries.'
    } finally {
      entriesLoading.value = false
    }
  }

  function onOrgFilterChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value
    selectedOrgId.value = val ? Number(val) : null
    fetchEntries(1)
  }

  function setPickerOrgId(id: number | null) {
    pickerOrgId.value = id
  }

  function onPickerSearchInput(e: Event) {
    pickerSearch.value = (e.target as HTMLInputElement).value
  }

  function closeOrgPicker() {
    showOrgPicker.value = false
  }

  function openEntry(id: number) {
    router.push(`/entries/new?id=${id}`)
  }

  function openCreatePicker() {
    pickerOrgId.value = null
    pickerSearch.value = ''
    showOrgPicker.value = true
  }

  function confirmCreate() {
    if (!pickerOrgId.value) return
    showOrgPicker.value = false
    router.push({ path: '/entries/new', query: { org_id: String(pickerOrgId.value) } })
  }

  onMounted(async () => {
    await loadOrgs()
    fetchEntries(1)
  })

  return reactive({
    orgs,
    orgsLoading,
    entries,
    entriesLoading,
    entriesError,
    currentPage,
    lastPage,
    total,
    selectedOrgId,
    showOrgPicker,
    pickerSearch,
    pickerOrgId,
    filteredOrgs,
    fetchEntries,
    onOrgFilterChange,
    setPickerOrgId,
    onPickerSearchInput,
    closeOrgPicker,
    openEntry,
    openCreatePicker,
    confirmCreate,
  })
}
