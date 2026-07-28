import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationApi } from '@/api/notification.api'
import type { AppNotification } from '@/types/notification'

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>([])
  const loading = ref(false)
  const hasLoaded = ref(false)
  let fetchPromise: Promise<void> | null = null
  let initialised = false

  const unreadCount = computed(() => items.value.filter(n => !n.read_at).length)

  async function fetchNotifications() {
    if (fetchPromise) return fetchPromise
    loading.value = true
    fetchPromise = (async () => {
      try {
        const res = await notificationApi.list()
        const fresh = res.data.data ?? []
        const existingIds = new Set(items.value.map(n => n.id))
        const incoming = fresh.filter(n => !existingIds.has(n.id))
        if (incoming.length > 0) {
          items.value = [...incoming, ...items.value]
        }
        fresh.forEach(n => {
          const existing = items.value.find(i => i.id === n.id)
          if (existing && existing.read_at !== n.read_at) existing.read_at = n.read_at
        })
        hasLoaded.value = true
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()
    return fetchPromise
  }

  async function init() {
    if (initialised) return
    initialised = true
    await fetchNotifications()
  }

  function stopPolling() {
    initialised = false
  }

  const _markReadPromises = new Map<string, Promise<void>>()

  async function markRead(id: string) {
    const n = items.value.find(n => n.id === id)
    if (n?.read_at) return
    if (_markReadPromises.has(id)) return _markReadPromises.get(id)
    const p: Promise<void> = notificationApi.markRead(id)
      .then(() => { if (n) n.read_at = new Date().toISOString() })
      .finally(() => _markReadPromises.delete(id))
    _markReadPromises.set(id, p)
    return p
  }

  async function markAllRead() {
    await notificationApi.markAllRead()
    items.value.forEach(n => { n.read_at = n.read_at ?? new Date().toISOString() })
  }

  function pushNotification(notification: AppNotification) {
    if (items.value.find(n => n.id === notification.id)) return
    items.value.unshift(notification)
  }

  return { items, loading, hasLoaded, unreadCount, fetchNotifications, init, stopPolling, markRead, markAllRead, pushNotification }
})
