import { defineStore } from 'pinia'
import { ref } from 'vue'
import { memberApi } from '@/api/member.api'
import type { ProgrammeIdentity } from '@/types/programme'

export const useEntriesStore = defineStore('entries', () => {
  const items = ref<ProgrammeIdentity[]>([])
  const loading = ref(false)

  async function fetchEntries(organisationId: number | string) {
    loading.value = true
    try {
        const response = await memberApi.listProgrammeEntries(organisationId)
        items.value = response.data.data || []
    } finally {
        loading.value = false
    }
  }

  return { items, loading, fetchEntries }
})
