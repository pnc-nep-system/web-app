import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Temporary mock for users
export const useUsersStore = defineStore('users', () => {
  const items = ref([
    { id: 'u1', name: 'Coordinator', email: 'programmes@riverkids.org', password: 'demo1234', role: 'manager', status: 'active' },
    { id: 'u2', name: 'Admin', email: 'admin@riverkids.org', password: 'demo1234', role: 'admin', status: 'active' },
    { id: 'u3', name: 'User', email: 'test@example.com', password: 'password123', role: 'user', status: 'active' }
  ])

  function byEmail(email: string) {
    return items.value.find((u) => u.email.toLowerCase() === email.toLowerCase())
  }

  function byId(id: string) {
    return items.value.find((u) => u.id === id)
  }

  return { items, byEmail, byId }
})
