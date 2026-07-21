import { computed, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEntriesStore } from '@/stores/entries.store'
import { useOrganisationsStore } from '@/stores/organisations'
import { useTaxonomyStore } from '@/stores/taxonomy'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/utils/toast'
import type { EntryDetail, ActivityRow } from '@/types/entryDetail'

export function useEntryDetail(id: Ref<string | undefined>) {
  const router = useRouter()
  const entries = useEntriesStore()
  const organisations = useOrganisationsStore()
  const taxonomy = useTaxonomyStore()
  const auth = useAuthStore()
  const toast = useToast()

  const entry = ref<EntryDetail | null>(null)
  const marking = ref(false)

  watch(id, async (newId) => {
    if (!newId) { entry.value = null; return }
    entry.value = await entries.fetchById(newId)
  }, { immediate: true })

  const status = computed(() => entry.value ? (entry.value.isUnverified ? 'unverified' : 'verified') : null)

  const activityRows = computed<ActivityRow[]>(() => {
    if (!entry.value) return []
    return entry.value.activities.map((a) => ({
      ...a,
      item: taxonomy.itemByCode(a.code) ?? null
    }))
  })

  const relatedEntries = computed(() => {
    if (!entry.value) return []
    const myProvinces = new Set(entry.value.provinces)
    const myCategories = new Set(entry.value.activities.map((a) => a.code.split('.')[0]))
    return entries.items
      .filter((e: any) => e.id !== entry.value!.id)
      .filter((e: any) => (
        (e.provinces ?? []).some((p: any) => myProvinces.has(p))
        && (e.activities ?? []).some((a: any) => myCategories.has(a.code.split('.')[0]))
      ))
      .slice(0, 3)
  })

  async function markVerified() {
    marking.value = true
    await entries.markVerified(entry.value!.id)
    marking.value = false
    toast.success('Entry marked as verified')
  }

  function analyseInAdviser() {
    router.push({ name: 'adviser' })
  }

  return {
    entry,
    marking,
    status,
    activityRows,
    relatedEntries,
    markVerified,
    analyseInAdviser,
    organisations,
    auth,
  }
}
