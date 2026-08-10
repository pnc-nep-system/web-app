import type { Organisation } from './organisations'

export type OrganisationOption = Pick<Organisation, 'id' | 'name'>

export type UserRole = 'nep_admin' | 'nep_coordinator' | 'member_org'

export type UserStatus = 'active' | 'inactive'

export interface Permission {
  id: number
  name: string
  display_name: string
  group: string
  description?: string | null
}

export interface Role {
  id: number
  name: string
  display_name: string
  description?: string | null
  is_system: boolean
  permissions?: Permission[]
  users_count?: number
}

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
  roles?: Role[]
  /** Individually-assigned permissions (authoritative when present). */
  permissions?: Permission[]
  created_at: string
  updated_at: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password?: string
  role: UserRole
  organisation_id: number | null
  /** Permission IDs to assign directly to this user. */
  permissions?: number[]
}

export interface UpdateUserPayload {
  name: string
  email: string
  role: UserRole
  organisation_id: number | null
  password?: string
  status?: UserStatus
  /** Permission IDs; an empty array clears individually assigned permissions. */
  permissions?: number[]
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
  links: unknown[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}
