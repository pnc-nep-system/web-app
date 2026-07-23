import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import type { AppNotification } from '@/types/notification'

export function useNotificationBell() {
  const router = useRouter()
  const store = useNotificationStore()

  const open = ref(false)
  const bellRef = ref<HTMLElement | null>(null)
  const isRinging = ref(false)
  const incomingAlert = ref<{
    id: string
    title: string
    message: string
    notification: AppNotification
  } | null>(null)

  let alertTimer: ReturnType<typeof setTimeout> | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let loaded = false
  const seenIds = new Set<string>()

  function onOutsideClick(e: MouseEvent) {
    if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
      open.value = false
    }
  }

  function triggerRing() {
    isRinging.value = false
    requestAnimationFrame(() => { isRinging.value = true })
    setTimeout(() => { isRinging.value = false }, 1000)
  }

  function showAlert(id: string, title: string, message: string, notification: AppNotification) {
    if (alertTimer) clearTimeout(alertTimer)
    incomingAlert.value = { id, title, message, notification }
    alertTimer = setTimeout(dismissAlert, 6000)
  }

  function dismissAlert() {
    if (alertTimer) clearTimeout(alertTimer)
    incomingAlert.value = null
  }

  function navigateTo(n: AppNotification) {
    if (n.type === 'adviser_submission_assigned' && n.advisory_note_id) {
      router.push(`/adviser/${n.advisory_note_id}`)
    } else if (n.programme_entry_id) {
      router.push({ path: '/entries/new', query: { id: n.programme_entry_id } })
    }
  }

  async function openFromAlert() {
    if (!incomingAlert.value) return
    const { id, notification } = incomingAlert.value
    dismissAlert()
    await store.markRead(id)
    navigateTo(notification)
  }

  async function handleNotificationClick(n: AppNotification) {
    await store.markRead(n.id)
    open.value = false
    navigateTo(n)
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function checkForNew() {
    if (!loaded) return
    for (const item of store.items) {
      if (item.read_at) continue
      if (seenIds.has(item.id)) continue
      seenIds.add(item.id)
      triggerRing()
      showAlert(item.id, item.title, item.message, item)
      break
    }
  }

  // Watch items length — fires whenever an item is added
  watch(() => store.items.length, checkForNew)

  // Also watch the first item id in case length stays same but item changes
  watch(() => store.items[0]?.id, checkForNew)

  onMounted(async () => {
    document.addEventListener('click', onOutsideClick)
    await store.fetchNotifications()
    // Alert the first unread notification on load (e.g. assigned while logged out)
    const firstUnread = store.items.find(n => !n.read_at)
    if (firstUnread) {
      loaded = true
      store.items.forEach(n => seenIds.add(n.id))
      triggerRing()
      showAlert(firstUnread.id, firstUnread.title, firstUnread.message, firstUnread)
    } else {
      store.items.forEach(n => seenIds.add(n.id))
      loaded = true
    }
    pollTimer = setInterval(async () => {
      await store.fetchNotifications()
      checkForNew()
    }, 15_000)
  })

  onUnmounted(() => {
    document.removeEventListener('click', onOutsideClick)
    if (alertTimer) clearTimeout(alertTimer)
    if (pollTimer) clearInterval(pollTimer)
  })

  return {
    store,
    open,
    bellRef,
    isRinging,
    incomingAlert,
    dismissAlert,
    openFromAlert,
    handleNotificationClick,
    formatTime,
  }
}
