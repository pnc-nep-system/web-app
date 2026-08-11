export type MailEncryption = 'tls' | 'starttls' | 'ssl' | 'none'

/**
 * Every field except `to` is optional — leaving one out falls back to
 * whatever's currently configured in the backend's .env, so an admin can
 * either verify the live config with just a recipient, or override any
 * subset of fields to try a prospective SMTP setup before saving it
 * anywhere.
 */
export interface MailTestPayload {
  host?: string
  port?: number
  encryption?: MailEncryption | ''
  username?: string
  password?: string
  from_address?: string
  from_name?: string
  to: string
}

export interface MailTestResponse {
  success: boolean
  message: string
  category?: string
}
