import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import { memberApi } from '@/api/member.api'
import { useToast } from '@/utils/toast'
import { BUDGET_BANDS } from '@/constants/programme'
import { useProgrammeIdentityStore } from './programmeIdentity'
import { useProgrammeActivitiesStore } from './programmeActivities'
import { useProgrammeGeographyStore } from './programmeGeography'
import { useProgrammeAgreementsStore } from './programmeAgreements'
import { useProgrammeKeywordsStore } from './programmeKeywords'

export const useProgrammeFormStore = defineStore('programmeForm', () => {
  const toast = useToast()

  // --- Sub Stores ---
  const identityStore = useProgrammeIdentityStore()
  const activitiesStore = useProgrammeActivitiesStore()
  const geographyStore = useProgrammeGeographyStore()
  const agreementsStore = useProgrammeAgreementsStore()
  const keywordsStore = useProgrammeKeywordsStore()

  // Destructure sub-store references so they are reactive
  const { section1Data, section1Valid } = storeToRefs(identityStore)
  const { section2Data } = storeToRefs(activitiesStore)
  const { section3Data } = storeToRefs(geographyStore)
  const { section4Data } = storeToRefs(agreementsStore)
  const { keywordsData, keywordsError } = storeToRefs(keywordsStore)

  // --- State ---
  const currentStep = ref(1)
  const isSaving = ref(false)
  const errors = ref<Record<string, string[]>>({})
  const saveStatus = ref<'unsaved' | 'saving' | 'saved'>('unsaved')
  const completedSteps = computed(() => {
    const completed = new Set<number>()

    // Step 1: identity
    if (section1Data.value?.name?.trim() && section1Data.value?.startYear) {
      completed.add(1)
    }

    // Step 2: activities
    const selectedList = section2Data.value?.selected || []
    if (selectedList.length > 0) {
      completed.add(2)
    }

    // Step 3: geographic coverage
    const provincesList = section3Data.value?.provinceIds || []
    if (provincesList.length > 0 || section3Data.value?.otherCountries) {
      completed.add(3)
    }

    // Step 4: agreements
    const agreements = section4Data.value || []
    const isAgreementsValid = agreements.every((a: any) =>
      a.counterpart_agency?.trim() !== '' &&
      a.nature?.trim() !== '' &&
      a.status?.trim() !== '' &&
      a.institution_name?.trim() !== ''
    )
    if (isAgreementsValid && agreements.length > 0) {
      completed.add(4)
    }

    // Step 5: keywords
    if (keywordsData.value.length > 0) {
      completed.add(5)
    }

    return completed
  })
  const submissionResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)
  let resultTimer: ReturnType<typeof setTimeout> | null = null

  const dbIdToCodeMap = ref<Record<number, string>>({})
  const taxonomyMap = ref<Record<string, number>>({})

  // Element / form references
  const identityFormRef = ref<any>(null)
  const activitiesFormRef = ref<any>(null)
  const geographicFormRef = ref<any>(null)
  const agreementsFormRef = ref<any>(null)

  const steps = [
    { number: 1, title: 'Programme identity', subtitle: 'Name, dates, scale', shortTitle: 'Programme' },
    { number: 2, title: 'Activities', subtitle: 'Taxonomy B1–B9', shortTitle: 'Activities' },
    { number: 3, title: 'Geographic coverage', subtitle: 'Provinces & districts', shortTitle: 'Geographic' },
    { number: 4, title: 'Government agreements', subtitle: 'Counterparts & status', shortTitle: 'Agreements' },
    { number: 5, title: 'Keywords', subtitle: 'Up to 5 tags', shortTitle: 'Keywords' },
  ]

  // --- Getters ---
  const pageTitle = computed(() => section1Data.value?.name?.trim() || 'New programme entry')
  const progressPercent = computed(() => (currentStep.value / 5) * 100)

  const saveLabel = computed(() => {
    if (isSaving.value) return 'Saving…'
    if (saveStatus.value === 'saved') return 'Saved'
    return 'Not yet saved'
  })

  const currentStepTitle = computed(() => steps[currentStep.value - 1]?.title || '')
  
  const stepperProgressPercent = computed(() => ((currentStep.value - 1) / (steps.length - 1)) * 100)
  const stepWidthPercent = computed(() => 100 / steps.length)
  const isFinalStep = computed(() => currentStep.value === 5)

  const nextStepLabel = computed(() => {
    const next = steps[currentStep.value]
    return next ? `Continue: ${next.title.replace(/^\d+ · /, '')} →` : 'Finish →'
  })

  const backStepLabel = computed(() => {
    const prev = steps[currentStep.value - 2]
    return prev ? `← Back: ${prev.title.replace(/^\d+ · /, '')}` : ''
  })

  const continueButtonText = computed(() => {
    if (currentStep.value === 1) return 'Continue: Activities'
    if (currentStep.value === 2) return 'Continue: Geographic coverage'
    if (currentStep.value === 3) return 'Continue: Government agreements'
    if (currentStep.value === 4) return 'Continue: Keywords'
    return 'Finish & save'
  })

  const section1Progress = computed(() => {
    const d = section1Data.value
    const fields = [
      !!d.name,
      !!d.startYear,
      d.isOngoing || !!d.endYear,
      !!d.fteStaff,
      !!d.budgetBand,
      !!d.directBeneficiaries,
      !!d.indirectBeneficiaries,
      !!d.method,
      !!d.verifiedDate,
    ]
    return fields.filter(Boolean).length
  })

  const currentSectionProgress = computed(() => {
    if (currentStep.value === 1) {
      return { current: section1Progress.value, total: 9 }
    }
    if (currentStep.value === 5) {
      return { current: keywordsData.value.length, total: 5 }
    }
    return { current: 0, total: 0 }
  })

  // --- Helpers ---
  function clearSubmissionResult() {
    if (resultTimer) clearTimeout(resultTimer)
    submissionResult.value = null
  }

  function showSubmissionResult(type: 'success' | 'error', message: string) {
    clearSubmissionResult()
    submissionResult.value = { type, message }
    resultTimer = setTimeout(() => {
      submissionResult.value = null
    }, 5000)
  }

  function clearError(field: string) {
    if (errors.value[field]) {
      delete errors.value[field]
    }
  }

  function resetAll() {
    identityStore.reset()
    activitiesStore.reset()
    geographyStore.reset()
    agreementsStore.reset()
    keywordsStore.reset()
    currentStep.value = 1
    errors.value = {}
    saveStatus.value = 'unsaved'
    clearSubmissionResult()
  }

  // --- Actions ---
  async function initializeForm(entryId: string | null) {
    resetAll()
    try {
      const [cats, entryResult, geoResult] = await Promise.all([
        memberApi.getTaxonomyCategories(),
        entryId ? memberApi.getProgrammeEntry(entryId) : Promise.resolve(null),
        entryId ? memberApi.getGeography(entryId) : Promise.resolve(null),
      ])

      cats.forEach((cat: any) => {
        cat.subcategories?.forEach((sub: any) => {
          sub.items?.forEach((item: any) => {
            dbIdToCodeMap.value[item.id] = item.code
            taxonomyMap.value[item.code] = item.id
          })
        })
      })

      if (entryId && entryResult) {
        const entry = entryResult.data.data

        section1Data.value = {
          id: entry.id,
          name: entry.programme_name || '',
          startYear: entry.start_year || null,
          endYear: entry.end_year || null,
          isOngoing: !!entry.ongoing,
          fteStaff: entry.fte_staff ? parseFloat(entry.fte_staff) : null,
          budgetBand: (entry.budget_band_id
            ? BUDGET_BANDS[entry.budget_band_id - 1]
            : null) || null,
          directBeneficiaries: entry.direct_beneficiaries || null,
          indirectBeneficiaries: entry.indirect_beneficiaries || null,
          method: entry.method || '',
          verifiedDate: entry.verified_date || '',
          isUnverified: !!entry.is_unverified,
        }

        const selectedCodes = entry.activities?.map((a: any) => dbIdToCodeMap.value[a.activity_item_id] || a.code).filter(Boolean) || []
        const primaryCodes = entry.activities?.filter((a: any) => a.is_primary).map((a: any) => dbIdToCodeMap.value[a.activity_item_id] || a.code).filter(Boolean) || []

        const inclusionsMap: Record<string, any> = {}
        const educationLevelsMap: Record<string, number[]> = {}

        entry.activities?.forEach((a: any) => {
          const code = dbIdToCodeMap.value[a.activity_item_id] || a.code
          if (code) {
            inclusionsMap[code] = {
              hasInclusion: !!a.inclusion_group,
              dimensions: a.inclusion_group ? [{ group: a.inclusion_group, type: a.inclusion_type }] : []
            }
            educationLevelsMap[code] = a.activity_levels?.map((l: any) => l.education_level_id) || []
          }
        })

        section2Data.value = {
          selected: selectedCodes,
          primary: primaryCodes,
          aiText: '',
          inclusions: inclusionsMap,
          educationLevels: educationLevelsMap
        }

        const locationData = geoResult?.data?.data || entry.locations || []
        if (locationData.length) {
          const resProvinceIds: number[] = []
          const resDistricts: Record<number, number[]> = {}
          const resCommunes: Record<number, number[]> = {}
          const resVillages: Record<number, number[]> = {}
          const resOtherCountries: string[] = []
          locationData.forEach((loc: any) => {
            if (loc.country) {
              resOtherCountries.push(loc.country)
            } else if (loc.province_id) {
              if (!resProvinceIds.includes(loc.province_id)) {
                resProvinceIds.push(loc.province_id)
              }
              if (loc.district_id) {
                const distArray = resDistricts[loc.province_id] || []
                if (!distArray.includes(loc.district_id)) {
                  distArray.push(loc.district_id)
                }
                resDistricts[loc.province_id] = distArray
              }
              if (loc.commune_id) {
                const commArray = resCommunes[loc.district_id] || []
                if (!commArray.includes(loc.commune_id)) {
                  commArray.push(loc.commune_id)
                }
                resCommunes[loc.district_id] = commArray
              }
              if (loc.village_id) {
                const villArray = resVillages[loc.commune_id] || []
                if (!villArray.includes(loc.village_id)) {
                  villArray.push(loc.village_id)
                }
                resVillages[loc.commune_id] = villArray
              }
            }
          })
          section3Data.value = {
            provinceIds: resProvinceIds,
            districts: resDistricts,
            communes: resCommunes,
            villages: resVillages,
            otherCountries: resOtherCountries.join(', ')
          }
        } else {
          section3Data.value = { provinceIds: [], districts: {}, communes: {}, villages: {}, otherCountries: '' }
        }

        geographyStore.initFromPayload(section3Data.value)

        section4Data.value = entry.government_agreements || []

        if (entry.keywords?.length) {
          const keywordList = entry.keywords.map((k: any) => k.keyword).filter(Boolean)
          keywordsStore.initKeywords(keywordList)
        }

        saveStatus.value = 'saved'
      }
    } catch (err: any) {
      console.error('Failed to load entry data:', err)
      if (entryId) {
        toast.error('Failed to load the programme entry data.')
      }
    }

    if (!entryId) {
      const savedDraft = sessionStorage.getItem('new_programme_entry_draft')

      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          currentStep.value = draft.currentStep || 1
          section1Data.value = draft.section1Data
          section2Data.value = draft.section2Data
          section3Data.value = draft.section3Data || { provinceIds: [], districts: {}, communes: {}, villages: {}, otherCountries: '' }
          section4Data.value = draft.section4Data || []
          keywordsStore.initKeywords(draft.keywordsData || [])
          
          toast.success('Resumed from saved draft.')
        } catch {
          console.error('Failed to parse draft data')
        }
      }
    }
  }

  async function saveEntry(exitAfterSave: boolean, isSubmit = false, loadingAlreadySet = false): Promise<boolean> {
    if (isSaving.value && !loadingAlreadySet) return false
    if (!loadingAlreadySet) {
      isSaving.value = true
    }
    saveStatus.value = 'saving'
    errors.value = {}
    clearSubmissionResult()

    try {
      const isEditMode = !!section1Data.value.id

      const activitiesData = section2Data.value
      const agreementsData = section4Data.value

      const payload: any = {
        programme_name: section1Data.value.name,
        start_year: section1Data.value.startYear,
        end_year: section1Data.value.isOngoing ? null : section1Data.value.endYear,
        ongoing: section1Data.value.isOngoing,
        method: section1Data.value.method || null,
        verified_date: section1Data.value.verifiedDate || null,
        province_ids: section3Data.value.provinceIds,
        district_ids: section3Data.value.districts,
        other_countries: section3Data.value.otherCountries,
        is_submitted: isSubmit,
      }

      if (section1Data.value.fteStaff !== null && String(section1Data.value.fteStaff) !== '') {
        payload.fte_staff = Number(section1Data.value.fteStaff)
      }
      if (section1Data.value.budgetBand) {
        payload.budget_band_id = BUDGET_BANDS.indexOf(section1Data.value.budgetBand) + 1
      }
      if (section1Data.value.directBeneficiaries !== null && String(section1Data.value.directBeneficiaries) !== '') {
        payload.direct_beneficiaries = Number(section1Data.value.directBeneficiaries)
      }
      if (section1Data.value.indirectBeneficiaries !== null && String(section1Data.value.indirectBeneficiaries) !== '') {
        payload.indirect_beneficiaries = Number(section1Data.value.indirectBeneficiaries)
      }

      let response
      if (isEditMode) {
        response = await memberApi.updateProgrammeEntry(section1Data.value.id!, payload as any)
      } else {
        response = await memberApi.createProgrammeEntry(payload as any)
      }

      sessionStorage.removeItem('new_programme_entry_draft')
      saveStatus.value = 'saved'

      const savedId = response.data.data.id
      section1Data.value.id = savedId

      // 1. Agreements
      const mappedAgreements = agreementsData ? agreementsData.map((a: any) => ({
        id: a.id || null,
        counterpart_agency: a.counterpart_agency,
        nature: a.nature,
        status: a.status,
        institution_name: a.institution_name
      })) : []

      // 2. Geography
      const geographicData = section3Data.value
      const otherCountriesArray = (geographicData && geographicData.otherCountries)
        ? geographicData.otherCountries.split(',').map((c: string) => c.trim()).filter(Boolean)
        : []
      const provincesPayload = (geographicData && geographicData.provinceIds)
        ? geographicData.provinceIds.map((pId: number) => ({
            province_id: pId,
            district_ids: geographicData.districts[pId] || []
          }))
        : []
      const geographyPayload = {
        provinces: provincesPayload,
        communes: geographicData?.communes || {},
        villages: geographicData?.villages || {},
        other_countries: otherCountriesArray
      }

      // 3. Activities
      const mappedActivities = activitiesData ? activitiesData.selected
        .map((code: string) => {
          const dbId = taxonomyMap.value[code]
          if (!dbId) {
            console.warn(`[saveEntry] No taxonomy mapping found for code: ${code}, skipping`)
            return null
          }
          const levels = activitiesData.educationLevels?.[code] || []
          const inc = activitiesData.inclusions?.[code]

          const payloadAct: any = {
            activity_item_id: dbId,
            is_primary: activitiesData.primary.includes(code),
            education_level_ids: levels.length > 0 ? levels : [1],
            source: 'human_entered'
          }

          if (inc && inc.hasInclusion && inc.dimensions && inc.dimensions.length > 0) {
            const dim = inc.dimensions[0]
            if (dim) {
              payloadAct.inclusion_group = dim.group
              payloadAct.inclusion_type = dim.type
            }
          }

          return payloadAct
        })
        .filter(Boolean) : []

      const agreementsPromise = memberApi.saveGovernmentAgreements(savedId, mappedAgreements)
      const geographyPromise = memberApi.saveGeography(savedId, geographyPayload)
      const activitiesPromise = mappedActivities.length > 0
        ? memberApi.saveActivities(savedId, mappedActivities)
        : Promise.resolve(null)
      const keywordsList = keywordsData.value
      const keywordsPromise = keywordsList.length > 0
        ? memberApi.saveKeywords(savedId, keywordsList)
        : Promise.resolve(null)

      const [agreementsResponse, geographyResponse, activitiesResponse] = await Promise.all([
        agreementsPromise,
        geographyPromise,
        activitiesPromise,
        keywordsPromise,
      ])

      section4Data.value = agreementsResponse.data.data || []

      const resLocations = geographyResponse.data.data || []
      const resProvinceIds: number[] = []
      const resDistricts: Record<number, number[]> = {}
      const resCommunes: Record<number, number[]> = {}
      const resVillages: Record<number, number[]> = {}
      const resOtherCountries: string[] = []
      resLocations.forEach((loc: any) => {
        if (loc.country) {
          resOtherCountries.push(loc.country)
        } else if (loc.province_id) {
          if (!resProvinceIds.includes(loc.province_id)) {
            resProvinceIds.push(loc.province_id)
          }
          if (loc.district_id) {
            const distArray = resDistricts[loc.province_id] || []
            if (!distArray.includes(loc.district_id)) {
              distArray.push(loc.district_id)
            }
            resDistricts[loc.province_id] = distArray
          }
          if (loc.commune_id) {
            const commArray = resCommunes[loc.district_id] || []
            if (!commArray.includes(loc.commune_id)) {
              commArray.push(loc.commune_id)
            }
            resCommunes[loc.district_id] = commArray
          }
          if (loc.village_id) {
            const villArray = resVillages[loc.commune_id] || []
            if (!villArray.includes(loc.village_id)) {
              villArray.push(loc.village_id)
            }
            resVillages[loc.commune_id] = villArray
          }
        }
      })
      section3Data.value = {
        provinceIds: resProvinceIds,
        districts: resDistricts,
        communes: resCommunes,
        villages: resVillages,
        otherCountries: resOtherCountries.join(', ')
      }
      geographyStore.initFromPayload(section3Data.value)

      if (activitiesResponse) {
        const resActivities = activitiesResponse.data.data || []
        const resInclusions: Record<string, any> = {}
        const resLevels: Record<string, number[]> = {}
        
        resActivities.forEach((a: any) => {
          const code = dbIdToCodeMap.value[a.activity_item_id] || a.code
          if (code) {
            resInclusions[code] = {
              hasInclusion: !!a.inclusion_group,
              dimensions: a.inclusion_group ? [{ group: a.inclusion_group, type: a.inclusion_type }] : []
            }
            resLevels[code] = a.activity_levels?.map((l: any) => l.education_level_id) || []
          }
        })
        
        if (activitiesData) {
          section2Data.value = {
            selected: activitiesData.selected,
            primary: activitiesData.primary,
            aiText: activitiesData.aiText || '',
            inclusions: resInclusions,
            educationLevels: resLevels
          }
        }
      }

      const successMsg = response.data.message || 'Saved successfully!'
      showSubmissionResult('success', successMsg)
      toast.success(successMsg)

      const currentQuery = router.currentRoute.value.query
      await router.replace({ query: { ...currentQuery, id: String(savedId) } })

      if (exitAfterSave) {
        const destTab = isSubmit ? 'submitted' : 'draft'
        router.push(`/dashboard?tab=${destTab}`)
      }
      return true
    } catch (err: any) {
      if (err.response && err.response.status === 422) {
        const apiMessage = 'Please correct the validation errors below.'
        showSubmissionResult('error', apiMessage)
        if (exitAfterSave) {
          const destTab = isSubmit ? 'submitted' : 'draft'
          router.push(`/dashboard?tab=${destTab}`)
        } else {
          errors.value = err.response.data.errors
          toast.error(apiMessage)
        }
      } else {
        const apiMessage = err.response?.data?.message || 'An unexpected error occurred while saving.'
        showSubmissionResult('error', apiMessage)
        toast.error(apiMessage)
      }
      return false
    } finally {
      isSaving.value = false
    }
  }

  function saveDraftAndExit() {
    const draft = {
      currentStep: currentStep.value,
      section1Data: section1Data.value,
      section3Data: section3Data.value,
      section2Data: section2Data.value,
      section4Data: section4Data.value,
    }
    sessionStorage.setItem('new_programme_entry_draft', JSON.stringify(draft))
    toast.success('Progress saved to session.')
    router.push('/dashboard')
  }

  function syncRefsToStore() {
    if (currentStep.value === 2 && activitiesFormRef.value) {
      section2Data.value = activitiesFormRef.value.getData()
    } else if (currentStep.value === 3 && geographicFormRef.value) {
      section3Data.value = geographicFormRef.value.getData()
    } else if (currentStep.value === 4 && agreementsFormRef.value) {
      section4Data.value = agreementsFormRef.value.getData()
    }
  }


  function validateCurrentStep(): boolean {
    if (currentStep.value === 1) {
      const isValid = identityFormRef.value?.validate?.()
      if (!isValid) {
        toast.error('Please fix the errors in the form before continuing.')
        return false
      }
    }
    if (currentStep.value === 2) {
      const isValid = activitiesFormRef.value?.validate?.()
      if (!isValid) {
        toast.error('Please fix the errors in the form before continuing.')
        return false
      }
    }
    if (currentStep.value === 3) {
      const isValid = geographicFormRef.value?.validate?.()
      if (!isValid) {
        toast.error('Please fix the errors in the form before continuing.')
        return false
      }
    }
    if (currentStep.value === 4) {
      const isValid = agreementsFormRef.value?.validate?.()
      if (isValid === false) {
        toast.error('Please select a counterpart and specify the institution details for all agreement rows.')
        return false
      }
    }
    return true
  }

  async function saveAndExit(isSubmit = false, loadingAlreadySet = false): Promise<boolean> {
    syncRefsToStore()

      if (isSubmit) {
        const requiredSteps = new Set([1, 2, 3, 5])
        const missing = [...requiredSteps].filter(s => !completedSteps.value.has(s))
        if (missing.length > 0) {
          toast.error('Complete steps 1, 2, 3, and 5 before submitting. Step 4 (Agreements) is optional.')
          return false
        }

      if (keywordsError.value) {
        toast.error('Please remove duplicate keywords before saving.')
        return false
      }
    } else {
      if (!section1Data.value.name?.trim() || !section1Data.value.startYear) {
        toast.error('Please complete Step 1 (Programme name and Start year) before saving.')
        return false
      }
    }
    return await saveEntry(true, isSubmit, loadingAlreadySet)
  }

  function goBack() {
    syncRefsToStore()
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  function goToStep(stepNumber: number) {
    syncRefsToStore()
    currentStep.value = stepNumber
    return true
  }

  async function advanceStep() {
    if (!validateCurrentStep()) {
      return
    }
    syncRefsToStore()

    const draft = {
      currentStep: currentStep.value + 1,
      section1Data: section1Data.value,
      section2Data: section2Data.value,
      section3Data: section3Data.value,
      section4Data: section4Data.value,
      keywordsData: keywordsData.value,
    }
    sessionStorage.setItem('new_programme_entry_draft', JSON.stringify(draft))

    if (currentStep.value < 5) {
      currentStep.value++
    }
  }

  async function continueToNext() {
    if (isFinalStep.value) {
      await saveAndExit(true)
    } else {
      await advanceStep()
    }
  }

  return {
    // state
    currentStep,
    isSaving,
    errors,
    saveStatus,
    completedSteps,
    submissionResult,
    section1Data,
    section2Data,
    section3Data,
    section4Data,
    keywordsData,
    keywordsError,
    dbIdToCodeMap,
    taxonomyMap,
    steps,
    identityFormRef,
    activitiesFormRef,
    geographicFormRef,
    agreementsFormRef,
    // computed
    pageTitle,
    progressPercent,
    saveLabel,
    section1Valid,
    currentStepTitle,
    stepperProgressPercent,
    stepWidthPercent,
    isFinalStep,
    nextStepLabel,
    backStepLabel,
    continueButtonText,
    currentSectionProgress,
    // actions
    initializeForm,
    saveEntry,
    saveDraftAndExit,
    saveAndExit,
    goBack,
    goToStep,
    advanceStep,
    continueToNext,
    clearError,
    clearSubmissionResult,
    resetAll,
  }
})
