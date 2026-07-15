import { getEcho, disconnectEcho } from './echo'
import { useTaxonomyStore } from '@/stores/taxonomy'

let subscribed = false

interface OtherQueueCreatedPayload {
  id: number
  other_text: string
  programme_entry_id?: number
}

export function connectRealtimeForRole(role?: string) {
  if (role !== 'nep_admin' && role !== 'nep_coordinator') return
  if (subscribed) return

  const taxonomy = useTaxonomyStore()
  const echo = getEcho()

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

  subscribed = true
}

export function disconnectRealtime() {
  if (!subscribed) return

  getEcho().leave('private-nep-admin')
  disconnectEcho()
  subscribed = false
}
