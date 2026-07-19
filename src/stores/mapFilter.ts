import { defineStore } from 'pinia'
import { reactive, computed, ref, watch } from 'vue'
import { refdataApi } from '@/api/refdata.api'
import { useProgrammeGeographyStore } from '@/stores/programmeGeography'
import type { RefdataEducationLevel } from '@/types/map'

export const useMapFilterStore = defineStore('mapFilter', () => {
  const geography = useProgrammeGeographyStore()

  const filters = reactive({
    category_id: null as number | null,
    education_level_id: null as number | null,
    inclusion_group: '',
    province_id: null as number | null,
    district_id: null as number | null,
    commune_id: null as number | null,
    agreement_counterpart_type: '',
    keyword: '',
    organisation_name: '',
  })

  const educationLevels = ref<RefdataEducationLevel[]>([])
  const educationLevelsLoading = ref(false)
  const counterpartAgencies = ref<string[]>([])
  const counterpartAgenciesLoading = ref(false)

  async function fetchRefdata() {
    educationLevelsLoading.value = true
    counterpartAgenciesLoading.value = true
    try {
      const [levelsRes, agenciesRes] = await Promise.all([
        refdataApi.getEducationLevels(),
        refdataApi.getCounterpartAgencies(),
      ])
      educationLevels.value = levelsRes.data.data
      counterpartAgencies.value = agenciesRes.data.data
    } finally {
      educationLevelsLoading.value = false
      counterpartAgenciesLoading.value = false
    }
  }

  function clearFilters() {
    filters.category_id = null
    filters.education_level_id = null
    filters.inclusion_group = ''
    filters.province_id = null
    filters.district_id = null
    filters.commune_id = null
    filters.agreement_counterpart_type = ''
    filters.keyword = ''
    filters.organisation_name = ''
  }

  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.category_id) count++
    if (filters.education_level_id) count++
    if (filters.inclusion_group) count++
    if (filters.province_id) count++
    if (filters.district_id) count++
    if (filters.commune_id) count++
    if (filters.agreement_counterpart_type) count++
    if (filters.keyword) count++
    if (filters.organisation_name) count++
    return count
  })

  const hasActiveFilters = computed(() => activeFilterCount.value > 0)

  const availableDistricts = computed(() => {
    const id = filters.province_id
    return id ? geography.districtsCache[id] || [] : []
  })

  const availableCommunes = computed(() => {
    const id = filters.district_id
    return id ? geography.communesCache[id] || [] : []
  })

  watch(() => filters.province_id, (id) => {
    filters.district_id = null
    filters.commune_id = null
    if (id) geography.fetchDistricts(id)
  })

  watch(() => filters.district_id, (id) => {
    filters.commune_id = null
    if (id) geography.fetchCommunes(id)
  })

  return {
    filters,
    educationLevels,
    educationLevelsLoading,
    counterpartAgencies,
    counterpartAgenciesLoading,
    fetchRefdata,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
    availableDistricts,
    availableCommunes,
  }
})
