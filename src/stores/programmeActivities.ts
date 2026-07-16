import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ActivityInclusion, InclusionGroup } from '@/types/taxonomy'
import { memberApi } from '@/api/member.api'
import * as InclusionHelpers from '@/utils/inclusionHelpers'

export const useProgrammeActivitiesStore = defineStore('programmeActivities', () => {
  // State
  const aiText = ref('')
  const openCategories = ref<Set<string>>(new Set())
  const openSubcategories = ref<Set<string>>(new Set())
  const selected = ref<Set<string>>(new Set())
  const primary = ref<Set<string>>(new Set())
  const inclusions = ref<Record<string, ActivityInclusion>>({})
  const educationLevels = ref<Record<string, number[]>>({})
  const categories = ref<any[]>([])
  const isLoading = ref(true)
  const collapsedItems = ref<Set<string>>(new Set())
  const showError = ref(false)
  const section2Data = ref<any>(undefined)

  watch([selected, primary, aiText, inclusions, educationLevels], () => {
    section2Data.value = {
      selected: [...selected.value],
      primary: [...primary.value],
      aiText: aiText.value,
      inclusions: inclusions.value,
      educationLevels: educationLevels.value
    }
  }, { deep: true })

  // Actions
  async function loadCategories() {
    isLoading.value = true
    try {
      categories.value = await memberApi.getTaxonomyCategories()
    } catch (err) {
      console.error('Failed to load categories', err)
    } finally {
      isLoading.value = false
    }
  }

  function initFromPayload(val: any) {
    selected.value = new Set()
    primary.value = new Set()
    aiText.value = ''
    inclusions.value = {}
    educationLevels.value = {}
    collapsedItems.value = new Set()

    if (val) {
      if (Array.isArray(val.selected)) {
        selected.value = new Set(val.selected)
      }
      if (Array.isArray(val.primary)) {
        primary.value = new Set(val.primary)
      }
      if (typeof val.aiText === 'string') {
        aiText.value = val.aiText
      }
      if (val.inclusions && typeof val.inclusions === 'object') {
        inclusions.value = { ...val.inclusions }
      }
      if (val.educationLevels && typeof val.educationLevels === 'object') {
        educationLevels.value = { ...val.educationLevels }
      }
      selected.value.forEach(code => {
        if (!inclusions.value[code]) {
          inclusions.value[code] = { hasInclusion: false, dimensions: [] }
        }
        if (!educationLevels.value[code]) {
          educationLevels.value[code] = []
        }
      })
    }
  }

  const isGroupSelected = (itemCode: string, groupName: InclusionGroup): boolean => {
    return InclusionHelpers.isGroupSelected(inclusions.value, itemCode, groupName)
  }

  const getGroupType = (itemCode: string, groupName: InclusionGroup): 'A' | 'B' => {
    return InclusionHelpers.getGroupType(inclusions.value, itemCode, groupName)
  }

  const getGroupOtherText = (itemCode: string): string => {
    return InclusionHelpers.getGroupOtherText(inclusions.value, itemCode)
  }

  const toggleGroupSelection = (itemCode: string, groupName: InclusionGroup) => {
    inclusions.value = InclusionHelpers.toggleGroupSelection(inclusions.value, itemCode, groupName)
  }

  const setGroupType = (itemCode: string, groupName: InclusionGroup, type: 'A' | 'B') => {
    inclusions.value = InclusionHelpers.setGroupType(inclusions.value, itemCode, groupName, type)
  }

  const setGroupOtherText = (itemCode: string, otherText: string) => {
    inclusions.value = InclusionHelpers.setGroupOtherText(inclusions.value, itemCode, otherText)
  }

  const updateInclusionToggle = (itemCode: string, hasInclusion: boolean) => {
    inclusions.value = InclusionHelpers.updateInclusionToggle(inclusions.value, itemCode, hasInclusion)
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

  function toggleItem(code: string) {
    const nextSelected = new Set(selected.value)
    const nextPrimary = new Set(primary.value)
    const nextCollapsed = new Set(collapsedItems.value)
    
    if (nextSelected.has(code)) {
      nextSelected.delete(code)
      nextPrimary.delete(code)
      delete inclusions.value[code]
      delete educationLevels.value[code]
      nextCollapsed.delete(code)
    } else {
      nextSelected.add(code)
      inclusions.value[code] = { hasInclusion: false, dimensions: [] }
      educationLevels.value[code] = []
      nextCollapsed.delete(code)
    }
    
    selected.value = nextSelected
    primary.value = nextPrimary
    collapsedItems.value = nextCollapsed
  }

  function toggleItemCollapse(code: string) {
    const nextCollapsed = new Set(collapsedItems.value)
    if (nextCollapsed.has(code)) {
      nextCollapsed.delete(code)
    } else {
      nextCollapsed.add(code)
    }
    collapsedItems.value = nextCollapsed
  }

  function setActivityImportance(code: string, importance: 'primary' | 'secondary') {
    if (!selected.value.has(code)) return
    const nextPrimary = new Set(primary.value)
    if (importance === 'primary') {
      nextPrimary.add(code)
    } else {
      nextPrimary.delete(code)
    }
    primary.value = nextPrimary
  }

  function categoryCount(code: string): number {
    const cat = categories.value.find(c => c.code === code)
    if (!cat) return 0
    let count = 0
    cat.subcategories?.forEach((sub: any) => {
      sub.items?.forEach((i: any) => {
        if (selected.value.has(i.code)) {
          count++
        }
      })
    })
    return count
  }

  function subcategoryCount(code: string): number {
    let sub: any = null
    for (const cat of categories.value) {
      const found = cat.subcategories?.find((s: any) => s.code === code)
      if (found) {
        sub = found
        break
      }
    }
    if (!sub) return 0
    return sub.items?.filter((i: any) => selected.value.has(i.code)).length || 0
  }

  function suggestActivities() {
    // Placeholder
  }

  function validate(): boolean {
    const isValid = selected.value.size > 0
    showError.value = !isValid
    return isValid
  }

  function getData() {
    return {
      selected: [...selected.value],
      primary: [...primary.value],
      aiText: aiText.value,
      inclusions: inclusions.value,
      educationLevels: educationLevels.value
    }
  }

  function reset() {
    selected.value = new Set()
    primary.value = new Set()
    aiText.value = ''
    inclusions.value = {}
    educationLevels.value = {}
    collapsedItems.value = new Set()
    showError.value = false
  }

  return {
    aiText,
    openCategories,
    openSubcategories,
    selected,
    primary,
    inclusions,
    educationLevels,
    categories,
    isLoading,
    collapsedItems,
    showError,
    section2Data,
    loadCategories,
    initFromPayload,
    isGroupSelected,
    getGroupType,
    getGroupOtherText,
    toggleGroupSelection,
    setGroupType,
    setGroupOtherText,
    updateInclusionToggle,
    toggleCategory,
    toggleSubcategory,
    toggleItem,
    toggleItemCollapse,
    setActivityImportance,
    categoryCount,
    subcategoryCount,
    suggestActivities,
    validate,
    getData,
    reset,
  }
})
