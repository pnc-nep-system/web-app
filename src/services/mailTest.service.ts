import api from '../api/axios'
import type { MailTestPayload, MailTestResponse } from '@/types/mailTest'

export const mailTestService = {
  /** Send a test email using either the given SMTP overrides or the live .env config for any field left out. */
  send(payload: MailTestPayload) {
    return api.post<MailTestResponse>('/admin/mail/test', payload)
  },
}
