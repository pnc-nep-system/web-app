import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { memberApi } from '@/api/member.api'
import type { ProgrammeGeographicData, Province, District, Commune, Village } from '@/types/programme'

export const useProgrammeGeographyStore = defineStore('programmeGeography', () => {
  // Selections
  const provinceIds = ref<number[]>([])
  const districts = ref<Record<number, number[]>>({})
  const communes = ref<Record<number, number[]>>({})
  const villages = ref<Record<number, number[]>>({})
  const otherCountries = ref('')
  const section3Data = computed<ProgrammeGeographicData>(() => ({
    provinceIds: provinceIds.value,
    districts: districts.value,
    communes: communes.value,
    villages: villages.value,
    otherCountries: otherCountries.value,
  }))

  // Caches — plain objects (non-reactive) so reads are synchronous with no Vue flush delay
  const provinces = shallowRef<Province[]>([])
  const districtsCache = shallowRef<Record<number, District[]>>({})
  const communesCache = shallowRef<Record<number, Commune[]>>({})
  const villagesCache = shallowRef<Record<number, Village[]>>({})

  // Raw cache mirrors for instant dedup checks (no Vue reactivity batching)
  const _districtsRaw: Record<number, District[]> = {}
  const _communesRaw: Record<number, Commune[]> = {}
  const _villagesRaw: Record<number, Village[]> = {}

  // Loading
  const loadingProvinces = ref(false)
  const provincesError = ref<string | null>(null)
  const loadingDistricts = ref<Set<number>>(new Set())
  const loadingCommunes = ref<Set<number>>(new Set())
  const loadingVillages = ref<Set<number>>(new Set())

  // Expanded sections
  const expandedProvinces = ref<Set<number>>(new Set())
  const expandedDistricts = ref<Set<number>>(new Set())
  const expandedCommunes = ref<Set<number>>(new Set())

  const provinceNameById = computed(() => {
    const map: Record<number, string> = {}
    for (const p of provinces.value) {
      map[p.id] = p.province_name
    }
    return map
  })

  const districtNameById = computed(() => {
    const map: Record<number, string> = {}
    for (const list of Object.values(districtsCache.value)) {
      for (const d of list) {
        map[d.id] = d.name
      }
    }
    return map
  })

  const communeNameById = computed(() => {
    const map: Record<number, string> = {}
    for (const list of Object.values(communesCache.value)) {
      for (const c of list) {
        map[c.id] = c.name
      }
    }
    return map
  })

  const villageNameById = computed(() => {
    const map: Record<number, string> = {}
    for (const list of Object.values(villagesCache.value)) {
      for (const v of list) {
        map[v.id] = v.name
      }
    }
    return map
  })

  let _provincesPromise: Promise<void> | null = null

  async function loadProvinces() {
    if (provinces.value.length > 0) return
    if (_provincesPromise) return _provincesPromise
    loadingProvinces.value = true
    provincesError.value = null
    _provincesPromise = (async () => {
      try {
        const res = await memberApi.getProvinces()
        provinces.value = res.data.data
      } catch {
        provincesError.value = 'Failed to load provinces. Please try again.'
      } finally {
        loadingProvinces.value = false
        _provincesPromise = null
      }
    })()
    return _provincesPromise
  }

  // Promise-based in-flight guards — survive reset() since they're keyed by ID
  const _districtPromises = new Map<number, Promise<void>>()
  const _communePromises = new Map<number, Promise<void>>()
  const _villagePromises = new Map<number, Promise<void>>()

  async function fetchDistricts(provinceId: number) {
    if (_districtsRaw[provinceId]) return
    if (_districtPromises.has(provinceId)) return _districtPromises.get(provinceId)
    loadingDistricts.value = new Set([...loadingDistricts.value, provinceId])
    const promise = (async () => {
      try {
        const res = await memberApi.getDistricts(provinceId)
        _districtsRaw[provinceId] = res.data.data
        districtsCache.value = { ...districtsCache.value, [provinceId]: res.data.data }
      } finally {
        _districtPromises.delete(provinceId)
        const next = new Set(loadingDistricts.value)
        next.delete(provinceId)
        loadingDistricts.value = next
      }
    })()
    _districtPromises.set(provinceId, promise)
    return promise
  }

  async function fetchCommunes(districtId: number) {
    if (_communesRaw[districtId]) return
    if (_communePromises.has(districtId)) return _communePromises.get(districtId)
    loadingCommunes.value = new Set([...loadingCommunes.value, districtId])
    const promise = (async () => {
      try {
        const res = await memberApi.getCommunes(districtId)
        _communesRaw[districtId] = res.data.data
        communesCache.value = { ...communesCache.value, [districtId]: res.data.data }
      } finally {
        _communePromises.delete(districtId)
        const next = new Set(loadingCommunes.value)
        next.delete(districtId)
        loadingCommunes.value = next
      }
    })()
    _communePromises.set(districtId, promise)
    return promise
  }

  async function fetchVillages(communeId: number) {
    if (_villagesRaw[communeId]) return
    if (_villagePromises.has(communeId)) return _villagePromises.get(communeId)
    loadingVillages.value = new Set([...loadingVillages.value, communeId])
    const promise = (async () => {
      try {
        const res = await memberApi.getVillages(communeId)
        _villagesRaw[communeId] = res.data.data
        villagesCache.value = { ...villagesCache.value, [communeId]: res.data.data }
      } finally {
        _villagePromises.delete(communeId)
        const next = new Set(loadingVillages.value)
        next.delete(communeId)
        loadingVillages.value = next
      }
    })()
    _villagePromises.set(communeId, promise)
    return promise
  }

  function toggleProvince(provinceId: number) {
    const idx = provinceIds.value.indexOf(provinceId)
    if (idx === -1) {
      provinceIds.value.push(provinceId)
    } else {
      provinceIds.value.splice(idx, 1)
      const districtIds = districts.value[provinceId] || []
      districtIds.forEach(did => {
        const communeIds = communes.value[did] || []
        communeIds.forEach(cid => { delete villages.value[cid] })
        delete communes.value[did]
      })
      delete districts.value[provinceId]
      const next = new Set(expandedProvinces.value)
      next.delete(provinceId)
      expandedProvinces.value = next
    }
  }

  // District expand/collapse (Only one province expanded at a time)
  function toggleDistrictVisibility(provinceId: number) {
    const next = new Set<number>()
    if (expandedProvinces.value.has(provinceId)) {
      // Toggle off -> leaves next empty
    } else {
      next.add(provinceId)
      fetchDistricts(provinceId)
    }
    expandedProvinces.value = next
  }

  function toggleDistrict(provinceId: number, districtId: number) {
    const arr = districts.value[provinceId] ?? []
    const idx = arr.indexOf(districtId)
    if (idx === -1) {
      districts.value = { ...districts.value, [provinceId]: [...arr, districtId] }
    } else {
      const communeIds = communes.value[districtId] || []
      communeIds.forEach(cid => delete villages.value[cid])
      delete communes.value[districtId]
      const next = new Set(expandedDistricts.value)
      next.delete(districtId)
      expandedDistricts.value = next
      districts.value = { ...districts.value, [provinceId]: arr.filter(id => id !== districtId) }
    }
  }

  // Commune expand/collapse (Only one district expanded at a time)
  function toggleCommuneVisibility(districtId: number) {
    const next = new Set<number>()
    if (expandedDistricts.value.has(districtId)) {
      // Toggle off
    } else {
      next.add(districtId)
      fetchCommunes(districtId)
    }
    expandedDistricts.value = next
  }

  function toggleCommune(districtId: number, communeId: number) {
    const arr = communes.value[districtId] ?? []
    const idx = arr.indexOf(communeId)
    if (idx === -1) {
      communes.value = { ...communes.value, [districtId]: [...arr, communeId] }
    } else {
      delete villages.value[communeId]
      const next = new Set(expandedCommunes.value)
      next.delete(communeId)
      expandedCommunes.value = next
      communes.value = { ...communes.value, [districtId]: arr.filter(id => id !== communeId) }
    }
  }

  // Village expand/collapse (Only one commune expanded at a time)
  function toggleVillageVisibility(communeId: number) {
    const next = new Set<number>()
    if (expandedCommunes.value.has(communeId)) {
      // Toggle off
    } else {
      next.add(communeId)
      expandedCommunes.value = next
      fetchVillages(communeId)
    }
  }

  function toggleVillage(communeId: number, villageId: number) {
    const arr = villages.value[communeId] ?? []
    const idx = arr.indexOf(villageId)
    villages.value = {
      ...villages.value,
      [communeId]: idx === -1 ? [...arr, villageId] : arr.filter(id => id !== villageId)
    }
  }

  function initFromPayload(val: ProgrammeGeographicData | undefined) {
    provinceIds.value = val?.provinceIds ?? []
    districts.value = val?.districts ?? {}
    communes.value = val?.communes ?? {}
    villages.value = val?.villages ?? {}
    otherCountries.value = val?.otherCountries ?? ''
    // Reset expanded state so watchers don't re-trigger fetches on reload
    expandedProvinces.value = new Set()
    expandedDistricts.value = new Set()
    expandedCommunes.value = new Set()
  }

  function getData() {
    return section3Data.value
  }

  function reset() {
    provinceIds.value = []
    districts.value = {}
    communes.value = {}
    villages.value = {}
    otherCountries.value = ''
    districtsCache.value = {}
    communesCache.value = {}
    villagesCache.value = {}
    Object.keys(_districtsRaw).forEach(k => delete _districtsRaw[+k])
    Object.keys(_communesRaw).forEach(k => delete _communesRaw[+k])
    Object.keys(_villagesRaw).forEach(k => delete _villagesRaw[+k])
    loadingProvinces.value = false
    provincesError.value = null
    loadingDistricts.value = new Set()
    loadingCommunes.value = new Set()
    loadingVillages.value = new Set()
    expandedProvinces.value = new Set()
    expandedDistricts.value = new Set()
    expandedCommunes.value = new Set()
  }

  return {
    provinceIds,
    districts,
    communes,
    villages,
    otherCountries,
    section3Data,
    provinces,
    districtsCache,
    communesCache,
    villagesCache,
    loadingProvinces,
    provincesError,
    loadingDistricts,
    loadingCommunes,
    loadingVillages,
    expandedProvinces,
    expandedDistricts,
    expandedCommunes,
    provinceNameById,
    districtNameById,
    communeNameById,
    villageNameById,
    loadProvinces,
    fetchDistricts,
    fetchCommunes,
    fetchVillages,
    toggleProvince,
    toggleDistrictVisibility,
    toggleDistrict,
    toggleCommuneVisibility,
    toggleCommune,
    toggleVillageVisibility,
    toggleVillage,
    initFromPayload,
    getData,
    reset,
  }
})