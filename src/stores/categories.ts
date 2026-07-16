import { defineStore } from 'pinia'
import { ref } from 'vue'
import { memberApi } from '@/api/member.api'
import { useProgrammeActivitiesStore } from './programmeActivities'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<any[]>([])
  const isLoading = ref(false)
  const openCategories = ref<Set<string>>(new Set())
  const openSubcategories = ref<Set<string>>(new Set())

  async function loadCategories() {
    if (categories.value.length > 0) return
    isLoading.value = true
    try {
      const response = await memberApi.getTaxonomyCategories()
      categories.value = response || []
    } catch (err) {
      console.error('Failed to load taxonomy categories:', err)
    } finally {
      isLoading.value = false
    }
  }

  function toggleCategory(code: string) {
    if (openCategories.value.has(code)) {
      openCategories.value.delete(code)
    } else {
      openCategories.value.add(code)
    }
  }

  function toggleSubcategory(code: string) {
    if (openSubcategories.value.has(code)) {
      openSubcategories.value.delete(code)
    } else {
      openSubcategories.value.add(code)
    }
  }

  function categoryCount(code: string): number {
    const activitiesStore = useProgrammeActivitiesStore()
    const cat = categories.value.find(c => c.code === code)
    if (!cat) return 0
    let count = 0
    cat.subcategories?.forEach((sub: any) => {
      sub.items?.forEach((i: any) => {
        if (activitiesStore.selected.has(i.code)) {
          count++
        }
      })
    })
    return count
  }

  function subcategoryCount(code: string): number {
    const activitiesStore = useProgrammeActivitiesStore()
    let sub: any = null
    for (const cat of categories.value) {
      const found = cat.subcategories?.find((s: any) => s.code === code)
      if (found) {
        sub = found
        break
      }
    }
    if (!sub) return 0
    return sub.items?.filter((i: any) => activitiesStore.selected.has(i.code)).length || 0
  }

  function reset() {
    openCategories.value = new Set()
    openSubcategories.value = new Set()
  }

  return {
    categories,
    isLoading,
    openCategories,
    openSubcategories,
    loadCategories,
    toggleCategory,
    toggleSubcategory,
    categoryCount,
    subcategoryCount,
    reset
  }
})
