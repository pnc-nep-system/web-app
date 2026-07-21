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

  let autoHideTimer: ReturnType<typeof setTimeout> | null = null

  function clearError() {
    showError.value = false
    errorMessage.value = ''
    if (autoHideTimer) {
      clearTimeout(autoHideTimer)
      autoHideTimer = null
    }
  }

  function triggerError(msg: string) {
    errorMessage.value = msg
    showError.value = true
    if (autoHideTimer) clearTimeout(autoHideTimer)
    autoHideTimer = setTimeout(() => {
      clearError()
    }, 4000)
  }

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
    clearError()
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
      const cleaned: Record<string, number[]> = {}
      for (const [code, levels] of Object.entries(val.educationLevels)) {
        if (Array.isArray(levels)) {
          cleaned[code] = Array.from(new Set(levels.map(Number))).filter(n => !isNaN(n) && n > 0)
        } else {
          cleaned[code] = []
        }
      }
      nextEdLevels = cleaned
    }

    selected.value.forEach(code => {
      if (!nextInclusions[code]) {
        nextInclusions[code] = { hasInclusion: false, dimensions: [] }
      }
      if (!nextEdLevels[code] || nextEdLevels[code].length === 0) {
        nextEdLevels[code] = [1]
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
    clearError()
    inclusions.value = InclusionHelpers.toggleGroupSelection(inclusions.value, itemCode, groupName)
  }

  const setGroupType = (itemCode: string, groupName: InclusionGroup, type: 'A' | 'B') => {
    clearError()
    inclusions.value = InclusionHelpers.setGroupType(inclusions.value, itemCode, groupName, type)
  }

  const setGroupOtherText = (itemCode: string, otherText: string) => {
    clearError()
    inclusions.value = InclusionHelpers.setGroupOtherText(inclusions.value, itemCode, otherText)
  }

  const updateInclusionToggle = (itemCode: string, hasInclusion: boolean) => {
    clearError()
    inclusions.value = InclusionHelpers.updateInclusionToggle(inclusions.value, itemCode, hasInclusion)
  }

  function toggleItem(code: string) {
    clearError()
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
      if (!primary.value.includes(code)) {
        primary.value = [...primary.value, code]
      }

      if (!inclusions.value[code]) {
        inclusions.value = {
          ...inclusions.value,
          [code]: { hasInclusion: false, dimensions: [] }
        }
      }
      if (!educationLevels.value[code] || educationLevels.value[code].length === 0) {
        educationLevels.value = {
          ...educationLevels.value,
          [code]: [1]
        }
      }
      collapsedItems.value = collapsedItems.value.filter(c => c !== code)
    }
  }

  function toggleItemCollapse(code: string) {
    clearError()
    if (collapsedItems.value.includes(code)) {
      collapsedItems.value = collapsedItems.value.filter(c => c !== code)
    } else {
      collapsedItems.value = [...collapsedItems.value, code]
    }
  }

  function setActivityImportance(code: string, importance: 'primary' | 'secondary') {
    clearError()
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

  const errorMessage = ref('')

  function validate(): boolean {
    clearError()

    // 1. At least one activity must be selected
    if (selected.value.length === 0) {
      triggerError('Please select at least one activity before continuing.')
      return false
    }

    // 2. Ensure every selected activity has a default education level
    for (const code of selected.value) {
      const levels = educationLevels.value[code] || []
      if (levels.length === 0) {
        educationLevels.value = {
          ...educationLevels.value,
          [code]: [1]
        }
      }
    }

    // 3. Inclusion sub-fields must be complete when toggled on
    for (const code of selected.value) {
      const inc = inclusions.value[code]
      if (inc && inc.hasInclusion) {
        const dims = inc.dimensions || []
        if (dims.length === 0) {
          triggerError(`Please select an inclusion dimension for activity ${code}.`)
          return false
        }
        for (const dim of dims) {
          if (!dim.group || !dim.type) {
            triggerError(`Please select the inclusion category and type for activity ${code}.`)
            return false
          }
          if ((dim.group as string) === 'other' && !dim.otherText?.trim()) {
            triggerError(`Please specify the inclusion detail for activity ${code}.`)
            return false
          }
        }
      }
    }

    clearError()
    return true
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
    const cleanLevels = Array.from(new Set((levels || []).map(Number))).filter(n => !isNaN(n) && n > 0)
    educationLevels.value = {
      ...educationLevels.value,
      [code]: cleanLevels
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
    errorMessage,
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
    clearError,
  }
})
