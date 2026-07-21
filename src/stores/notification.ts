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
      items.value = res.data.data ?? []
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
