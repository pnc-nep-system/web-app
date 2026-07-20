import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProgrammeGeographyStore } from './programmeGeography'
import { useTaxonomyStore } from './taxonomy'
import { getMapEntries, type MapFilters } from '@/api/map.api'
import type { MapViewFilters } from '@/types/map'

/** Baseline empty filter state used by the store and by clearFilters(). */
const DEFAULT_FILTERS: MapViewFilters = {
  category: '',
  level: '',
  inclusion: '',
  province: '',
  district: '',
  village: '',
  counterpart: '',
  keyword: '',
}

/**
 * Pinia store powering the Programme Map page.
 *
 * Manages the map entry list, UI filter state, client-side sorting /
 * filtering / pagination, and data fetching. Sub-stores (geography,
 * taxonomy) are resolved lazily via computeds to avoid circular deps.
 */
export const useMapStore = defineStore('map', () => {
  /** Raw entry list fetched from the API. */
  const mapEntries = ref<any[]>([])
  /** Whether map entries are currently being fetched. */
  const loading = ref(false)

  /** Current UI filter values bound to MapFilterBar controls. */
  const filters = ref<MapViewFilters>({ ...DEFAULT_FILTERS })
  /** Current pagination page (1-indexed). */
  const page = ref(1)
  /** Number of entries shown per page. */
  const pageSize = 20
  /** Column being sorted by. */
  const sortKey = ref('name')
  /** Sort direction. */
  const sortDir = ref<'asc' | 'desc'>('asc')

  /**
   * Converts the UI-facing MapViewFilters into API-facing MapFilters.
   * Most numeric-ID fields are left null because the UI filters use
   * display strings; only the keyword and education-level fields are
   * mapped.
   *
   * @returns Filter object suitable for the CSV / PDF export endpoints.
   */
  function toApiFilters(): MapFilters {
    const f = filters.value
    return {
      category_id: null,
      subcategory_id: null,
      item_id: null,
      education_level_id: f.level ? Number(f.level) : null,
      inclusion_group: f.inclusion || null,
      inclusion_type: null,
      province_id: null,
      district_id: null,
      commune_id: null,
      keyword: f.keyword || null,
      organisation_name: null,
    }
  }

  /**
   * Lazily resolves the programme geography sub-store.
   * Wrapped in a computed to keep reactive access in sync.
   */
  const geographyStore = computed(() => useProgrammeGeographyStore())
  /**
   * Lazily resolves the taxonomy sub-store.
   * Wrapped in a computed to keep reactive access in sync.
   */
  const taxonomyStore = computed(() => useTaxonomyStore())

  /** Province display names for the "Province" filter dropdown. */
  const provincesList = computed(() =>
    geographyStore.value.provinces.map(p => p.province_name)
  )

  /** District display names for the "District" filter dropdown. */
  const districtsList = computed(() => {
    const all: string[] = []
    for (const list of Object.values(geographyStore.value.districtsCache)) {
      for (const d of list) {
        all.push(d.name)
      }
    }
    return all
  })

  /** Village display names for the "Village" filter dropdown. */
  const villagesList = computed(() => {
    const all: string[] = []
    for (const list of Object.values(geographyStore.value.villagesCache)) {
      for (const v of list) {
        all.push(v.name)
      }
    }
    return all
  })

  /**
   * Unique government counterpart agency names derived from all loaded
   * entries. Used by the "Govt. counterpart" filter dropdown.
   */
  const counterpartOptions = computed(() => {
    const agencies = mapEntries.value.flatMap(
      (e: any) => e.government_agreements?.map((a: any) => a.counterpart_agency) ?? []
    )
    return [...new Set(agencies)].filter(Boolean)
  })

  /**
   * Entries matching all active filters.
   *
   * Each filter dimension is optional — when its value is an empty string
   * that dimension is skipped. The keyword filter matches against both the
   * programme name and the organisation name.
   */
  const filtered = computed(() =>
    mapEntries.value.filter(e => {
      const f = filters.value
      if (f.category && e.activities?.length) {
        const codes = e.activities.map((a: any) => a.activity_item?.code ?? a.code)
        if (!codes.some((c: string) => c.startsWith(f.category))) return false
      }
      if (f.level) {
        const levelIds = e.activities?.flatMap((a: any) => a.activity_levels?.map((l: any) => String(l.education_level_id ?? l)) ?? [])
        if (!levelIds?.includes(f.level)) return false
      }
      if (f.inclusion) {
        const groups = e.activities?.map((a: any) => a.inclusion_group).filter(Boolean)
        if (!groups?.includes(f.inclusion)) return false
      }
      if (f.province) {
        const provinces = e.provinces ?? e.locations?.map((l: any) => l.province?.province_name ?? l.province_name).filter(Boolean) ?? []
        if (!provinces.includes(f.province)) return false
      }
      if (f.district) {
        const districts = e.locations?.map((l: any) => l.district?.name ?? l.district_name).filter(Boolean) ?? []
        if (districts.length && !districts.includes(f.district)) return false
      }
      if (f.village) {
        const villages = e.locations?.map((l: any) => l.village?.name ?? l.village_name).filter(Boolean) ?? []
        if (villages.length && !villages.includes(f.village)) return false
      }
      if (f.counterpart) {
        const agencies = e.government_agreements?.map((a: any) => a.counterpart_agency) ?? []
        if (!agencies.includes(f.counterpart)) return false
      }
      if (f.keyword) {
        const q = f.keyword.toLowerCase()
        const name = (e.programme_name ?? e.name ?? '').toLowerCase()
        const org = (e.organisation_name ?? e.organisation?.name ?? '').toLowerCase()
        if (!name.includes(q) && !org.includes(q)) return false
      }
      return true
    })
  )

  /**
   * Filtered entries sorted by the active sort column and direction.
   *
   * Supports sorting by programme name (lexicographic) and budget band
   * (numeric index). Resets to page 1 when the sort changes.
   */
  const sorted = computed(() => {
    const arr = [...filtered.value]
    const key = sortKey.value
    const dir = sortDir.value === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      let va: any, vb: any
      if (key === 'name') {
        va = (a.programme_name ?? a.name ?? '').toLowerCase()
        vb = (b.programme_name ?? b.name ?? '').toLowerCase()
      } else if (key === 'budgetBand') {
        va = a.budget_band_id ?? a.budgetBand ?? 0
        vb = b.budget_band_id ?? b.budgetBand ?? 0
        return (va - vb) * dir
      }
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
    return arr
  })

  /** Current page's slice of the sorted entry list. */
  const paged = computed(() =>
    sorted.value.slice((page.value - 1) * pageSize, page.value * pageSize)
  )

  /** Total number of pages based on filtered entry count. */
  const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize)))

  /**
   * Extracts primary activity codes from an entry.
   *
   * @param e - A map entry object.
   * @returns Array of activity codes marked as primary.
   */
  function primaryActivities(e: any): string[] {
    const primaries = e.activities?.filter((a: any) => a.is_primary).map((a: any) => a.activity_item?.code ?? a.code).filter(Boolean) ?? []
    if (primaries.length > 0) return primaries
    return e.activities?.map((a: any) => a.activity_item?.code ?? a.code).filter(Boolean) ?? []
  }

  /**
   * Formats a budget band value for display.
   *
   * @param band - The raw budget band string or null.
   * @returns Display string (original value or an em-dash placeholder).
   */
  function formatBudget(band: string | null | undefined): string {
    return band || '—'
  }

  /** Resets all filters to their default empty values and returns to page 1. */
  function clearFilters() {
    filters.value = { ...DEFAULT_FILTERS }
    page.value = 1
  }

  /**
   * Toggles sort column or direction.
   *
   * Clicking the same column twice reverses direction; clicking a different
   * column sets ascending order on that column. Resets to page 1.
   *
   * @param key - Sort column key (`'name'` | `'budgetBand'`).
   */
  function toggleSort(key: string) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
    page.value = 1
  }

  /**
   * Navigates to a specific pagination page if within valid range.
   *
   * @param p - Target page number (1-indexed).
   */
  function goToPage(p: number) {
    if (p >= 1 && p <= totalPages.value) {
      page.value = p
    }
  }

  /**
   * Fetches map entries, taxonomy categories, and provinces in parallel.
   *
   * Called on mount by MapView.vue. Sets `loading` to true during the
   * request and populates `mapEntries` on success.
   */
  async function fetchMapEntries() {
    loading.value = true
    try {
      const geoStore = useProgrammeGeographyStore()
      const taxStore = useTaxonomyStore()
      const [entriesRes] = await Promise.all([
        getMapEntries(),
        taxStore.fetchTaxonomy(),
        geoStore.loadProvinces(),
      ])
      const resData = entriesRes.data
      const rawList = resData?.data?.data ?? resData?.data ?? resData ?? []
      mapEntries.value = Array.isArray(rawList) ? rawList : []
    } catch {
      mapEntries.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    mapEntries,
    loading,
    filters,
    page,
    pageSize,
    sortKey,
    sortDir,
    toApiFilters,
    provincesList,
    districtsList,
    villagesList,
    counterpartOptions,
    filtered,
    sorted,
    paged,
    totalPages,
    primaryActivities,
    formatBudget,
    clearFilters,
    toggleSort,
    goToPage,
    fetchMapEntries,
  }
})
