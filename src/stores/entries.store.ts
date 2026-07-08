import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { memberApi } from '@/api/member.api'
import type { ProgrammeIdentity } from '@/types/programme'

export const useEntriesStore = defineStore('entries', () => {
  const items = ref<ProgrammeIdentity[]>([])
  const loading = ref(false)

  async function fetchEntries() {
    loading.value = true
    try {
        const response = await memberApi.listProgrammeEntries()
        // Assuming response.data is the list
        items.value = response.data
    } finally {
        loading.value = false
    }
  }

  return { items, loading, fetchEntries }
})
