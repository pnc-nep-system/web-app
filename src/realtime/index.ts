import { getEcho, disconnectEcho } from './echo'
import { useTaxonomyStore } from '@/stores/taxonomy'
import { useNotificationStore } from '@/stores/notification'
import type { ProgrammeDraftCreatedPayload } from '@/types/notification'

let subscribed = false
let subscribedChannels: string[] = []

interface OtherQueueCreatedPayload {
  id: number
  other_text: string
  programme_entry_id?: number
}

export async function connectRealtimeForRole(role?: string, userId?: string | null) {
  if (subscribed) return

  const echo = await getEcho()

  if (role === 'nep_admin' || role === 'nep_coordinator') {
    const taxonomy = useTaxonomyStore()
    echo.private('nep-admin')
      .listen('.other.queue.created', (payload: OtherQueueCreatedPayload) => {
        taxonomy.upsertOtherQueueEntry({
          id: payload.id,
          text: payload.other_text,
          suggestedCategory: 'New activity',
          frequency: 1,
          status: 'pending',
        })
      })
    subscribedChannels.push('private-nep-admin')
  }

  if (role === 'member_org' && userId) {
    const notificationStore = useNotificationStore()
    const channelName = `App.Models.User.${userId}`
    console.log('[Realtime] Subscribing to channel:', channelName)
    echo.private(channelName)
      .listen('.programme.draft.created', (payload: ProgrammeDraftCreatedPayload) => {
        console.log('[Realtime] Event received:', payload)
        notificationStore.pushNotification({
          id: payload.notification_id,
          type: 'programme_sent',
          title: `New programme: ${payload.programme_name}`,
          message: payload.message,
          programme_entry_id: payload.programme_entry_id,
          advisory_note_id: null,
          read_at: null,
          created_at: new Date().toISOString(),
        })
      })
      .listen('.advice.delivered', (payload: any) => {
        notificationStore.pushNotification({
          id: payload.notification_id ?? String(Date.now()),
          type: 'advice_delivered',
          title: payload.title ?? 'Coordination advice delivered',
          message: payload.message,
          programme_entry_id: payload.programme_entry_id ?? null,
          advisory_note_id: payload.advisory_note_id ?? null,
          read_at: null,
          created_at: new Date().toISOString(),
        })
      })
    subscribedChannels.push(`private-${channelName}`)
  }

  subscribed = true
}

export function disconnectRealtime() {
  if (!subscribed) return

  const globalEcho = (window as any).Echo
  if (globalEcho) {
    subscribedChannels.forEach(ch => {
      try { globalEcho.leave(ch) } catch (err) {
        console.error('Failed to leave realtime channel:', ch, err)
      }
    })
  }
  disconnectEcho()
  subscribed = false
  subscribedChannels = []
}
