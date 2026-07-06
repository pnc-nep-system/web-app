import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Temporary mock for users
export const useUsersStore = defineStore('users', () => {
  const items = ref([
    { id: 'u1', name: 'Coordinator', email: 'coordinator@nep-cambodia.org', password: 'demo1234', role: 'coordinator', status: 'active' },
    { id: 'u2', name: 'Admin', email: 'admin@nep-cambodia.org', password: 'demo1234', role: 'admin', status: 'active' }
  ])

  function byEmail(email: string) {
    return items.value.find((u) => u.email.toLowerCase() === email.toLowerCase())
  }

  function byId(id: string) {
    return items.value.find((u) => u.id === id)
  }

  return { items, byEmail, byId }
})
