export type UserRole = 'nep_admin' | 'nep_coordinator' | 'member_org'

export type UserStatus = 'active' | 'inactive'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
  organisation_id: number | null
  organisation: {
    id: number
    name: string
  } | null
  created_at: string
  updated_at: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password?: string
  role: UserRole
  organisation_id: number | null
}

export interface UpdateUserPayload {
  name: string
  email: string
  role: UserRole
  organisation_id: number | null
  password?: string
  status?: UserStatus
}

export interface AdminUserActionResponse {
  message: string
  user?: User
  temporary_password?: string
}

/** Shape returned by the API list endpoint */
export interface UserListResponse {
  current_page: number
  data: User[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: any[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

