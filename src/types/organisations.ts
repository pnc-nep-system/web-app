export interface Organisation {
  id: number
  name: string
  contact_name: string
  email: string
  member_since: number
  status: 'active' | 'inactive'
  last_inactive_at: string | null
  users_count: number
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface OrganisationForm {
  name: string
  contact_name: string
  email: string
  member_since: number
  logoFile?: File | null
}