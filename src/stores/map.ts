import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MapFilters } from '@/api/map.api'

export const useMapStore = defineStore('map', () => {
  const filters = ref<MapFilters>({
    category_id: null,
    subcategory_id: null,
    item_id: null,
    province_id: null,
    district_id: null,
    commune_id: null,
    keyword: null,
  })

  function resetFilters() {
    filters.value = {
      category_id: null,
      subcategory_id: null,
      item_id: null,
      province_id: null,
      district_id: null,
      commune_id: null,
      keyword: null,
    }
  }

  return {
    filters,
    resetFilters,
  }
})
