import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ActivityInclusion, InclusionGroup } from '@/types/taxonomy'
import * as InclusionHelpers from '@/utils/inclusionHelpers'

export const useProgrammeActivitiesStore = defineStore('programmeActivities', () => {
  // State
  const aiText = ref('')
  const selected = ref<Set<string>>(new Set())
  const primary = ref<Set<string>>(new Set())
  const inclusions = ref<Record<string, ActivityInclusion>>({})
  const educationLevels = ref<Record<string, number[]>>({})
  const collapsedItems = ref<Set<string>>(new Set())
  const showError = ref(false)
  const section2Data = ref<any>({
    selected: [],
    primary: [],
    aiText: '',
    inclusions: {},
    educationLevels: {}
  })

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


  function initFromPayload(val: any) {
    selected.value = new Set()
    primary.value = new Set()
    aiText.value = ''
    inclusions.value = {}
    educationLevels.value = {}
    collapsedItems.value = new Set()

    if (val) {
      let nextInclusions: Record<string, any> = {}
      let nextEdLevels: Record<string, any> = {}
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
        nextInclusions = { ...val.inclusions }
      }
      if (val.educationLevels && typeof val.educationLevels === 'object') {
        nextEdLevels = { ...val.educationLevels }
      }
      selected.value.forEach(code => {
        if (!nextInclusions[code]) {
          nextInclusions[code] = { hasInclusion: false, dimensions: [] }
        }
        if (!nextEdLevels[code]) {
          nextEdLevels[code] = []
        }
      })
      inclusions.value = nextInclusions
      educationLevels.value = nextEdLevels
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



  function toggleItem(code: string) {
    const nextSelected = new Set(selected.value)
    const nextPrimary = new Set(primary.value)
    const nextCollapsed = new Set(collapsedItems.value)

    if (nextSelected.has(code)) {
      nextSelected.delete(code)
      nextPrimary.delete(code)

      const nextInclusions = { ...inclusions.value }
      delete nextInclusions[code]
      inclusions.value = nextInclusions

      const nextEdLevels = { ...educationLevels.value }
      delete nextEdLevels[code]
      educationLevels.value = nextEdLevels

      nextCollapsed.delete(code)
    } else {
      nextSelected.add(code)

      inclusions.value = {
        ...inclusions.value,
        [code]: { hasInclusion: false, dimensions: [] }
      }

      educationLevels.value = {
        ...educationLevels.value,
        [code]: []
      }

      // Collapse all other items, only expand this one
      for (const otherCode of nextSelected) {
        nextCollapsed.add(otherCode)
      }
      nextCollapsed.delete(code)
    }

    selected.value = nextSelected
    primary.value = nextPrimary
    collapsedItems.value = nextCollapsed
  }

  function toggleItemCollapse(code: string) {
    const nextCollapsed = new Set(collapsedItems.value)
    if (nextCollapsed.has(code)) {
      // Expanding it -> collapse all other items first
      for (const otherCode of selected.value) {
        nextCollapsed.add(otherCode)
      }
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

  function setEducationLevels(code: string, levels: number[]) {
    educationLevels.value = {
      ...educationLevels.value,
      [code]: levels
    }
  }

  return {
    aiText,
    selected,
    primary,
    inclusions,
    educationLevels,
    collapsedItems,
    showError,
    section2Data,
    initFromPayload,
    isGroupSelected,
    getGroupType,
    getGroupOtherText,
    toggleGroupSelection,
    setGroupType,
    setGroupOtherText,
    updateInclusionToggle,
    toggleItem,
    toggleItemCollapse,
    setActivityImportance,
    suggestActivities,
    validate,
    getData,
    reset,
    setEducationLevels,
  }
})
