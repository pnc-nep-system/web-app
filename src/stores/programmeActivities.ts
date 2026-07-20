import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ActivityInclusion, InclusionGroup } from '@/types/taxonomy'
import * as InclusionHelpers from '@/utils/inclusionHelpers'

export const useProgrammeActivitiesStore = defineStore('programmeActivities', () => {
  // State
  const aiText = ref('')
  const selected = ref<string[]>([])
  const primary = ref<string[]>([])
  const inclusions = ref<Record<string, ActivityInclusion>>({})
  const educationLevels = ref<Record<string, number[]>>({})
  const collapsedItems = ref<string[]>([])
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
    if (!val) return

    selected.value = Array.isArray(val.selected) ? [...val.selected] : []
    primary.value = Array.isArray(val.primary) ? [...val.primary] : []
    aiText.value = typeof val.aiText === 'string' ? val.aiText : ''

    let nextInclusions: Record<string, any> = {}
    let nextEdLevels: Record<string, any> = {}

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
    const isSelected = selected.value.includes(code)
    if (isSelected) {
      selected.value = selected.value.filter(c => c !== code)
      primary.value = primary.value.filter(c => c !== code)
      collapsedItems.value = collapsedItems.value.filter(c => c !== code)

      const nextInclusions = { ...inclusions.value }
      delete nextInclusions[code]
      inclusions.value = nextInclusions

      const nextEdLevels = { ...educationLevels.value }
      delete nextEdLevels[code]
      educationLevels.value = nextEdLevels
    } else {
      selected.value = [...selected.value, code]

      if (!inclusions.value[code]) {
        inclusions.value = {
          ...inclusions.value,
          [code]: { hasInclusion: false, dimensions: [] }
        }
      }
      if (!educationLevels.value[code]) {
        educationLevels.value = {
          ...educationLevels.value,
          [code]: []
        }
      }
      collapsedItems.value = collapsedItems.value.filter(c => c !== code)
    }
  }

  function toggleItemCollapse(code: string) {
    if (collapsedItems.value.includes(code)) {
      collapsedItems.value = collapsedItems.value.filter(c => c !== code)
    } else {
      collapsedItems.value = [...collapsedItems.value, code]
    }
  }

  function setActivityImportance(code: string, importance: 'primary' | 'secondary') {
    if (!selected.value.includes(code)) return
    if (importance === 'primary') {
      if (!primary.value.includes(code)) {
        primary.value = [...primary.value, code]
      }
    } else {
      primary.value = primary.value.filter(c => c !== code)
    }
  }

  function suggestActivities() {
    // Placeholder
  }

  function validate(): boolean {
    const isValid = selected.value.length > 0
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
    selected.value = []
    primary.value = []
    aiText.value = ''
    inclusions.value = {}
    educationLevels.value = {}
    collapsedItems.value = []
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
