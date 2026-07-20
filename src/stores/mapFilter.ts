import { defineStore } from 'pinia'
import { reactive, computed, ref, watch } from 'vue'
import { refdataApi } from '@/api/refdata.api'
import { useProgrammeGeographyStore } from '@/stores/programmeGeography'
import { useTaxonomyStore } from '@/stores/taxonomy'
import { GROUPS_CONFIG } from '@/constants/taxonomy'
import type { RefdataEducationLevel } from '@/types/map'

export const useMapFilterStore = defineStore('mapFilter', () => {
  const geography = useProgrammeGeographyStore()
  const taxonomy = useTaxonomyStore()

  const filters = reactive({
    category_id: null as number | null,
    subcategory_id: null as number | null,
    item_id: null as number | null,
    education_level_id: null as number | null,
    inclusion_group: '',
    inclusion_type: '',
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
    filters.subcategory_id = null
    filters.item_id = null
    filters.education_level_id = null
    filters.inclusion_group = ''
    filters.inclusion_type = ''
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
    if (filters.subcategory_id) count++
    if (filters.item_id) count++
    if (filters.education_level_id) count++
    if (filters.inclusion_group) count++
    if (filters.inclusion_type) count++
    if (filters.province_id) count++
    if (filters.district_id) count++
    if (filters.commune_id) count++
    if (filters.agreement_counterpart_type) count++
    if (filters.keyword) count++
    if (filters.organisation_name) count++
    return count
  })

  const hasActiveFilters = computed(() => activeFilterCount.value > 0)

  const activeCategories = computed(() => {
    return taxonomy.categories.filter(c => c.status === 'active')
  })

  const inclusionAllowsA = computed(() => {
    const groupName = filters.inclusion_group
    if (!groupName) return true
    const group = GROUPS_CONFIG.find(g => g.name === groupName)
    return group ? group.allowsA : true
  })

  const availableSubcategories = computed(() => {
    const id = filters.category_id
    if (!id) return []
    const cat = taxonomy.categories.find(c => c.id === id)
    return cat ? cat.subcategories.filter(s => s.status === 'active') : []
  })

  const availableItems = computed(() => {
    const id = filters.subcategory_id
    if (!id) return []
    for (const cat of taxonomy.categories) {
      const subcat = cat.subcategories.find(s => s.id === id)
      if (subcat) return subcat.items.filter(i => i.status === 'active')
    }
    return []
  })

  const availableDistricts = computed(() => {
    const id = filters.province_id
    return id ? geography.districtsCache[id] || [] : []
  })

  const availableCommunes = computed(() => {
    const id = filters.district_id
    return id ? geography.communesCache[id] || [] : []
  })

  watch(() => filters.category_id, () => {
    filters.subcategory_id = null
    filters.item_id = null
  })

  watch(() => filters.subcategory_id, () => {
    filters.item_id = null
  })

  watch(() => filters.inclusion_group, () => {
    filters.inclusion_type = ''
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
    taxonomy,
    educationLevels,
    educationLevelsLoading,
    counterpartAgencies,
    counterpartAgenciesLoading,
    fetchRefdata,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
    activeCategories,
    inclusionAllowsA,
    availableSubcategories,
    availableItems,
    availableDistricts,
    availableCommunes,
  }
})
