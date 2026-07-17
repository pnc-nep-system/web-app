import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'

export const useMapFilterStore = defineStore('mapFilter', () => {
  const filters = reactive({
    category: '',
    level: '',
    inclusion: '',
    province: '',
    counterpart: '',
    status: '',
    budget: '',
    keyword: '',
    orgName: '',
  })

  function clearFilters() {
    filters.category = ''
    filters.level = ''
    filters.inclusion = ''
    filters.province = ''
    filters.counterpart = ''
    filters.status = ''
    filters.budget = ''
    filters.keyword = ''
    filters.orgName = ''
  }

  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.category) count++
    if (filters.level) count++
    if (filters.inclusion) count++
    if (filters.province) count++
    if (filters.counterpart) count++
    if (filters.status) count++
    if (filters.budget) count++
    if (filters.keyword) count++
    if (filters.orgName) count++
    return count
  })

  const hasActiveFilters = computed(() => activeFilterCount.value > 0)

  return { filters, clearFilters, activeFilterCount, hasActiveFilters }
})
