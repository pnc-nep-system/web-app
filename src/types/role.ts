export interface Permission {
  id: number
  name: string
  display_name: string
  group: string
  description: string | null
  created_at?: string
  updated_at?: string
}

/** Permissions grouped by module, as returned by GET /admin/permissions */
export type GroupedPermissions = Record<string, Permission[]>

export interface RoleUser {
  id: number
  name: string
  email: string
}

export interface Role {
  id: number
  name: string
  display_name: string
  description: string | null
  is_system: boolean
  users_count?: number
  permissions: Permission[]
  users?: RoleUser[]
  created_at?: string
  updated_at?: string
}

export interface CreateRolePayload {
  name: string
  display_name: string
  description?: string | null
  is_system?: boolean
  permissions?: number[]
}

export interface UpdateRolePayload {
  display_name?: string
  description?: string | null
  permissions?: number[]
}

export interface CreatePermissionPayload {
  name: string
  display_name: string
  group: string
  description?: string | null
}

export interface UpdatePermissionPayload {
  display_name?: string
  group?: string
  description?: string | null
}
