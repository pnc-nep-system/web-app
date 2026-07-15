import api from './axios'
import type {
  User,
  UserListResponse,
  CreateUserPayload,
  UpdateUserPayload,
  AdminUserActionResponse,
} from '@/types/user'

export interface OrganisationOption {
  id: number
  name: string
}

/**
 * HTTP service for the admin user-management endpoints.
 */
export const userService = {
  /** Fetch the paginated list of system users with admin-only filters. */
  getUsers(
    page = 1,
    search = '',
    filters: { role?: string; status?: string; per_page?: number } = {},
  ) {
    return api.get<UserListResponse>('/admin/users', {
      params: {
        page,
        search,
        ...filters,
      },
    })
  },

  /** Get details of a specific user. */
  getUser(id: number) {
    return api.get<User>(`/admin/users/${id}`)
  },

  /** Create a new user account. */
  createUser(payload: CreateUserPayload) {
    return api.post<AdminUserActionResponse>('/admin/users', payload)
  },

  /** Update an existing user's profile. */
  updateUser(id: number, payload: UpdateUserPayload) {
    return api.patch<AdminUserActionResponse>(`/admin/users/${id}`, payload)
  },

  /** Deactivate a user account. */
  deactivateUser(id: number) {
    return api.post<AdminUserActionResponse>(`/admin/users/${id}/deactivate`)
  },

  /** Reactivate a user account. */
  reactivateUser(id: number) {
    return api.post<AdminUserActionResponse>(`/admin/users/${id}/reactivate`)
  },

  /** Reset a user's credentials and revoke their current tokens. */
  resetCredentials(id: number) {
    return api.post<AdminUserActionResponse>(`/admin/users/${id}/reset-credentials`)
  },

  /** Fetch available organisations for selection. */
  getOrganisations() {
    return api.get<{ data: OrganisationOption[] }>('/organisations')
  },
}

