import { defineStore } from 'pinia'
import { ref } from 'vue'
import { memberApi } from '@/api/member.api'

export const useOrganisationsStore = defineStore('organisations', () => {
  const items = ref<any[]>([])

  async function fetch() {
    try {
      const response = await memberApi.listOrganisations()
      const data = response.data.data ?? response.data ?? []
      items.value = Array.isArray(data) ? data : []
    } catch {
      items.value = []
    }
  }

  function byId(id: number | string) {
    return items.value.find((o) => String(o.id) === String(id)) || null
  }

  function nameOf(id: number | string): string {
    const org = byId(id)
    return org?.name || org?.organisation_name || ''
  }

  return {
    items,
    fetch,
    byId,
    nameOf,
  }
})
