import type { Organisation } from './organisations'
import type { Role } from './role'

export type OrganisationOption = Pick<Organisation, 'id' | 'name'>

// `role` used to be a fixed 3-value enum; it's now any role name that exists
// in the `roles` table (Role Management can create custom roles), so this is
// deliberately widened to `string` rather than a fixed union. The three
// well-known names are still useful as constants for UI-only branching (e.g.
// which dashboard layout to link to) — see `LEGACY_ROLES` below.
export type UserRole = string

export const LEGACY_ROLES = {
  ADMIN: 'nep_admin',
  COORDINATOR: 'nep_coordinator',
  MEMBER: 'member_org',
} as const

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
  /** Granular roles assigned via Role Management — kept in sync with `role` plus any extra custom roles. */
  roles?: Role[]
  /** Only present on the single-user GET /admin/users/{id} response. */
  effective_permissions?: string[]
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

