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

  function navigateTo(n: AppNotification) {
    if (n.type === 'adviser_submission_assigned' && n.advisory_note_id) {
      router.push(`/adviser/${n.advisory_note_id}`)
    } else if (n.programme_entry_id) {
      router.push({ path: '/entries/new', query: { id: n.programme_entry_id } })
    }
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
    if (pollTimer) clearInterval(pollTimer)
  })

  return {
    store,
    open,
    bellRef,
    isRinging,
    handleNotificationClick,
    formatTime,
  }
}
