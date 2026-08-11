import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { memberApi } from '@/api/member.api'
import { useProgrammeActivitiesStore } from './programmeActivities'
import { normaliseCategories, readCache, writeCache } from './taxonomyNormalise'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = shallowRef<any[]>([])
  const isLoading = ref(false)
  const error = ref('')
  const debugSummary = ref('')
  const openCategories = ref<Set<string>>(new Set())
  const openSubcategories = ref<Set<string>>(new Set())

  async function loadCategories(force = false) {
    if (categories.value.length && !force) return
    isLoading.value = true
    error.value = ''
    try {
      const cached = readCache()
      if (cached.length && !force) {
        categories.value = cached
        debugSummary.value = `Loaded ${cached.length} taxonomy categories from cache.`
        return
      }

      const response = await memberApi.getTaxonomyCategories({ force })
      const rawCategories = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : []
      const normalised = normaliseCategories(rawCategories)
      categories.value = normalised
      if (normalised.length) writeCache(normalised)
      else error.value = 'No activity taxonomy is available.'
      debugSummary.value = `Loaded ${normalised.length} taxonomy categories from API.`
    } catch (err) {
      console.error('Failed to load taxonomy categories:', err)
      const cached = readCache()
      categories.value = cached
      error.value = cached.length ? '' : 'Failed to load activity taxonomy.'
      debugSummary.value = cached.length
        ? `Loaded ${cached.length} taxonomy categories from cache after API failure.`
        : 'No cached taxonomy categories found after API failure.'
    } finally {
      isLoading.value = false
    }
  }

  function toggleCategory(code: string) {
    const activitiesStore = useProgrammeActivitiesStore()
    activitiesStore.clearError()
    if (openCategories.value.has(code)) {
      openCategories.value = new Set()
    } else {
      openCategories.value = new Set([code])
    }
  }

  function toggleSubcategory(code: string) {
    const activitiesStore = useProgrammeActivitiesStore()
    activitiesStore.clearError()
    if (openSubcategories.value.has(code)) {
      openSubcategories.value = new Set()
    } else {
      openSubcategories.value = new Set([code])
    }
  }

  function categoryCount(code: string): number {
    const activitiesStore = useProgrammeActivitiesStore()
    const cat = categories.value.find(c => c.code === code)
    if (!cat) return 0
    let count = 0
    cat.subcategories?.forEach((sub: any) => {
      sub.items?.forEach((i: any) => {
        if (activitiesStore.selected.includes(i.code)) {
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
    return sub.items?.filter((i: any) => activitiesStore.selected.includes(i.code)).length || 0
  }

  function reset() {
    openCategories.value = new Set()
    openSubcategories.value = new Set()
  }

  function openForCodes(codes: string[]) {
    const newCats = new Set(openCategories.value)
    const newSubs = new Set(openSubcategories.value)
    for (const cat of categories.value) {
      for (const sub of (cat.subcategories ?? [])) {
        for (const item of (sub.items ?? [])) {
          if (codes.includes(item.code)) {
            newCats.add(cat.code)
            newSubs.add(sub.code)
          }
        }
      }
    }
    openCategories.value = newCats
    openSubcategories.value = newSubs
  }

  return {
    categories,
    isLoading,
    error,
    debugSummary,
    openCategories,
    openSubcategories,
    loadCategories,
    toggleCategory,
    toggleSubcategory,
    categoryCount,
    subcategoryCount,
    reset,
    openForCodes,
  }
})
