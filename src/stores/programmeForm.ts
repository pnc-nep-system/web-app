import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import { memberApi } from '@/api/member.api'
import { useToast } from '@/utils/toast'
import { BUDGET_BANDS } from '@/constants/programme'
import { useCategoriesStore } from './categories'
import { useTaxonomyStore } from './taxonomy'
import { useAuthStore } from './auth'
import { useEntriesStore } from './entries.store'
import { useMapStore } from './map'
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
  const isInitializing = ref(false)
  const errors = ref<Record<string, string[]>>({})
  const saveStatus = ref<'unsaved' | 'saving' | 'saved'>('unsaved')
  const completedSteps = computed(() => {
    const completed = new Set<number>()

    // Step 1: identity
    if (identityStore.isSection1Complete) {
      completed.add(1)
    }

    // Step 2: activities
    const hasActivities = (activitiesStore.selected && activitiesStore.selected.length > 0) ||
                          ((section2Data.value?.selected || []).length > 0)
    if (hasActivities) {
      completed.add(2)
    }

    // Step 3: geographic coverage
    const hasGeography = (geographyStore.section3Data?.provinceIds || []).length > 0 ||
                         (section3Data.value?.provinceIds || []).length > 0 ||
                         !!geographyStore.section3Data?.otherCountries ||
                         !!section3Data.value?.otherCountries
    if (hasGeography) {
      completed.add(3)
    }

    // Step 4: agreements
    const agreementsList = agreementsStore.section4Data || section4Data.value || []
    if (agreementsList.length > 0) {
      completed.add(4)
    }

    // Step 5: keywords
    const keywordsList = keywordsStore.keywordsData || keywordsData.value || []
    if (keywordsList.length > 0) {
      completed.add(5)
    }

    return completed
  })
  const submissionResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)
  let resultTimer: ReturnType<typeof setTimeout> | null = null

  const dbIdToCodeMap = ref<Record<number, string>>({})
  const taxonomyMap = ref<Record<string, number>>({})

  function formatUserFriendlyError(rawMsg: string): string {
    if (!rawMsg) return 'Please review your selections and try saving again.'
    const lower = rawMsg.toLowerCase()
    if (lower.includes('timeout') || lower.includes('econnaborted') || lower.includes('exceeded')) {
      return 'The request timed out. Please try saving again.'
    }
    return rawMsg
      .replace(/activities\.\d+\.education_level_ids(?:\.\d+)?/g, 'education levels')
      .replace(/activities\.\d+\.[\w.-]+/g, 'activity details')
      .replace(/provinces\.\d+\.[\w.-]+/g, 'geographic location')
  }

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
  const isSection2Complete = computed(() => {
    return (section2Data.value?.selected || []).length > 0 || (activitiesStore.selected && activitiesStore.selected.length > 0)
  })

  const isSection3Complete = computed(() => {
    return (section3Data.value?.provinceIds || []).length > 0 || !!section3Data.value?.otherCountries
  })

  const isSection5Complete = computed(() => {
    return keywordsData.value.length > 0
  })

  const hasCompletedAllRequired = computed(() => {
    return (
      !!identityStore.isSection1Complete &&
      isSection2Complete.value &&
      isSection3Complete.value &&
      isSection5Complete.value
    )
  })

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
    return hasCompletedAllRequired.value ? 'Finish & save' : 'Save draft & exit'
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

  let _initPromise: Promise<void> | null = null
  let _initId: string | null = null

  async function initializeForm(entryId: string | null) {
    if (_initPromise && _initId === entryId) {
      return _initPromise
    }

    _initId = entryId
    _initPromise = (async () => {
      isInitializing.value = true
      resetAll()
      try {
        const catsStore = useCategoriesStore()
        await catsStore.loadCategories()
        const cats = catsStore.categories

        const [entryResult, geoResult] = await Promise.all([
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
        const entry = entryResult.data.data || entryResult.data

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

        const getActivityCode = (a: any): string => {
          if (!a) return ''
          if (a.code) return a.code
          if (a.activity_item?.code) return a.activity_item.code
          if (a.activityItem?.code) return a.activityItem.code
          const itemId = a.activity_item_id ?? a.activityItemId
          if (itemId !== undefined && itemId !== null) {
            if (dbIdToCodeMap.value[itemId]) return dbIdToCodeMap.value[itemId]
            if (dbIdToCodeMap.value[Number(itemId)]) return dbIdToCodeMap.value[Number(itemId)]
            if (dbIdToCodeMap.value[String(itemId)]) return dbIdToCodeMap.value[String(itemId)]
          }
          return ''
        }

        const selectedCodes = Array.from(new Set((entry.activities?.map((a: any) => getActivityCode(a)).filter(Boolean) || []) as string[]))
        const primaryCodes = Array.from(new Set((entry.activities?.filter((a: any) => a.is_primary || a.primary).map((a: any) => getActivityCode(a)).filter(Boolean) || []) as string[]))

        const inclusionsMap: Record<string, any> = {}
        const educationLevelsMap: Record<string, number[]> = {}

        entry.activities?.forEach((a: any) => {
          const code = getActivityCode(a)
          if (code) {
            inclusionsMap[code] = {
              hasInclusion: !!a.inclusion_group,
              dimensions: a.inclusion_group ? [{ group: a.inclusion_group, type: a.inclusion_type }] : []
            }
            const rawL = (a.activity_levels?.map((l: any) => Number(l.education_level_id)) || []) as number[]
            educationLevelsMap[code] = Array.from(new Set(rawL)).filter((n: number) => !isNaN(n) && n > 0)
          }
        })

        section2Data.value = {
          selected: selectedCodes,
          primary: primaryCodes,
          aiText: '',
          inclusions: inclusionsMap,
          educationLevels: educationLevelsMap
        }
        activitiesStore.initFromPayload(section2Data.value)

        let tempSection3Data = { provinceIds: [] as number[], districts: {} as Record<number, number[]>, communes: {} as Record<number, number[]>, villages: {} as Record<number, number[]>, otherCountries: '' }

        const locationData = geoResult?.data?.data || (Array.isArray(geoResult?.data) ? geoResult.data : null) || entry.locations || []
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
          tempSection3Data = {
            provinceIds: resProvinceIds,
            districts: resDistricts,
            communes: resCommunes,
            villages: resVillages,
            otherCountries: resOtherCountries.join(', ')
          }
        }

        geographyStore.initFromPayload(tempSection3Data)

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
          activitiesStore.initFromPayload(draft.section2Data)
          geographyStore.initFromPayload(draft.section3Data || { provinceIds: [], districts: {}, communes: {}, villages: {}, otherCountries: '' })
          section4Data.value = draft.section4Data || []
          keywordsStore.initKeywords(draft.keywordsData || [])
          
          toast.success('Resumed from saved draft.')
        } catch {
          console.error('Failed to parse draft data')
        }
      }
    }
    })()

    try {
      await _initPromise
    } finally {
      isInitializing.value = false
      if (_initId === entryId) {
        _initPromise = null
      }
    }
  }

  let _isSavingRoute = false
  let _onSaveRouteUpdate: (() => void) | null = null

  function onSaveRouteUpdate(cb: () => void) {
    _onSaveRouteUpdate = cb
  }

  function getCreateOrgId() {
    return router.currentRoute.value.query.org_id
  }

  function shouldCreateAsDraft(isSubmit: boolean): boolean {
    return isSubmit && !section1Data.value.id && !!getCreateOrgId()
  }

  async function ensureTaxonomyMaps() {
    const catsStore = useCategoriesStore()
    if (!catsStore.categories.length) {
      await catsStore.loadCategories()
    }
    const taxStore = useTaxonomyStore()
    if (!taxStore.categories.length) {
      await taxStore.fetchTaxonomy()
    }

    const allCats = [...(catsStore.categories || []), ...(taxStore.categories || [])]
    allCats.forEach((cat: any) => {
      const subcats = cat.subcategories || cat.subCategories || cat.sub_categories || []
      subcats.forEach((sub: any) => {
        const items = sub.items || sub.taxonomy_items || sub.taxonomyItems || []
        items.forEach((item: any) => {
          if (item.id && item.code) {
            dbIdToCodeMap.value[item.id] = item.code
            dbIdToCodeMap.value[Number(item.id)] = item.code
            taxonomyMap.value[item.code] = item.id
          }
        })
      })
    })
  }

  async function saveEntry(exitAfterSave: boolean, isSubmit = false, loadingAlreadySet = false): Promise<boolean> {
    if (isSaving.value && !loadingAlreadySet) return false
    if (!loadingAlreadySet) {
      isSaving.value = true
    }
    saveStatus.value = 'saving'
    errors.value = {}
    clearSubmissionResult()
    const shouldSubmit = isSubmit && !shouldCreateAsDraft(isSubmit)

    try {
      await ensureTaxonomyMaps()
      const isEditMode = !!section1Data.value.id
      let orgId = getCreateOrgId()
      const authStore = useAuthStore() as any
      if (!orgId && ['nep_admin', 'nep_coordinator'].includes(authStore.userRole || '')) {
        if (!section1Data.value.id) {
          toast.error('Please select a member organisation before creating an entry.')
          isSaving.value = false
          return false
        }
      }

      const activitiesData = section2Data.value
      const agreementsData = section4Data.value

      const payload: any = {
        programme_name: section1Data.value.name,
        start_year: section1Data.value.startYear,
        end_year: section1Data.value.isOngoing ? null : section1Data.value.endYear,
        ongoing: section1Data.value.isOngoing,
        method: section1Data.value.method || null,
        verified_date: section1Data.value.verifiedDate || null,
        is_submitted: shouldSubmit,
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
        response = await memberApi.createProgrammeEntry(payload as any, orgId ? String(orgId) : undefined)
      }

      sessionStorage.removeItem('new_programme_entry_draft')
      saveStatus.value = 'saved'

      const savedId = response.data?.data?.id ?? response.data?.id
      if (!savedId) {
        throw new Error('Failed to retrieve programme entry ID after save.')
      }
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
      const rawOtherCountries = geographicData?.otherCountries
      const otherCountriesArray = typeof rawOtherCountries === 'string'
        ? rawOtherCountries.split(',').map((s: string) => s.trim()).filter(Boolean)
        : (Array.isArray(rawOtherCountries) ? rawOtherCountries : [])
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

      // 3. Activities — combine store & section2Data with Set deduplication
      const selectedSet = new Set<string>([
        ...(activitiesData?.selected || []),
        ...(activitiesStore.selected || [])
      ])
      const primarySet = new Set<string>([
        ...(activitiesData?.primary || []),
        ...(activitiesStore.primary || [])
      ])
      const selectedArray = Array.from(selectedSet)
      const primaryArray = Array.from(primarySet)

      const mappedActivities = selectedArray
        .map((code: string) => {
          let dbId = taxonomyMap.value[code]
          if (!dbId) {
            const catsStore = useCategoriesStore()
            const taxStore = useTaxonomyStore()
            const allCats = [...(catsStore.categories || []), ...(taxStore.categories || [])]
            for (const cat of allCats) {
              const subcats = cat.subcategories || cat.subCategories || cat.sub_categories || []
              for (const sub of subcats) {
                const items = sub.items || sub.taxonomy_items || sub.taxonomyItems || []
                for (const item of items) {
                  if (item.code === code && item.id) {
                    dbId = item.id
                    taxonomyMap.value[code] = item.id
                    break
                  }
                }
              }
            }
          }
          if (!dbId) {
            console.warn(`[saveEntry] No taxonomy mapping found for code: ${code}, skipping`)
            return null
          }
          const rawLevels = (activitiesStore.educationLevels?.[code] || activitiesData?.educationLevels?.[code] || section2Data.value?.educationLevels?.[code] || []) as any[]
          const levelNumbers = rawLevels.map(v => parseInt(String(v), 10)).filter((n: number) => !isNaN(n) && n >= 1 && n <= 5)
          const finalLevels = Array.from(new Set(levelNumbers))
          const validLevelsPayload = finalLevels.length > 0 ? finalLevels : [1]
          const inc = activitiesData?.inclusions?.[code] || activitiesStore.inclusions?.[code] || section2Data.value?.inclusions?.[code]

          const payloadAct: any = {
            activity_item_id: dbId,
            is_primary: primaryArray.includes(code),
            education_level_ids: validLevelsPayload,
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
        .filter(Boolean)

      const seenItemIds = new Set<number>()
      const uniqueMappedActivities = mappedActivities.filter((act: any) => {
        if (!act || !act.activity_item_id) return false
        if (seenItemIds.has(act.activity_item_id)) return false
        seenItemIds.add(act.activity_item_id)

        const rawIds = Array.isArray(act.education_level_ids) ? act.education_level_ids : [1]
        const cleanIds = Array.from(new Set(rawIds.map((v: any) => parseInt(String(v), 10)).filter((n: number) => !isNaN(n) && n >= 1 && n <= 5)))
        act.education_level_ids = cleanIds.length > 0 ? cleanIds : [1]
        return true
      })

      const agreementsPromise = memberApi.saveGovernmentAgreements(savedId, mappedAgreements)
      const geographyPromise = memberApi.saveGeography(savedId, geographyPayload)
      const activitiesPromise = memberApi.saveActivities(savedId, uniqueMappedActivities)
      const keywordsList = (keywordsData.value || []).map(k => typeof k === 'string' ? k.trim() : '').filter(Boolean)
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
      const tempSection3Data = {
        provinceIds: resProvinceIds,
        districts: resDistricts,
        communes: resCommunes,
        villages: resVillages,
        otherCountries: resOtherCountries.join(', ')
      }
      geographyStore.initFromPayload(tempSection3Data)

      if (activitiesResponse) {
        const resActivities = activitiesResponse.data.data || []
        const resInclusions: Record<string, any> = {}
        const resLevels: Record<string, number[]> = {}
        
        resActivities.forEach((a: any) => {
          const code = a.code || a.activity_item?.code || a.activityItem?.code || dbIdToCodeMap.value[a.activity_item_id] || dbIdToCodeMap.value[a.activityItemId]
          if (code) {
            resInclusions[code] = {
              hasInclusion: !!a.inclusion_group,
              dimensions: a.inclusion_group ? [{ group: a.inclusion_group, type: a.inclusion_type }] : []
            }
            const rawL = (a.activity_levels?.map((l: any) => Number(l.education_level_id)) || []) as number[]
            resLevels[code] = Array.from(new Set(rawL)).filter((n: any) => typeof n === 'number' && !isNaN(n) && n > 0)
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
          activitiesStore.initFromPayload(section2Data.value)
        }
      }

      const successMsg = response.data.message || 'Saved successfully!'
      showSubmissionResult('success', successMsg)
      toast.success(successMsg)

      const currentQuery = router.currentRoute.value.query
      const currentId = currentQuery.id ? String(currentQuery.id) : null
      if (currentId !== String(savedId)) {
        _onSaveRouteUpdate?.()
        await router.replace({ query: { ...currentQuery, id: String(savedId) } })
      }

      const mapStore = useMapStore()
      mapStore.fetchMapEntries()

      if (exitAfterSave) {
        const authStore = useAuthStore() as any
        const role = authStore.userRole || ''
        if (['nep_admin', 'nep_coordinator'].includes(role)) {
          router.push('/admin/programmes?tab=my-drafts')
        } else {
          const destTab = shouldSubmit ? 'submitted' : 'draft'
          router.push(`/dashboard?tab=${destTab}`)
        }
      }
      return true
    } catch (err: any) {
      console.error('[saveEntry] Save failed:', err)
      const serverMessage = err.response?.data?.message || err?.message
      if (err.response && err.response.status === 422) {
        const firstErrorField = err.response.data?.errors ? Object.values(err.response.data.errors)[0] : null
        const firstErrorMsg = Array.isArray(firstErrorField) ? firstErrorField[0] : firstErrorField
        const rawApiMessage = firstErrorMsg || serverMessage || 'Please correct the validation errors below.'
        const friendlyMessage = formatUserFriendlyError(rawApiMessage)
        toast.error(friendlyMessage)
        errors.value = err.response.data?.errors || {}
      } else {
        const rawApiMessage = serverMessage || 'An unexpected error occurred while saving.'
        const friendlyMessage = formatUserFriendlyError(rawApiMessage)
        toast.error(friendlyMessage)
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
    if (activitiesFormRef.value) {
      section2Data.value = activitiesFormRef.value.getData()
    } else if (activitiesStore.selected && activitiesStore.selected.length > 0) {
      section2Data.value = activitiesStore.getData()
    }

    if (agreementsFormRef.value) {
      section4Data.value = agreementsFormRef.value.getData()
    } else if (agreementsStore.section4Data && agreementsStore.section4Data.length > 0) {
      section4Data.value = agreementsStore.getData()
    }

    if (geographyStore.section3Data) {
      section3Data.value = geographyStore.getData()
    }

    if (keywordsStore.keywordsData && keywordsStore.keywordsData.length > 0) {
      keywordsData.value = keywordsStore.keywordsData
    }
  }


  function validateCurrentStep(): boolean {
    if (currentStep.value === 1) {
      const isValid = identityFormRef.value?.validate?.()
      if (!isValid) {
        return false
      }
    } else if (currentStep.value === 2) {
      const isValid = activitiesFormRef.value?.validate?.()
      if (!isValid) {
        return false
      }
    } else if (currentStep.value === 4) {
      const isValid = agreementsFormRef.value?.validate?.()
      if (!isValid) {
        return false
      }
    }
    return true
  }

  async function saveAndExit(isSubmit = false, loadingAlreadySet = false): Promise<boolean> {
    syncRefsToStore()
    const shouldSubmit = isSubmit && !shouldCreateAsDraft(isSubmit)

      if (shouldSubmit) {
        const requiredSteps = new Set([1, 2, 3, 5])
        const missing = [...requiredSteps].filter(s => !completedSteps.value.has(s))
        if (missing.length > 0) {
          toast.error("Please complete steps 1, 2, 3, and 5 to submit. If you're not ready, you can save your draft and exit by clicking 'Save & exit' in the top right corner.")
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
    return await saveEntry(true, shouldSubmit, loadingAlreadySet)
  }

  function goBack() {
    syncRefsToStore()
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  function goToStep(stepNumber: number) {
    if (stepNumber > 1) {
      const isValid = identityFormRef.value ? identityFormRef.value.validate() : identityStore.validate()
      if (!isValid) {
        currentStep.value = 1
        return false
      }
    }

    if (stepNumber === 5 && currentStep.value === 4) {
      const isValid = agreementsFormRef.value ? agreementsFormRef.value.validate() : agreementsStore.validate()
      if (!isValid) {
        return false
      }
    }

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
      if (hasCompletedAllRequired.value) {
        await saveAndExit(true)
      } else {
        await saveAndExit(false)
      }
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
    isInitializing,
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
    hasCompletedAllRequired,
    onSaveRouteUpdate,
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
    initializeForm,
  }
})
