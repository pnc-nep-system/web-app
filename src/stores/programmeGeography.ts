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
  const section3Data = ref<ProgrammeGeographicData>({
    provinceIds: [],
    districts: {},
    communes: {},
    villages: {},
    otherCountries: '',
  })

  // Caches
  const provinces = shallowRef<Province[]>([])
  const districtsCache = shallowRef<Record<number, District[]>>({})
  const communesCache = shallowRef<Record<number, Commune[]>>({})
  const villagesCache = shallowRef<Record<number, Village[]>>({})

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

  async function loadProvinces() {
    if (provinces.value.length > 0) return
    loadingProvinces.value = true
    provincesError.value = null
    try {
      const res = await memberApi.getProvinces()
      provinces.value = res.data.data
    } catch {
      provincesError.value = 'Failed to load provinces. Please try again.'
    } finally {
      loadingProvinces.value = false
    }
  }

  async function fetchDistricts(provinceId: number) {
    if (districtsCache.value[provinceId] || loadingDistricts.value.has(provinceId)) return
    loadingDistricts.value = new Set([...loadingDistricts.value, provinceId])
    try {
      const res = await memberApi.getDistricts(provinceId)
      districtsCache.value = { ...districtsCache.value, [provinceId]: res.data.data }
    } catch {
      // silently fail
    } finally {
      const next = new Set(loadingDistricts.value)
      next.delete(provinceId)
      loadingDistricts.value = next
    }
  }

  async function fetchCommunes(districtId: number) {
    if (communesCache.value[districtId] || loadingCommunes.value.has(districtId)) return
    loadingCommunes.value = new Set([...loadingCommunes.value, districtId])
    try {
      const res = await memberApi.getCommunes(districtId)
      communesCache.value = { ...communesCache.value, [districtId]: res.data.data }
    } catch {
      // silently fail
    } finally {
      const next = new Set(loadingCommunes.value)
      next.delete(districtId)
      loadingCommunes.value = next
    }
  }

  async function fetchVillages(communeId: number) {
    if (villagesCache.value[communeId] || loadingVillages.value.has(communeId)) return
    loadingVillages.value = new Set([...loadingVillages.value, communeId])
    try {
      const res = await memberApi.getVillages(communeId)
      villagesCache.value = { ...villagesCache.value, [communeId]: res.data.data }
    } catch {
      // silently fail
    } finally {
      const next = new Set(loadingVillages.value)
      next.delete(communeId)
      loadingVillages.value = next
    }
  }

  function toggleProvince(provinceId: number) {
    const idx = provinceIds.value.indexOf(provinceId)
    if (idx === -1) {
      provinceIds.value.push(provinceId)
      // Auto-expand the newly selected province and collapse others
      toggleDistrictVisibility(provinceId)
    } else {
      provinceIds.value.splice(idx, 1)
      // Clear all nested data under this province
      const districtIds = districts.value[provinceId] || []
      districtIds.forEach(did => {
        const communeIds = communes.value[did] || []
        communeIds.forEach(cid => {
          delete villages.value[cid]
        })
        delete communes.value[did]
      })
      delete districts.value[provinceId]
      // Collapse if it was expanded
      if (expandedProvinces.value.has(provinceId)) {
        expandedProvinces.value.delete(provinceId)
      }
    }
    updateSection3Data()
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
    if (!districts.value[provinceId]) {
      districts.value[provinceId] = []
    }
    const arr = districts.value[provinceId]
    const idx = arr.indexOf(districtId)
    if (idx === -1) {
      arr.push(districtId)
      // Auto-expand district to show communes and collapse others
      toggleCommuneVisibility(districtId)
    } else {
      arr.splice(idx, 1)
      // Clear nested communes and villages under this district
      const communeIds = communes.value[districtId] || []
      communeIds.forEach(cid => delete villages.value[cid])
      delete communes.value[districtId]
      if (expandedDistricts.value.has(districtId)) {
        expandedDistricts.value.delete(districtId)
      }
    }
    updateSection3Data()
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
    if (!communes.value[districtId]) {
      communes.value[districtId] = []
    }
    const arr = communes.value[districtId]
    const idx = arr.indexOf(communeId)
    if (idx === -1) {
      arr.push(communeId)
      // Auto-expand commune to show villages and collapse others
      toggleVillageVisibility(communeId)
    } else {
      arr.splice(idx, 1)
      delete villages.value[communeId]
      if (expandedCommunes.value.has(communeId)) {
        expandedCommunes.value.delete(communeId)
      }
    }
    updateSection3Data()
  }

  // Village expand/collapse (Only one commune expanded at a time)
  function toggleVillageVisibility(communeId: number) {
    const next = new Set<number>()
    if (expandedCommunes.value.has(communeId)) {
      // Toggle off
    } else {
      next.add(communeId)
      fetchVillages(communeId)
    }
    expandedCommunes.value = next
  }

  function toggleVillage(communeId: number, villageId: number) {
    if (!villages.value[communeId]) {
      villages.value[communeId] = []
    }
    const arr = villages.value[communeId]
    const idx = arr.indexOf(villageId)
    if (idx === -1) {
      arr.push(villageId)
    } else {
      arr.splice(idx, 1)
    }
    updateSection3Data()
  }

  function initFromPayload(val: ProgrammeGeographicData | undefined) {
    provinceIds.value = val?.provinceIds ?? []
    districts.value = val?.districts ?? {}
    communes.value = val?.communes ?? {}
    villages.value = val?.villages ?? {}
    otherCountries.value = val?.otherCountries ?? ''
    updateSection3Data()
  }

  function updateSection3Data() {
    section3Data.value = {
      provinceIds: [...provinceIds.value],
      districts: JSON.parse(JSON.stringify(districts.value)),
      communes: JSON.parse(JSON.stringify(communes.value)),
      villages: JSON.parse(JSON.stringify(villages.value)),
      otherCountries: otherCountries.value,
    }
  }

  function getData() {
    updateSection3Data()
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
    loadingProvinces.value = false
    provincesError.value = null
    loadingDistricts.value = new Set()
    loadingCommunes.value = new Set()
    loadingVillages.value = new Set()
    expandedProvinces.value = new Set()
    expandedDistricts.value = new Set()
    expandedCommunes.value = new Set()
    updateSection3Data()
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
    updateSection3Data,
    getData,
    reset,
  }
})
