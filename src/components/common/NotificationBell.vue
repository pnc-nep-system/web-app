<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseIcon from '@/components/common/BaseIcon.vue'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const store = useNotificationStore()
const open = ref(false)
const bellRef = ref<HTMLElement | null>(null)
const isRinging = ref(false)
const alert = ref<{ id: string; title: string; message: string; programme_entry_id: number } | null>(null)
let alertTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  store.fetchNotifications()
  document.addEventListener('click', onOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutsideClick)
  if (alertTimer) clearTimeout(alertTimer)
})

// Watch for new incoming notifications (unread count going up)
watch(
  () => store.items[0],
  (newest, prev) => {
    if (!newest || newest.read_at) return
    if (prev && prev.id === newest.id) return
    // Ring the bell
    isRinging.value = false
    requestAnimationFrame(() => { isRinging.value = true })
    setTimeout(() => { isRinging.value = false }, 1000)
    // Show alert banner
    showAlert(newest.id, newest.title, newest.message, newest.programme_entry_id)
  }
)

function showAlert(id: string, title: string, message: string, programme_entry_id: number) {
  if (alertTimer) clearTimeout(alertTimer)
  alert.value = { id, title, message, programme_entry_id }
  alertTimer = setTimeout(() => { alert.value = null }, 6000)
}

function dismissAlert() {
  if (alertTimer) clearTimeout(alertTimer)
  alert.value = null
}

async function openFromAlert() {
  if (!alert.value) return
  const { id, programme_entry_id } = alert.value
  dismissAlert()
  await store.markRead(id)
  router.push({ path: '/entries/new', query: { id: programme_entry_id } })
}

function onOutsideClick(e: MouseEvent) {
  if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

async function handleClick(id: string, programmeEntryId: number) {
  await store.markRead(id)
  open.value = false
  router.push({ path: '/entries/new', query: { id: programmeEntryId } })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <!-- Incoming notification alert banner (Teleport to body so it floats above everything) -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="alert"
        class="fixed bottom-6 right-6 z-[9999] w-80 bg-white rounded-xl shadow-xl border border-teal-100 overflow-hidden"
      >
        <div class="flex items-start gap-3 px-4 py-3.5">
          <div class="shrink-0 w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 mt-0.5">
            <BaseIcon name="bell" size="14" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-gray-800 truncate">{{ alert.title }}</p>
            <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ alert.message }}</p>
            <button
              class="mt-2 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              @click="openFromAlert"
            >
              View programme →
            </button>
          </div>
          <button
            class="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
            @click="dismissAlert"
          >
            <BaseIcon name="x" size="14" />
          </button>
        </div>
        <!-- Progress bar auto-dismiss -->
        <div class="h-0.5 bg-teal-500 origin-left animate-shrink" />
      </div>
    </Transition>
  </Teleport>

  <!-- Bell button + dropdown -->
  <div ref="bellRef" class="relative">
    <button
      class="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      @click="open = !open"
      aria-label="Notifications"
    >
      <span :class="isRinging ? 'animate-ring' : ''" class="inline-flex">
        <BaseIcon name="bell" size="18" />
      </span>
      <span
        v-if="store.unreadCount > 0"
        class="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
      >
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span class="text-sm font-semibold text-gray-800">Notifications</span>
        <button
          v-if="store.unreadCount > 0"
          class="text-xs text-teal-600 hover:text-teal-700 font-medium"
          @click="store.markAllRead()"
        >
          Mark all read
        </button>
      </div>

      <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
        <div v-if="store.loading" class="flex items-center justify-center py-8">
          <svg class="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <div v-else-if="store.items.length === 0" class="py-8 text-center text-sm text-gray-400">
          No notifications
        </div>

        <button
          v-for="n in store.items"
          :key="n.id"
          class="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
          :class="{ 'bg-teal-50/60': !n.read_at }"
          @click="handleClick(n.id, n.programme_entry_id)"
        >
          <div class="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
            <BaseIcon name="file" size="13" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-gray-800 truncate">{{ n.title }}</p>
            <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ n.message }}</p>
            <p class="text-[10px] text-gray-400 mt-1">{{ formatTime(n.created_at) }}</p>
          </div>
          <span v-if="!n.read_at" class="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-teal-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes ring {
  0%   { transform: rotate(0deg); }
  15%  { transform: rotate(20deg); }
  30%  { transform: rotate(-18deg); }
  45%  { transform: rotate(14deg); }
  60%  { transform: rotate(-10deg); }
  75%  { transform: rotate(6deg); }
  90%  { transform: rotate(-3deg); }
  100% { transform: rotate(0deg); }
}

@keyframes shrink {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

.animate-ring {
  animation: ring 0.9s ease-in-out;
  transform-origin: top center;
  display: inline-block;
}

.animate-shrink {
  animation: shrink 6s linear forwards;
}
</style>
