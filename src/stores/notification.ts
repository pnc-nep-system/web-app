import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationApi } from '@/api/notification.api'
import type { AppNotification } from '@/types/notification'

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])
  const loading = ref(false)

  const unreadCount = computed(() => items.value.filter(n => !n.read_at).length)

  async function fetchNotifications() {
    loading.value = true
    try {
      const res = await notificationApi.list()
      const fresh = res.data.data ?? []
      // Merge: prepend any IDs not already in items so watchers fire reliably
      const existingIds = new Set(items.value.map(n => n.id))
      const incoming = fresh.filter(n => !existingIds.has(n.id))
      if (incoming.length > 0) {
        items.value = [...incoming, ...items.value]
      }
      // Always sync read_at changes from server
      fresh.forEach(n => {
        const existing = items.value.find(i => i.id === n.id)
        if (existing && existing.read_at !== n.read_at) existing.read_at = n.read_at
      })
    } finally {
      loading.value = false
    }
  }

  async function markRead(id: string) {
    await notificationApi.markRead(id)
    const n = items.value.find(n => n.id === id)
    if (n) n.read_at = new Date().toISOString()
  }

  async function markAllRead() {
    await notificationApi.markAllRead()
    items.value.forEach(n => { n.read_at = n.read_at ?? new Date().toISOString() })
  }

  function pushNotification(notification: AppNotification) {
    if (items.value.find(n => n.id === notification.id)) return
    items.value.unshift(notification)
  }

  return { items, loading, unreadCount, fetchNotifications, markRead, markAllRead, pushNotification }
})
