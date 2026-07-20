export interface AppNotification {
  id: string
  type: 'programme_sent' | string
  title: string
  message: string
  programme_entry_id: number
  read_at: string | null
  created_at: string
}

// Shape broadcast by the backend on .programme.draft.created
export interface ProgrammeDraftCreatedPayload {
  notification_id: string
  programme_entry_id: number
  programme_name: string
  message: string
}
