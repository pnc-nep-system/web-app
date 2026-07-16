import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { memberApi } from '@/api/member.api'
import type { ProgrammeGeographicData, Province, District } from '@/types/programme'

export const useProgrammeGeographyStore = defineStore('programmeGeography', () => {
  // State
  const provinceIds = ref<number[]>([])
  const districts = ref<Record<number, number[]>>({})
  const otherCountries = ref('')
  const section3Data = ref<ProgrammeGeographicData>({
    provinceIds: [],
    districts: {},
    otherCountries: '',
  })

  const provinces = ref<Province[]>([])
  const districtsCache = ref<Record<number, District[]>>({})
  const loadingProvinces = ref(false)
  const provincesError = ref<string | null>(null)
  const loadingDistricts = ref<Set<number>>(new Set())
  const expandedProvinces = ref<Set<number>>(new Set())

  // Computed
  const provinceNameById = computed(() => {
    const map: Record<number, string> = {}
    for (const p of provinces.value) {
      map[p.id] = p.province_name
    }
    return map
  })

  // Actions
  async function loadProvinces() {
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
      // Silently fail
    } finally {
      const next = new Set(loadingDistricts.value)
      next.delete(provinceId)
      loadingDistricts.value = next
    }
  }

  function toggleProvince(provinceId: number) {
    const idx = provinceIds.value.indexOf(provinceId)
    if (idx === -1) {
      provinceIds.value.push(provinceId)
    } else {
      provinceIds.value.splice(idx, 1)
      delete districts.value[provinceId]
    }
    updateSection3Data()
  }

  function toggleDistrictVisibility(provinceId: number) {
    const next = new Set(expandedProvinces.value)
    if (next.has(provinceId)) {
      next.delete(provinceId)
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
    if (arr) {
      const idx = arr.indexOf(districtId)
      if (idx === -1) {
        arr.push(districtId)
      } else {
        arr.splice(idx, 1)
      }
    }
    updateSection3Data()
  }

  function initFromPayload(val: ProgrammeGeographicData | undefined) {
    provinceIds.value = val?.provinceIds ?? []
    districts.value = val?.districts ?? {}
    otherCountries.value = val?.otherCountries ?? ''
    updateSection3Data()
  }

  function updateSection3Data() {
    section3Data.value = {
      provinceIds: [...provinceIds.value],
      districts: JSON.parse(JSON.stringify(districts.value)),
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
    otherCountries.value = ''
    districtsCache.value = {}
    loadingProvinces.value = false
    provincesError.value = null
    loadingDistricts.value = new Set()
    expandedProvinces.value = new Set()
    updateSection3Data()
  }

  return {
    provinceIds,
    districts,
    otherCountries,
    section3Data,
    provinces,
    districtsCache,
    loadingProvinces,
    provincesError,
    loadingDistricts,
    expandedProvinces,
    provinceNameById,
    loadProvinces,
    fetchDistricts,
    toggleProvince,
    toggleDistrictVisibility,
    toggleDistrict,
    initFromPayload,
    updateSection3Data,
    getData,
    reset,
  }
})
