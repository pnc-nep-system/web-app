import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ActivityInclusion, InclusionGroup } from '@/types/taxonomy'
import * as InclusionHelpers from '@/utils/inclusionHelpers'
import { memberApi } from '@/api/member.api'
import { useCategoriesStore } from './categories'

export const useProgrammeActivitiesStore = defineStore('programmeActivities', () => {
  // State — all declared upfront so functions below can reference them safely
  const aiText = ref('')
  const pendingFile = ref<File | null>(null)
  const selected = ref<string[]>([])
  const primary = ref<string[]>([])
  const inclusions = ref<Record<string, ActivityInclusion>>({})
  const educationLevels = ref<Record<string, number[]>>({})
  const collapsedItems = ref<string[]>([])
  const showError = ref(false)
  const errorMessage = ref('')
  const isSuggesting = ref(false)
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
    autoHideTimer = setTimeout(() => { clearError() }, 4000)
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
      if (!nextInclusions[code]) nextInclusions[code] = { hasInclusion: false, dimensions: [] }
      if (!nextEdLevels[code] || nextEdLevels[code].length === 0) nextEdLevels[code] = [1]
    })
    inclusions.value = nextInclusions
    educationLevels.value = nextEdLevels
  }

  const isGroupSelected = (itemCode: string, groupName: InclusionGroup): boolean =>
    InclusionHelpers.isGroupSelected(inclusions.value, itemCode, groupName)

  const getGroupType = (itemCode: string, groupName: InclusionGroup): 'A' | 'B' =>
    InclusionHelpers.getGroupType(inclusions.value, itemCode, groupName)

  const getGroupOtherText = (itemCode: string): string =>
    InclusionHelpers.getGroupOtherText(inclusions.value, itemCode)

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
      if (!primary.value.includes(code)) primary.value = [...primary.value, code]
      if (!inclusions.value[code]) inclusions.value = { ...inclusions.value, [code]: { hasInclusion: false, dimensions: [] } }
      if (!educationLevels.value[code] || educationLevels.value[code].length === 0) {
        educationLevels.value = { ...educationLevels.value, [code]: [1] }
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
      if (!primary.value.includes(code)) primary.value = [...primary.value, code]
    } else {
      primary.value = primary.value.filter(c => c !== code)
    }
  }

  async function suggestActivities() {
    const text = aiText.value.trim()
    const hasFile = !!pendingFile.value

    if (!hasFile && text.length < 10) {
      triggerError('Please enter a programme description (at least 10 characters) before suggesting activities.')
      return
    }
    isSuggesting.value = true
    clearError()
    try {
      let res
      if (hasFile) {
        const formData = new FormData()
        formData.append('file', pendingFile.value!)
        res = await memberApi.suggestActivitiesWithFile(formData)
        pendingFile.value = null
      } else {
        res = await memberApi.suggestActivities(text)
      }
      const codes: string[] = res.data?.data ?? []
      const suggestions: Record<string, { education_levels?: number[]; inclusion?: { hasInclusion: boolean; dimensions: { group: string; type?: 'A' | 'B' }[] } }> = res.data?.suggestions ?? {}

      if (!codes.length) {
        triggerError('No matching activities found. Try adding more detail to your description.')
        return
      }

      codes.forEach(code => {
        if (!selected.value.includes(code)) {
          selected.value = [...selected.value, code]
          if (!primary.value.includes(code)) primary.value = [...primary.value, code]
        }
        // Always initialise defaults first if missing
        if (!inclusions.value[code]) inclusions.value = { ...inclusions.value, [code]: { hasInclusion: false, dimensions: [] } }
        if (!educationLevels.value[code]?.length) educationLevels.value = { ...educationLevels.value, [code]: [1] }

        // Always apply AI suggestions (overwrite defaults)
        const suggestion = suggestions[code]
        if (suggestion) {
          if (suggestion.education_levels?.length) {
            educationLevels.value = { ...educationLevels.value, [code]: suggestion.education_levels }
          }
          if (suggestion.inclusion) {
            inclusions.value = { ...inclusions.value, [code]: suggestion.inclusion as ActivityInclusion }
          }
        }
      })

      const catsStore = useCategoriesStore()
      catsStore.openForCodes(codes)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'AI suggestion failed. Please try again.'
      triggerError(msg)
    } finally {
      isSuggesting.value = false
    }
  }

  function validate(): boolean {
    clearError()

    if (selected.value.length === 0) {
      triggerError('Please select at least one activity before continuing.')
      return false
    }

    for (const code of selected.value) {
      const levels = educationLevels.value[code] || []
      if (levels.length === 0) {
        educationLevels.value = { ...educationLevels.value, [code]: [1] }
      }
    }

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
    pendingFile.value = null
    inclusions.value = {}
    educationLevels.value = {}
    collapsedItems.value = []
    showError.value = false
  }

  function setEducationLevels(code: string, levels: number[]) {
    const cleanLevels = Array.from(new Set((levels || []).map(Number))).filter(n => !isNaN(n) && n > 0)
    educationLevels.value = { ...educationLevels.value, [code]: cleanLevels }
  }

  return {
    aiText,
    pendingFile,
    selected,
    primary,
    inclusions,
    educationLevels,
    collapsedItems,
    showError,
    errorMessage,
    isSuggesting,
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
    triggerError,
  }
})
