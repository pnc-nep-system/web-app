import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'

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
    programme_entry_id: number
  } | null>(null)

  let alertTimer: ReturnType<typeof setTimeout> | null = null
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

  function showAlert(id: string, title: string, message: string, programme_entry_id: number) {
    if (alertTimer) clearTimeout(alertTimer)
    incomingAlert.value = { id, title, message, programme_entry_id }
    alertTimer = setTimeout(dismissAlert, 6000)
  }

  function dismissAlert() {
    if (alertTimer) clearTimeout(alertTimer)
    incomingAlert.value = null
  }

  async function openFromAlert() {
    if (!incomingAlert.value) return
    const { id, programme_entry_id } = incomingAlert.value
    dismissAlert()
    await store.markRead(id)
    router.push({ path: '/entries/new', query: { id: programme_entry_id } })
  }

  async function handleNotificationClick(id: string, programmeEntryId: number) {
    await store.markRead(id)
    open.value = false
    router.push({ path: '/entries/new', query: { id: programmeEntryId } })
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
      showAlert(item.id, item.title, item.message, item.programme_entry_id)
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
    store.items.forEach(n => seenIds.add(n.id))
    loaded = true
  })

  onUnmounted(() => {
    document.removeEventListener('click', onOutsideClick)
    if (alertTimer) clearTimeout(alertTimer)
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
